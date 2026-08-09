const express = require('express');
const router = express.Router();
// getRecentChats ko import mein add kar
const { getChatHistory, getRecentChats } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

// 🆕 NAYA ROUTE: Inbox fetch karne ke liye (Sabse upar rakhna isko)
router.get('/', protect, getRecentChats);

// Tera purana route
router.get('/:peerId', protect, getChatHistory);

module.exports = router;