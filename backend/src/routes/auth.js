'use strict';
// backend/src/routes/auth.js
const router = require('express').Router();
const ctrl   = require('../controllers/auth');
const { authenticate } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');

router.post('/register',          validate(schemas.register), ctrl.register);
router.post('/login',             validate(schemas.login),    ctrl.login);
router.post('/logout',            authenticate,               ctrl.logout);
router.get ('/me',                authenticate,               ctrl.getMe);
router.post('/forgot-password',                               ctrl.forgotPassword);
router.post('/reset-password/:token',                         ctrl.resetPassword);
router.put ('/change-password',   authenticate,               ctrl.changePassword);

module.exports = router;
