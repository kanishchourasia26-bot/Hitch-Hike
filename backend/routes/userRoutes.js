const express = require('express');
const router = express.Router();
const { 
  sendOTP,
  verifyOTPAndRegister,
  resendOTP,
  registerUser, 
  loginUser, 
  getMe, 
  verifyDocuments, 
  updateProfile,
  verifyUser,
  forgotPassword,
  resetPassword,
} = require('../controllers/userController');

const { protect } = require('../middleware/authMiddleware');

// OTP REGISTRATION FLOW (Recommended)
// @route   POST /api/users/send-otp
router.post('/send-otp', sendOTP);

// @route   POST /api/users/verify-otp
router.post('/verify-otp', verifyOTPAndRegister);

// @route   POST /api/users/resend-otp
router.post('/resend-otp', resendOTP);

// FORGOT PASSWORD FLOW
// @route   POST /api/users/forgot-password
router.post('/forgot-password', forgotPassword);

// @route   POST /api/users/reset-password
router.post('/reset-password', resetPassword);

// LEGACY REGISTRATION (Kept for backward compatibility)
// @route   POST /api/users/register
router.post('/register', registerUser);

// @route   POST /api/users/login
router.post('/login', loginUser);

// @route   GET /api/users/me
router.get('/me', protect, getMe);

// @route   POST /api/users/verify
router.post('/verify', protect, verifyDocuments);

// @route   POST /api/users/verify-user
router.post('/verify-user', protect, verifyUser);

// @route   PUT /api/users/profile
router.put('/profile', protect, updateProfile);

module.exports = router;