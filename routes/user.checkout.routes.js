const express = require('express');
const router = express.Router();
const multer = require('multer');
const c = require('../controllers/user.checkout.controller');

const upload = multer({ dest: 'public/uploads/payments' });

router.get('/checkout', c.view);
router.post('/checkout', upload.single('gcash_receipt'), c.submit);

module.exports = router;
