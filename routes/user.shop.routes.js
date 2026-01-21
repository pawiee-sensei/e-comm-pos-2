const express = require('express');
const router = express.Router();
const c = require('../controllers/user.shop.controller');

router.get('/', c.home);
router.get('/products', c.products);

module.exports = router;
