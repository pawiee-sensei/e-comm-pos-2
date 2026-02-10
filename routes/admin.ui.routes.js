    const express = require('express');
    const router = express.Router();
    const { requireAdmin } = require('../middleware/auth');

    router.get('/', (req, res) => res.render('admin/dashboard'));
    router.get('/home', (req, res) => res.render('admin/dashboard'));

    module.exports = router;    