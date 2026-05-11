const express = require('express');
const router = express.Router();

const {
  getWarrantyRecords,
  getWarrantyDetail,
  exportWarrantyExcel,
  updateWarrantyDetail
} = require('../controllers/adminWarrantyController');

const { protectAdmin } = require('../middleware/authMiddleware');

router.use(protectAdmin);

router.get('/', getWarrantyRecords);
router.get('/export/excel', exportWarrantyExcel);
router.get('/:qrId', getWarrantyDetail);
router.patch('/:qrId', updateWarrantyDetail);

module.exports = router;