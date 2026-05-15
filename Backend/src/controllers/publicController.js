const QrCodeModel = require('../models/QrCode');
const Customer = require('../models/Customer');
const EmergencyContact = require('../models/EmergencyContact');
const OtpLog = require('../models/OtpLog');
const ScanLog = require('../models/ScanLog');
const generateOtp = require('../utils/generateOtp');
const asyncHandler = require('../utils/asyncHandler');
const { sendMockSms, sendMockEmail } = require('../services/notificationService');
const { sendOtpSms } = require('../services/smsService');

const getQrStatus = asyncHandler(async (req, res) => {
  const { qrId } = req.params;

  const qr = await QrCodeModel.findOne({ qrId });

  if (!qr) {
    return res.status(404).json({
      success: false,
      message: 'QR not found'
    });
  }

  let redirectPath = `/activate/${qrId}`;

  if (qr.status === 'blocked') {
    redirectPath = `/blocked/${qrId}`;
  } else if (qr.warrantyStatus === 'registered' && qr.emergencyStatus === 'active') {
    redirectPath = `/emergency/${qrId}`;
  } else {
    redirectPath = `/activate/${qrId}`;
  }

  res.json({
    success: true,
    data: {
      qrId: qr.qrId,
      status: qr.status,
      warrantyStatus: qr.warrantyStatus || 'pending',
      emergencyStatus: qr.emergencyStatus || 'inactive',
      redirectPath
    }
  });
});

const sendOtp = asyncHandler(async (req, res) => {
  const { qrId, mobile } = req.body;

  const cleanQrId = String(qrId || '').trim().toUpperCase();
  const cleanMobile = String(mobile || '').trim();

  if (!cleanQrId || !cleanMobile) {
    return res.status(400).json({
      success: false,
      message: 'QR ID and mobile number are required'
    });
  }

  if (!/^[0-9]{10}$/.test(cleanMobile)) {
    return res.status(400).json({
      success: false,
      message: 'Enter valid 10 digit mobile number'
    });
  }

  const qr = await QrCodeModel.findOne({ qrId: cleanQrId });

  if (!qr) {
    return res.status(404).json({
      success: false,
      message: 'QR not found'
    });
  }

  if (qr.status === 'blocked') {
    return res.status(400).json({
      success: false,
      message: 'QR is blocked'
    });
  }

  if (qr.status === 'expired') {
    return res.status(400).json({
      success: false,
      message: 'QR is expired'
    });
  }

  if (qr.status === 'scrapped') {
    return res.status(400).json({
      success: false,
      message: 'QR is scrapped'
    });
  }

  if (qr.emergencyStatus === 'active') {
    return res.status(400).json({
      success: false,
      message: 'Emergency profile is already active'
    });
  }

  const latestOtp = await OtpLog.findOne({
    qrId: cleanQrId,
    mobile: cleanMobile
  }).sort({ createdAt: -1 });

  if (latestOtp) {
    const secondsSinceLastOtp = Math.floor(
      (Date.now() - new Date(latestOtp.createdAt).getTime()) / 1000
    );

    const cooldownSeconds = 60;

    if (secondsSinceLastOtp < cooldownSeconds) {
      return res.status(429).json({
        success: false,
        message: `Please wait ${cooldownSeconds - secondsSinceLastOtp}s before requesting OTP again`
      });
    }
  }

  const otpCode = generateOtp();
  const expiryMinutes = Number(process.env.OTP_EXPIRY_MINUTES || 5);
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

  await OtpLog.create({
    qrId: cleanQrId,
    mobile: cleanMobile,
    otpCode,
    expiresAt,
    verified: false,
    attempts: 0
  });

  if (qr.status === 'inactive') {
    qr.status = 'otp_pending';
    await qr.save();
  }

  try {
    const smsResult = await sendOtpSms(cleanMobile, otpCode);

    console.log('Fast2SMS OTP result:', {
      qrId: cleanQrId,
      mobile: cleanMobile,
      result: smsResult
    });
  } catch (smsError) {
    console.error('OTP SMS send failed:', {
      qrId: cleanQrId,
      mobile: cleanMobile,
      message: smsError.message,
      response: smsError?.response?.data
    });

    return res.status(500).json({
      success: false,
      message: 'OTP SMS failed. Please try again.'
    });
  }

  res.json({
    success: true,
    message: 'OTP sent successfully',
    qrId: cleanQrId,
    mobile: cleanMobile,
    ...(process.env.NODE_ENV !== 'production' ? { testOtp: otpCode } : {})
  });
});

const verifyOtp = asyncHandler(async (req, res) => {
  const { qrId, mobile, otp } = req.body;

  const cleanQrId = String(qrId || '').trim().toUpperCase();
  const cleanMobile = String(mobile || '').trim();
  const cleanOtp = String(otp || '').trim();

  if (!cleanQrId || !cleanMobile || !cleanOtp) {
    return res.status(400).json({
      success: false,
      message: 'QR ID, mobile and OTP are required'
    });
  }

  const otpLog = await OtpLog.findOne({
    qrId: cleanQrId,
    mobile: cleanMobile,
    verified: false
  }).sort({ createdAt: -1 });

  if (!otpLog) {
    return res.status(404).json({
      success: false,
      message: 'OTP not found'
    });
  }

  if (otpLog.expiresAt < new Date()) {
    return res.status(400).json({
      success: false,
      message: 'OTP expired'
    });
  }

  otpLog.attempts += 1;

  if (otpLog.attempts > 5) {
    await otpLog.save();

    return res.status(400).json({
      success: false,
      message: 'Too many attempts'
    });
  }

  if (otpLog.otpCode !== cleanOtp) {
    await otpLog.save();

    return res.status(400).json({
      success: false,
      message: 'Invalid OTP'
    });
  }

  otpLog.verified = true;
  await otpLog.save();

  res.json({
    success: true,
    message: 'OTP verified successfully',
    qrId: cleanQrId,
    mobile: cleanMobile,
    verified: true
  });
});

const registerCustomer = asyncHandler(async (req, res) => {
  const {
    qrId,
    customerName,
    mobileNumber,
    email = '',
    bloodGroup = '',
    disease = '',
    address = '',
    vehicleName = '',
    chassisNumber = '',
    motorNumber = '',
    showroomName = '',
    contacts = []
  } = req.body;

  if (
    !qrId ||
    !customerName ||
    !mobileNumber ||
    !vehicleName ||
    !chassisNumber ||
    !motorNumber ||
    !showroomName
  ) {
    return res.status(400).json({
      success: false,
      message:
        'qrId, customerName, mobileNumber, vehicleName, chassisNumber, motorNumber and showroomName are required'
    });
  }

  if (!Array.isArray(contacts) || contacts.length !== 3) {
    return res.status(400).json({
      success: false,
      message: 'Exactly 3 emergency contacts are required'
    });
  }

  const qr = await QrCodeModel.findOne({ qrId });

  if (!qr) {
    return res.status(404).json({
      success: false,
      message: 'QR not found'
    });
  }

  if (qr.status === 'blocked') {
    return res.status(400).json({
      success: false,
      message: 'QR is blocked'
    });
  }

  if (qr.warrantyStatus !== 'registered') {
    return res.status(400).json({
      success: false,
      message: 'Warranty registration is required before emergency profile activation'
    });
  }

  if (qr.emergencyStatus === 'active') {
    return res.status(400).json({
      success: false,
      message: 'Emergency profile is already active'
    });
  }

  const verifiedOtp = await OtpLog.findOne({
    qrId,
    mobile: mobileNumber,
    verified: true
  }).sort({ createdAt: -1 });

  if (!verifiedOtp) {
    return res.status(400).json({
      success: false,
      message: 'OTP verification required'
    });
  }

  const customerExists = await Customer.findOne({ qrId });

  if (customerExists) {
    return res.status(400).json({
      success: false,
      message: 'Customer already registered for this QR'
    });
  }

  const existingCustomerByVehicle = await Customer.findOne({
    $or: [{ chassisNumber }, { motorNumber }]
  });

  if (existingCustomerByVehicle) {
    return res.status(400).json({
      success: false,
      message: 'This chassis number or motor number is already registered'
    });
  }

  const customer = await Customer.create({
    qrId,
    customerName,
    mobileNumber,
    email,
    bloodGroup,
    disease,
    address,
    vehicleName,
    chassisNumber,
    motorNumber,
    showroomName,
    otpVerified: true,
    isActive: true
  });

  await EmergencyContact.create({
    qrId,
    contacts
  });

  qr.status = 'active';
  qr.emergencyStatus = 'active';
  qr.emergencyActivatedAt = new Date();
  qr.ownerMobile = mobileNumber;

  await qr.save();

  res.status(201).json({
    success: true,
    message: 'Emergency profile activated successfully.',
    customer
  });
});

const skipEmergency = asyncHandler(async (req, res) => {
  const qrId = String(req.params.qrId || '').trim().toUpperCase();

  const qr = await QrCodeModel.findOne({ qrId });

  if (!qr) {
    return res.status(404).json({
      success: false,
      message: 'QR not found'
    });
  }

  if (qr.status === 'blocked') {
    return res.status(400).json({
      success: false,
      message: 'QR is blocked'
    });
  }

  if (qr.warrantyStatus !== 'registered') {
    return res.status(400).json({
      success: false,
      message: 'Warranty registration required before skipping emergency profile'
    });
  }

  qr.status = 'active';
  qr.emergencyStatus = 'skipped';
  qr.emergencySkippedAt = new Date();

  await qr.save();

  res.json({
    success: true,
    message: 'Emergency profile skipped successfully',
    data: {
      qrId: qr.qrId,
      status: qr.status,
      warrantyStatus: qr.warrantyStatus,
      emergencyStatus: qr.emergencyStatus
    }
  });
});

const getEmergencyPage = asyncHandler(async (req, res) => {
  const { qrId } = req.params;

  const qr = await QrCodeModel.findOne({ qrId });

  if (!qr) {
    return res.status(404).json({
      success: false,
      message: 'QR not found'
    });
  }

  if (qr.status === 'blocked') {
    return res.status(403).json({
      success: false,
      message: 'QR is blocked'
    });
  }

  if (qr.warrantyStatus !== 'registered') {
    return res.status(400).json({
      success: false,
      message: 'Warranty registration is required'
    });
  }

  if (qr.emergencyStatus !== 'active') {
    return res.status(400).json({
      success: false,
      message: 'Emergency profile is not active'
    });
  }

  const customer = await Customer.findOne({ qrId });
  const contactDoc = await EmergencyContact.findOne({ qrId });

  if (!customer) {
    return res.status(404).json({
      success: false,
      message: 'Customer data not found'
    });
  }

  res.json({
    success: true,
    qrId,
    owner: {
      customerName: customer.customerName,
      mobileNumber: customer.mobileNumber,
      email: customer.email,
      bloodGroup: customer.bloodGroup,
      disease: customer.disease,
      address: customer.address,
      vehicleName: customer.vehicleName,
      chassisNumber: customer.chassisNumber,
      motorNumber: customer.motorNumber,
      showroomName: customer.showroomName
    },
    emergencyContacts: contactDoc?.contacts || [],
    actions: {
      police: '100',
      ambulance: '108'
    }
  });
});

const createScanLog = asyncHandler(async (req, res) => {
  const {
    qrId,
    scanType,
    latitude = null,
    longitude = null,
    alertSent = false
  } = req.body;

  if (!qrId || !scanType) {
    return res.status(400).json({
      success: false,
      message: 'qrId and scanType are required'
    });
  }

  const ipAddress = req.ip || req.socket.remoteAddress || '';
  const deviceInfo = req.headers['user-agent'] || '';

  const log = await ScanLog.create({
    qrId,
    scanType,
    latitude,
    longitude,
    ipAddress,
    deviceInfo,
    alertSent
  });

  res.status(201).json({
    success: true,
    message: 'Scan logged successfully',
    data: log
  });
});

const sendEmergencyAlert = asyncHandler(async (req, res) => {
  const { qrId, latitude = null, longitude = null } = req.body;

  if (!qrId) {
    return res.status(400).json({
      success: false,
      message: 'qrId is required'
    });
  }

  const qr = await QrCodeModel.findOne({ qrId });

  if (!qr) {
    return res.status(404).json({
      success: false,
      message: 'QR not found'
    });
  }

  if (qr.status === 'blocked') {
    return res.status(403).json({
      success: false,
      message: 'QR is blocked'
    });
  }

  if (qr.emergencyStatus !== 'active') {
    return res.status(400).json({
      success: false,
      message: 'Emergency profile is not active'
    });
  }

  const customer = await Customer.findOne({ qrId });
  const contactDoc = await EmergencyContact.findOne({ qrId });

  if (!customer) {
    return res.status(404).json({
      success: false,
      message: 'Customer not found'
    });
  }

  const contacts = contactDoc?.contacts || [];

  const locationText =
    latitude && longitude
      ? `Location: https://maps.google.com/?q=${latitude},${longitude}`
      : 'Location not available';

  const message = `Emergency alert for ${customer.customerName}, QR ${qrId}. ${locationText}`;

  await sendMockSms({
    qrId,
    recipientName: customer.customerName,
    recipientMobile: customer.mobileNumber,
    message
  });

  if (customer.email) {
    await sendMockEmail({
      qrId,
      recipientName: customer.customerName,
      recipientEmail: customer.email,
      message
    });
  }

  for (const contact of contacts) {
    await sendMockSms({
      qrId,
      recipientName: contact.name,
      recipientMobile: contact.mobile,
      message
    });

    if (contact.email) {
      await sendMockEmail({
        qrId,
        recipientName: contact.name,
        recipientEmail: contact.email,
        message
      });
    }
  }

  const ipAddress = req.ip || req.socket.remoteAddress || '';
  const deviceInfo = req.headers['user-agent'] || '';

  await ScanLog.create({
    qrId,
    scanType: 'emergency',
    latitude,
    longitude,
    ipAddress,
    deviceInfo,
    alertSent: true
  });

  res.json({
    success: true,
    message: 'Emergency alerts processed successfully',
    qrId,
    alertsSentTo: {
      ownerMobile: customer.mobileNumber,
      ownerEmail: customer.email || null,
      emergencyContactCount: contacts.length
    }
  });
});

module.exports = {
  getQrStatus,
  sendOtp,
  verifyOtp,
  registerCustomer,
  skipEmergency,
  getEmergencyPage,
  createScanLog,
  sendEmergencyAlert
};