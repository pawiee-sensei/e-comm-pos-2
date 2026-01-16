const express = require('express');
const router = express.Router();
const c = require('../controllers/admin.product.logs.controller');

router.get('/products/logs', c.panel);

module.exports = router;
