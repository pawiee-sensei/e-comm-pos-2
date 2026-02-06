const express = require('express');
const router = express.Router();

const pos = require('../controllers/admin.pos.controller');

console.log('POS EXPORTS:', Object.keys(pos));

// POS page
router.get('/pos', pos.index);

// Step 1: create draft
router.post('/pos/complete', pos.complete);

// Step 2: confirm draft
router.post('/pos/confirm', pos.confirmSale);

// Undo draft (10s grace)
router.post('/pos/undo-temp', pos.undoTemp);

// Receipt
router.get('/pos/receipt/:id', pos.receipt);

// Admin void (PIN protected)
router.post('/pos/void', pos.voidSale);

module.exports = router;
