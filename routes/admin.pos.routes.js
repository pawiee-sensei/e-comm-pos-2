const express = require('express');
const router = express.Router();
const c = require('../controllers/admin.pos.controller');

router.get('/pos', c.index);
router.post('/pos/complete', c.complete);

module.exports = router;
