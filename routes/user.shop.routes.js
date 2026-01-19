const express = require('express');
const router = express.Router();
const c = require('../controllers/user.shop.controller');

router.get('/products', c.products);
router.get('/', c.home);

module.exports = router;
