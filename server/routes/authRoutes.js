const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/reset-password', authController.resetPassword);
router.get('/me', authMiddleware, authController.getMe);
router.post('/wallet/add', authMiddleware, authController.addMoneyToWallet);
router.delete('/delete', authMiddleware, authController.deleteAccount);
router.put('/profile', authMiddleware, authController.updateProfile);
router.post('/kyc', authMiddleware, authController.updateKYC);

module.exports = router;
