const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');


router.post('/register', authController.register);
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/login', authController.login);
router.post('/verify-login-otp', authController.verifyLoginOtp);
router.post('/reset-password', authController.resetPassword);
router.get('/me', authMiddleware, authController.getMe);
router.post('/wallet/add', authMiddleware, authController.addMoneyToWallet);
router.put('/profile', authMiddleware, authController.updateProfile);
router.post('/kyc', authMiddleware, authController.updateKYC);
router.delete('/delete-account', authMiddleware, authController.deleteAccount);

module.exports = router;
