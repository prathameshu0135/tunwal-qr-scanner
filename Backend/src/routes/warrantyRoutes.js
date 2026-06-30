const express = require('express');
const router = express.Router();

const {
    registerWarranty
} = require('../controllers/warrantyController');

router.post('/register', registerWarranty);

module.exports = router;