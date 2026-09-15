const express = require('express');
const router = express.Router();
const { 
  getChatHistory, 
  getRecentChats, 
  markAsRead, 
  deleteMessage, 
  getUnreadCount 
} = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

// Get recent chats / inbox
router.get('/', protect, getRecentChats);

// Get unread message count
router.get('/unread/count', protect, getUnreadCount);

// Get chat history with specific peer
router.get('/:peerId', protect, getChatHistory);

// Mark message as read
router.put('/:messageId/read', protect, markAsRead);

// Delete a message
router.delete('/:messageId', protect, deleteMessage);

module.exports = router;