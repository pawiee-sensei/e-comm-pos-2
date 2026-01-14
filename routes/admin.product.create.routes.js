const express = require('express');
const multer = require('multer');
const router = express.Router();
const controller = require('../controllers/admin.product.create.controller'); // FIXED NAME

// Multer storage config (GOOD)
const storage = multer.diskStorage({
  destination: 'public/uploads/products',
  filename: (req, file, cb) => cb(null, Date.now() + '_' + file.originalname)
});

const upload = multer({ storage });

// AJAX: product create
router.post('/ajax/product-create', upload.single('image'), controller.createAjax);

module.exports = router;
