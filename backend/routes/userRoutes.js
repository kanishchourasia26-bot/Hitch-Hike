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
} = require('../controllers/userController');

const {
  initiateVerification,
  handleCallback,
  getVerificationStatus,
} = require('../controllers/digilockerController');

const { protect } = require('../middleware/authMiddleware');

// OTP REGISTRATION FLOW (Recommended)
// @route   POST /api/users/send-otp
router.post('/send-otp', sendOTP);

// @route   POST /api/users/verify-otp
router.post('/verify-otp', verifyOTPAndRegister);

// @route   POST /api/users/resend-otp
router.post('/resend-otp', resendOTP);

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

// DIGILOCKER KYC VERIFICATION
// @route   GET /api/users/digilocker/initiate
router.get('/digilocker/initiate', protect, initiateVerification);

// @route   GET /api/users/digilocker/callback (Public - called by DigiLocker)
router.get('/digilocker/callback', handleCallback);

// @route   GET /api/users/digilocker/status
router.get('/digilocker/status', protect, getVerificationStatus);

module.exports = router;