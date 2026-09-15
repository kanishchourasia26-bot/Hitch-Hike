const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
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
  uploadProfilePicture,
} = require('../controllers/userController');

const { protect } = require('../middleware/authMiddleware');

// Multer configuration for profile picture upload
const uploadDir = path.join(__dirname, '../uploads/profile-pictures');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'dp-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, PNG, and WEBP images are allowed'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit
});

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

// @route   POST /api/users/upload-dp
router.post('/upload-dp', protect, upload.single('profilePicture'), uploadProfilePicture);

module.exports = router;