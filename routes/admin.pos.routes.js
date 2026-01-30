

const express = require('express');
const router = express.Router();

const pos = require('../controllers/admin.pos.controller');

// POS main page
router.get('/pos', pos.index);

// Complete sale
router.post('/pos/complete', pos.complete);

// Receipt
router.get('/pos/receipt/:id', pos.receipt);

module.exports = router;
