const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');

const Admin = require('../models/admin');
const QrCodeModel = require('../models/QrCode');
const Warranty = require('../models/Warranty');
const ScanLog = require('../models/ScanLog');
const AuditLog = require('../models/AuditLog');

const generateQrId = require('../utils/generateQrId');
const asyncHandler = require('../utils/asyncHandler');

function signToken(admin) {
  return jwt.sign(
    { id: admin._id, username: admin.username, role: admin.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/* ---------------- LOGIN ---------------- */
const loginAdmin = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  const loginId = String(username || '').trim().toLowerCase();

  if (!loginId || !password) {
    return res.status(400).json({ message: 'Missing credentials' });
  }

  const admin = await Admin.findOne({ username: loginId });

  if (!admin || admin.isActive === false) {
    return res.status(401).json({ message: 'Invalid login' });
  }

  const ok = await bcrypt.compare(password, admin.passwordHash);

  if (!ok) {
    return res.status(401).json({ message: 'Invalid login' });
  }

  res.json({
    token: signToken(admin),
    admin: {
      id: admin._id,
      name: admin.name,
      username: admin.username,
      role: admin.role
    }
  });
});

/* ---------------- CREATE QR ---------------- */
const createQr = asyncHandler(async (req, res) => {
  const qrId = await generateQrId();
  const activationLink = `${process.env.APP_BASE_URL}/qr/${qrId}`;

  const qrImageDataUrl = await QRCode.toDataURL(activationLink);

  const qr = await QrCodeModel.create({
    qrId,
    qrImageDataUrl,
    activationLink,
    status: 'inactive',
    warrantyStatus: 'pending',
    createdBy: req.admin._id
  });

  await AuditLog.create({
    adminId: req.admin._id,
    action: 'CREATE_QR',
    qrId
  });

  res.status(201).json(qr);
});

/* ---------------- BULK CREATE ---------------- */
const bulkCreateQr = asyncHandler(async (req, res) => {
  let { count = 10 } = req.body;
  count = Number(count);

  if (!Number.isInteger(count) || count < 1 || count > 100) {
    return res.status(400).json({ message: 'Invalid count' });
  }

  const created = [];

  for (let i = 0; i < count; i++) {
    const qrId = await generateQrId();
    const activationLink = `${process.env.APP_BASE_URL}/qr/${qrId}`;
    const qrImageDataUrl = await QRCode.toDataURL(activationLink);

    const qr = await QrCodeModel.create({
      qrId,
      qrImageDataUrl,
      activationLink,
      status: 'inactive',
      warrantyStatus: 'pending',
      createdBy: req.admin._id
    });

    created.push(qr);
  }

  await AuditLog.create({
    adminId: req.admin._id,
    action: 'BULK_CREATE_QR',
    details: { count }
  });

  res.status(201).json({ count, data: created });
});

/* ---------------- DASHBOARD ---------------- */
const getDashboard = asyncHandler(async (req, res) => {
  const [
    totalQrs,
    activeQrs,
    inactiveQrs,
    blockedQrs,
    warrantyPending,
    warrantyRegistered,
    totalScans
  ] = await Promise.all([
    QrCodeModel.countDocuments(),
    QrCodeModel.countDocuments({ status: 'active' }),
    QrCodeModel.countDocuments({ status: 'inactive' }),
    QrCodeModel.countDocuments({ status: 'blocked' }),

    QrCodeModel.countDocuments({ warrantyStatus: 'pending' }),
    QrCodeModel.countDocuments({ warrantyStatus: 'registered' }),

    ScanLog.countDocuments()
  ]);

  res.json({
    totalQrs,
    activeQrs,
    inactiveQrs,
    blockedQrs,
    warrantyPending,
    warrantyRegistered,
    totalScans
  });
});

/* ---------------- LIST QRs ---------------- */
const listQrs = asyncHandler(async (req, res) => {
  const { status, warrantyStatus, search } = req.query;

  const match = {};

  if (status) match.status = status;
  if (warrantyStatus) match.warrantyStatus = warrantyStatus;

  if (search) {
    match.$or = [
      { qrId: { $regex: search, $options: 'i' } },
      { status: { $regex: search, $options: 'i' } },
      { warrantyStatus: { $regex: search, $options: 'i' } }
    ];
  }

  const data = await QrCodeModel.find(match).sort({ createdAt: -1 });

  res.json(data);
});

/* ---------------- GET QR ---------------- */
const getQrById = asyncHandler(async (req, res) => {
  const qr = await QrCodeModel.findById(req.params.id);
  if (!qr) return res.status(404).json({ message: 'Not found' });

  const warranty = await Warranty.findOne({ qrId: qr.qrId });

  res.json({ qr, warranty });
});

/* ---------------- UPDATE QR ---------------- */
const updateQr = asyncHandler(async (req, res) => {
  const qr = await QrCodeModel.findById(req.params.id);
  if (!qr) return res.status(404).json({ message: 'Not found' });

  const fields = ['status', 'warrantyStatus', 'blockedReason', 'ownerMobile'];

  fields.forEach(f => {
    if (req.body[f] !== undefined) qr[f] = req.body[f];
  });

  await qr.save();

  await AuditLog.create({
    adminId: req.admin._id,
    action: 'UPDATE_QR',
    qrId: qr.qrId,
    details: req.body
  });

  res.json(qr);
});

/* ---------------- QR DETAILS + WARRANTY ---------------- */
const updateQrDetails = asyncHandler(async (req, res) => {
  const qr = await QrCodeModel.findById(req.params.id);
  if (!qr) return res.status(404).json({ message: 'QR not found' });

  const {
    customerName = '',
    mobileNumber = '',
    vehicleName = '',
    chassisNumber = '',
    motorNumber = '',
    showroomName = ''
  } = req.body;

  if (!customerName || !mobileNumber) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  let warranty = await Warranty.findOne({ qrId: qr.qrId });

  const payload = {
    qrId: qr.qrId,
    customerName,
    mobileNumber,
    vehicleName,
    chassisNumber,
    motorNumber,
    showroomName,
    updatedAt: new Date()
  };

  if (!warranty) {
    warranty = await Warranty.create(payload);
  } else {
    Object.assign(warranty, payload);
    await warranty.save();
  }

  if (qr.status !== 'blocked') {
    qr.status = 'active';
    await qr.save();
  }

  await AuditLog.create({
    adminId: req.admin._id,
    action: 'UPDATE_QR_DETAILS',
    qrId: qr.qrId
  });

  res.json({ qr, warranty });
});

/* ---------------- BLOCK / UNBLOCK ---------------- */
const blockQr = asyncHandler(async (req, res) => {
  const { reason = '' } = req.body;

  const qr = await QrCodeModel.findById(req.params.id);
  if (!qr) return res.status(404).json({ message: 'Not found' });

  qr.status = 'blocked';
  qr.blockedReason = reason;
  await qr.save();

  res.json(qr);
});

const unblockQr = asyncHandler(async (req, res) => {
  const qr = await QrCodeModel.findById(req.params.id);
  if (!qr) return res.status(404).json({ message: 'Not found' });

  qr.status = 'inactive';
  qr.blockedReason = '';
  await qr.save();

  res.json(qr);
});

/* ---------------- RESET QR ---------------- */
const resetQr = asyncHandler(async (req, res) => {
  const qr = await QrCodeModel.findById(req.params.id);
  if (!qr) return res.status(404).json({ message: 'Not found' });

  await Warranty.deleteOne({ qrId: qr.qrId });

  await AuditLog.create({
    adminId: req.admin._id,
    action: 'RESET_QR',
    qrId: qr.qrId
  });

  res.json({ message: 'Reset complete', qr });
});

/* ---------------- LOGS ---------------- */
const getScanLogs = asyncHandler(async (req, res) => {
  const data = await ScanLog.find().sort({ createdAt: -1 });
  res.json(data);
});

const getAnalytics = asyncHandler(async (req, res) => {
  const statusCounts = await QrCodeModel.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  const warrantyCounts = await QrCodeModel.aggregate([
    { $group: { _id: '$warrantyStatus', count: { $sum: 1 } } }
  ]);

  res.json({ statusCounts, warrantyCounts });
});

module.exports = {
  loginAdmin,
  createQr,
  bulkCreateQr,
  getDashboard,
  listQrs,
  getQrById,
  updateQr,
  updateQrDetails,
  blockQr,
  unblockQr,
  resetQr,
  getScanLogs,
  getAnalytics
};