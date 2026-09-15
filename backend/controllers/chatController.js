const Message = require('../models/Message');

// 1️⃣ Get Chat History between two users
const getChatHistory = async (req, res) => {
  try {
    const myId = req.user._id; 
    const peerId = req.params.peerId;

    // Find all messages between the two users
    const messages = await Message.find({
      $or: [
        { sender: myId, receiver: peerId },
        { sender: peerId, receiver: myId }
      ]
    }).sort({ createdAt: 1 }); // Sort chronologically (oldest first)

    // Mark messages as read
    await Message.updateMany(
      { sender: peerId, receiver: myId, read: false },
      { $set: { read: true, readAt: new Date() } }
    );

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(500).json({ message: 'Server error while fetching history' });
  }
};

// 2️⃣ Get Recent Chats / Inbox
const getRecentChats = async (req, res) => {
  try {
    const myId = req.user._id;
    
    const messages = await Message.find({
      $or: [{ sender: myId }, { receiver: myId }]
    })
    .populate('sender', 'name email phone')
    .populate('receiver', 'name email phone')
    .sort({ createdAt: -1 }); 

    const chatMap = new Map();

    messages.forEach(msg => {
      const isMeSender = msg.sender._id.toString() === myId.toString();
      const peer = isMeSender ? msg.receiver : msg.sender;
      const peerId = peer._id.toString();

      if (!chatMap.has(peerId)) {
        chatMap.set(peerId, {
          peerId: peerId,
          name: peer.name || 'User',
          email: peer.email || '',
          phone: peer.phone || '',
          lastMessage: msg.text,
          time: msg.createdAt,
          unread: (!isMeSender && !msg.read) ? 1 : 0
        });
      } else {
        // Count unread messages from this peer
        if (!isMeSender && !msg.read) {
          chatMap.get(peerId).unread += 1;
        }
      }
    });

    res.status(200).json(Array.from(chatMap.values()));
  } catch (error) {
    console.error("Error fetching inbox:", error);
    res.status(500).json({ message: 'Server error while fetching inbox' });
  }
};

// 3️⃣ Mark message as read
const markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const myId = req.user._id;

    const message = await Message.findOneAndUpdate(
      { _id: messageId, receiver: myId },
      { $set: { read: true, readAt: new Date() } },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    res.status(200).json({ message: 'Message marked as read', data: message });
  } catch (error) {
    console.error("Error marking message as read:", error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 4️⃣ Delete a message
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const myId = req.user._id;

    const message = await Message.findOneAndDelete({
      _id: messageId,
      sender: myId // Only sender can delete
    });

    if (!message) {
      return res.status(404).json({ message: 'Message not found or unauthorized' });
    }

    res.status(200).json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 5️⃣ Get unread message count
const getUnreadCount = async (req, res) => {
  try {
    const myId = req.user._id;

    const unreadCount = await Message.countDocuments({
      receiver: myId,
      read: false
    });

    res.status(200).json({ unreadCount });
  } catch (error) {
    console.error("Error getting unread count:", error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { 
  getChatHistory, 
  getRecentChats, 
  markAsRead, 
  deleteMessage, 
  getUnreadCount 
};