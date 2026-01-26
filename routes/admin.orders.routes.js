const express = require('express');
const router = express.Router();
const c = require('../controllers/admin.orders.controller');

router.get('/orders', c.index);
router.get('/orders/:id', c.view);
router.post('/orders/:id/confirm', c.confirm);
router.post('/orders/:id/cancel', c.cancel);

module.exports = router;
