const Warranty = require('../models/Warranty');
const QrCodeModel = require('../models/QrCode');
const AuditLog = require('../models/AuditLog');
const asyncHandler = require('../utils/asyncHandler');

/**
 * POST /api/warranty/register
 */
const registerWarranty = asyncHandler(async (req, res) => {
  const {
    qrId,
    scooterName,
    scooterColor,
    controllerNumber,
    batteryNumber,
    motorNumber,
    chassisNumber,
    chargerNumber,
    dealerName,
    customerName,
    contactNumber,
    dateOfSale,
    dealerAddress,
    state
  } = req.body;

  const normalizedQrId = String(qrId || '').trim().toUpperCase();

  if (
    !normalizedQrId ||
    !scooterName ||
    !scooterColor ||
    !controllerNumber ||
    !batteryNumber ||
    !motorNumber ||
    !chassisNumber ||
    !chargerNumber ||
    !dealerName ||
    !customerName ||
    !contactNumber ||
    !dateOfSale ||
    !dealerAddress ||
    !state
  ) {
    return res.status(400).json({
      success: false,
      message: 'All warranty fields are required'
    });
  }

  const qr = await QrCodeModel.findOne({ qrId: normalizedQrId });

  if (!qr) {
    return res.status(404).json({
      success: false,
      message: 'QR not found'
    });
  }

  if (['blocked', 'expired', 'scrapped'].includes(qr.status)) {
    return res.status(400).json({
      success: false,
      message: `This QR is ${qr.status}`
    });
  }

  if (qr.warrantyStatus === 'registered') {
    return res.status(400).json({
      success: false,
      message: 'Warranty already registered'
    });
  }

  const normalizedController = String(controllerNumber).trim().toUpperCase();
  const normalizedBattery = String(batteryNumber).trim().toUpperCase();
  const normalizedMotor = String(motorNumber).trim().toUpperCase();
  const normalizedChassis = String(chassisNumber).trim().toUpperCase();
  const normalizedCharger = String(chargerNumber).trim().toUpperCase();

  let warranty;

  try {
    warranty = await Warranty.create({
      qrId: normalizedQrId,
      scooterName: String(scooterName).trim(),
      scooterColor: String(scooterColor).trim(),
      controllerNumber: normalizedController,
      batteryNumber: normalizedBattery,
      motorNumber: normalizedMotor,
      chassisNumber: normalizedChassis,
      chargerNumber: normalizedCharger,
      dealerName: String(dealerName).trim(),
      customerName: String(customerName).trim(),
      contactNumber: String(contactNumber).trim(),
      dateOfSale,
      dealerAddress: String(dealerAddress).trim(),
      state: String(state).trim()
    });
  } catch (err) {

    if (err.code === 11000) {

      const field = Object.keys(err.keyPattern || {})[0];

      const messages = {
        qrId: 'This QR is already registered.',
        controllerNumber: 'Controller number already exists.',
        batteryNumber: 'Battery number already exists.',
        motorNumber: 'Motor number already exists.',
        chassisNumber: 'Chassis number already exists.',
        chargerNumber: 'Charger number already exists.'
      };

      return res.status(409).json({
        success: false,
        message: messages[field] || 'Duplicate record found.'
      });
    }

    throw err;
  }

  qr.status = 'active';
  qr.warrantyStatus = 'registered';
  qr.warrantyRegisteredAt = new Date();
  await qr.save();

  if (qr.createdBy) {
    await AuditLog.create({
      adminId: qr.createdBy,
      action: 'WARRANTY_REGISTERED',
      qrId: normalizedQrId,
      details: {
        customerName: warranty.customerName,
        contactNumber: warranty.contactNumber,
        scooterName: warranty.scooterName,
        chassisNumber: warranty.chassisNumber
      }
    });
  }

  return res.status(201).json({
    success: true,
    message: 'Warranty registered successfully.',
    data: {
      qrId: warranty.qrId,
      warrantyStatus: qr.warrantyStatus
    }
  });
});

/**
 * GET /api/warranty/basic/:qrId
 */
const getBasicWarranty = asyncHandler(async (req, res) => {
  const normalizedQrId = String(req.params.qrId || '').trim().toUpperCase();

  const qr = await QrCodeModel.findOne({ qrId: normalizedQrId });

  if (!qr) {
    return res.status(404).json({
      success: false,
      message: 'QR not found'
    });
  }
  
  if (['blocked', 'expired', 'scrapped'].includes(qr.status)) {
    return res.status(400).json({
      success: false,
      message: `This QR is ${qr.status}`
    });
  }

  if (qr.warrantyStatus !== 'registered') {
    return res.status(400).json({
      success: false,
      message: 'Warranty not registered'
    });
  }

  const warranty = await Warranty.findOne({ qrId: normalizedQrId });

  if (!warranty) {
    return res.status(404).json({
      success: false,
      message: 'Warranty record not found'
    });
  }

  return res.json({
    success: true,
    data: {
      qrId: warranty.qrId,
      customerName: warranty.customerName,
      mobileNumber: warranty.contactNumber,
      vehicleName: warranty.scooterName,
      chassisNumber: warranty.chassisNumber,
      motorNumber: warranty.motorNumber,
      showroomName: warranty.dealerName
    }

  });
});

module.exports = {
  registerWarranty,
  getBasicWarranty
};