const express = require('express');
const router = express.Router();
const c = require('../controllers/user.cart.controller');

router.get('/cart', c.view);

module.exports = router;
