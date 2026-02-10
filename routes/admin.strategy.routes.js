const express = require('express');
const router = express.Router();

const strategy = require('../controllers/admin.strategy.controller');

router.get('/strategy', strategy.index);

module.exports = router;
