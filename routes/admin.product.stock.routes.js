const express = require('express');
const router = express.Router();

const stockController = require('../controllers/admin.product.stock.controller');

router.post('/ajax/stock-adjust', stockController.adjustAjax);

module.exports = router;
