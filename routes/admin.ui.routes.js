const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth');


router.get('/', (req, res) => res.render('admin/dashboard'));
router.get('/products', (req, res) => res.render('admin/products'));
router.get('/pos', (req, res) => res.render('admin/pos'));
router.get('/strategy', (req, res) => res.render('admin/strategy'));
router.get('/home', (req, res) => res.render('admin/dashboard'));


module.exports = router;
