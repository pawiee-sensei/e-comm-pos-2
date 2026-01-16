const express = require('express');
const router = express.Router();

const c = require('../controllers/admin.product.controller');

console.log('ADMIN PRODUCT CONTROLLER EXPORTS:', Object.keys(c));

if (!c.index) console.error('[ERR] index missing');
if (!c.showEdit) console.error('[ERR] showEdit missing');
if (!c.update) console.error('[ERR] update missing');
if (!c.delete) console.error('[ERR] delete missing');

router.get('/products', c.index);
router.get('/products/edit/:id', c.showEdit);
router.post('/products/edit/:id', c.update);
router.post('/products/delete/:id', c.delete);

module.exports = router;
