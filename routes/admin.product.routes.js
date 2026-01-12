const express = require('express');
const router = express.Router();
const multer = require('multer');
const controller = require('../controllers/admin.product.controller');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads/products'),
  filename: (req, file, cb) => cb(null, Date.now() + '_' + file.originalname)
});
const upload = multer({ storage });

router.get('/products', controller.index);

router.get('/products/add', controller.showAdd);
router.post('/products/add', upload.single('image'), controller.create);

router.get('/products/edit/:id', controller.showEdit);
router.post('/products/edit/:id', upload.single('image'), controller.update);

router.post('/products/delete/:id', controller.delete);

module.exports = router;
