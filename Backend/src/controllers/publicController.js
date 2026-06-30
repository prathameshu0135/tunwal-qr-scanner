const QrCodeModel = require('../models/QrCode');
const ScanLog = require('../models/ScanLog');
const asyncHandler = require('../utils/asyncHandler');

/**
 * GET /api/public/qr/:qrId/status
 * Returns QR status and frontend redirect.
 */
const getQrStatus = asyncHandler(async (req, res) => {
  const qrId = String(req.params.qrId || '').trim().toUpperCase();

  if (!qrId) {
    return res.status(400).json({
      success: false,
      message: 'QR ID is required'
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

  if (qr.status === 'expired') {
    return res.status(403).json({
      success: false,
      message: 'QR is expired'
    });
  }

  if (qr.status === 'scrapped') {
    return res.status(403).json({
      success: false,
      message: 'QR is scrapped'
    });
  }

  let redirectPath = `/activate/${qrId}`;

  if (qr.warrantyStatus === 'registered') {
    redirectPath = `/warranty-success/${qrId}`;
  }

  res.json({
    success: true,
    data: {
      qrId: qr.qrId,
      status: qr.status,
      warrantyStatus: qr.warrantyStatus,
      redirectPath
    }
  });
});

/**
 * POST /api/public/scan-log
 * Save QR scan history
 */
const createScanLog = asyncHandler(async (req, res) => {
  const {
    qrId,
    scanType,
    latitude,
    longitude
  } = req.body;

  await ScanLog.create({
    qrId,
    scanType,
    latitude,
    longitude
  });

  res.status(201).json({
    success: true,
    message: 'Scan log created successfully.'
  });
});

module.exports = {
  getQrStatus,
  createScanLog
};