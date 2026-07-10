const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Protected
router.post('/register', authenticate, authorize('admin'), authController.register);
router.post('/change-password', authenticate, authController.changePassword);
router.get('/me', authenticate, authController.getProfile);

module.exports = router;
