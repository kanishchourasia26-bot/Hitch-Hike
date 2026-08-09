const express = require('express');
const router = express.Router();

const { 
  registerUser, 
  loginUser, 
  getMe, 
  verifyDocuments, 
  updateProfile // <-- Yeh zaroori hai
} = require('../controllers/userController');

const { protect } = require('../middleware/authMiddleware'); // Ensure correct path to middleware

// @route   POST /api/users/register
router.post('/register', registerUser);

// @route   POST /api/users/login
router.post('/login', loginUser);

// @route   GET /api/users/me
router.get('/me', protect, getMe);

// @route   POST /api/users/verify
router.post('/verify', protect, verifyDocuments);

// @route   PUT /api/users/profile (EDIT PROFILE ROUTE)
router.put('/profile', protect, updateProfile); // <-- Naya route yahan add hua hai!

module.exports = router;