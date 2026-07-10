const express = require('express');
const router = express.Router();

// Yahan maine verifyDocuments ko import mein add kar diya hai 👇
const { registerUser, loginUser, getMe, verifyDocuments } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// @route  POST /api/users/register
router.post('/register', registerUser);

// @route  POST /api/users/login
router.post('/login', loginUser);

// @route  GET /api/users/me (protected)
router.get('/me', protect, getMe);

// @route  POST /api/users/verify
// @desc   Verify Aadhaar or Driving License
router.post('/verify', protect, verifyDocuments);

module.exports = router;
