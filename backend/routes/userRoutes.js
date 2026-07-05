const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// @route  POST /api/users/register
router.post('/register', registerUser);

// @route  POST /api/users/login
router.post('/login', loginUser);

// @route  GET /api/users/me (protected)
router.get('/me', protect, getMe);

module.exports = router;