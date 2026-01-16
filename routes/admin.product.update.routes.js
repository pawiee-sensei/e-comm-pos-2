const express = require('express');
const multer = require('multer');
const router = express.Router();
const controller = require('../controllers/admin.product.update.controller');

const storage = multer.diskStorage({
  destination: 'public/uploads/products',
  filename: (req, file, cb) => cb(null, Date.now() + '_' + file.originalname)
});

const upload = multer({ storage });

router.post('/ajax/product-update', upload.single('image'), controller.updateAjax);

module.exports = router;
