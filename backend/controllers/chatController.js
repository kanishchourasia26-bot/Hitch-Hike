const Message = require('../models/Message');

// 1️⃣ Puraani Chat History laane ke liye (Yehi miss ho raha tha)
const getChatHistory = async (req, res) => {
  try {
    const myId = req.user._id; 
    const peerId = req.params.peerId;

    // Dono ke beech ki saari chats dhundho
    const messages = await Message.find({
      $or: [
        { sender: myId, receiver: peerId },
        { sender: peerId, receiver: myId }
      ]
    }).sort({ createdAt: 1 }); // Time ke hisaab se seedha sort karo (purane pehle)

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(500).json({ message: 'Server error while fetching history' });
  }
};

// 2️⃣ Inbox / Recent Chats laane ke liye (Jo pehle diya tha)
const getRecentChats = async (req, res) => {
  try {
    const myId = req.user._id;
    
    const messages = await Message.find({
      $or: [{ sender: myId }, { receiver: myId }]
    })
    .populate('sender', 'name')
    .populate('receiver', 'name')
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
          lastMessage: msg.text,
          time: msg.createdAt,
          unread: (!isMeSender && !msg.read) ? 1 : 0
        });
      } else {
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

module.exports = { getChatHistory, getRecentChats };