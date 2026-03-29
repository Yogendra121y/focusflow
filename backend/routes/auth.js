const express = require('express');
const router  = express.Router();
const authController = require('../controllers/authController');
const { protect }    = require('../middleware/auth');
const { authValidation } = require('../middleware/validation');

router.post('/register',        authValidation.register, authController.register);
router.post('/login',           authValidation.login,    authController.login);
router.post('/forgot-password',                          authController.forgotPassword);
router.post('/reset-password',                           authController.resetPassword);
router.get( '/me',              protect,                 authController.getMe);
router.put( '/profile',         protect,                 authController.updateProfile);
router.put( '/password',        protect,                 authController.changePassword);
router.delete('/account',       protect,                 authController.deleteAccount);

module.exports = router;