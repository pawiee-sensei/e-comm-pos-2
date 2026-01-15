const express = require('express');
const router = express.Router();
const multer = require('multer');
const c = require('../controllers/admin.product.update.controller');

const upload = multer({ dest: 'public/uploads/products' });

router.post('/ajax/product-update', upload.single('image'), c.updateAjax);

module.exports = router;
