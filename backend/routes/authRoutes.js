const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');


router.post('/register', authController.register);


router.post('/login', authController.login);


router.get('/profile', authMiddleware, authController.profile);


router.get('/verify-email/:token', authController.verifyEmail); // NEW: Email verification route
router.post('/resend-verification', authController.resendVerificationEmail); // NEW: Resend verification route

module.exports = router;
