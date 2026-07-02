const QrCodeModel = require('../models/QrCode');
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



module.exports = {
  getQrStatus
};