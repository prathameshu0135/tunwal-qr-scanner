const express = require('express');
const rateLimit = require('express-rate-limit');

const router = express.Router();

const {
  getQrStatus,
} = require('../controllers/publicController');


/*
  Public QR status
*/
router.get('/qr/:qrId/status', getQrStatus);

module.exports = router;