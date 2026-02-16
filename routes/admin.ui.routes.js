const express = require('express');
const router = express.Router();
const dashboard = require('../controllers/admin.dashboard.controller');

router.get('/', dashboard.index);
router.get('/home', dashboard.index);

module.exports = router;
