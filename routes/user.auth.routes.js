const express = require('express');
const router = express.Router();
const controller = require('../controllers/user.auth.controller');

router.get('/signup', controller.showSignup);
router.post('/signup', controller.signup);

router.get('/login', controller.showLogin);
router.post('/login', controller.login);

router.post('/logout', controller.logout);

module.exports = router;
