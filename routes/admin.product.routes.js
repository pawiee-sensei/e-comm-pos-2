const express = require('express');
const router = express.Router();
const controller = require('../controllers/admin.product.controller');

router.get('/products', controller.index);
router.get('/products/edit/:id', controller.showEdit);
router.post('/products/edit/:id', controller.update);
router.post('/products/delete/:id', controller.delete);

module.exports = router;
