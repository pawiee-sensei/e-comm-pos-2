const express = require('express');
const router = express.Router();
const c = require('../controllers/admin.product.stock.controller');

router.post('/ajax/stock-adjust', c.adjust);
module.exports = router;
