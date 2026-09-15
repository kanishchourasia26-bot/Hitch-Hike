const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const rideRoutes = require('./routes/rideRoutes');
const chatRoutes = require('./routes/chatRoutes');
const kycRoutes = require('./routes/kycRoutes'); // KYC Route Import

// Cron Job aur Model import
const cron = require('node-cron');
const Ride = require('./models/Ride'); 
const Message = require('./models/Message'); // 🆕 NAYA: Message Model Import

// Socket.io ke imports
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();
connectDB();

const app = express();
app.use(express.json());
app.use(cors());

// Serve static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// HTTP server banaya aur Socket.io initialize kiya
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST", "PUT"]
  }
});

// ==========================================
// 🧹 CRON JOB: AUTO-EXPIRE OLD RIDES
// ==========================================
cron.schedule('0 * * * *', async () => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = await Ride.updateMany(
      {
        startTime: { $lt: twentyFourHoursAgo },
        status: { $in: ['published', 'booked', 'heading_to_pickup', 'arrived'] }
      },
      { $set: { status: 'expired' } }
    );
    if (result.modifiedCount > 0) {
      console.log(`🕒 [CRON] Automatically expired ${result.modifiedCount} old rides!`);
    }
  } catch (error) {
    console.error("Cron error:", error);
  }
});

// Ye function server start hote hi ek baar purani rides clean kar dega
const expireOldRidesImmediately = async () => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = await Ride.updateMany(
      {
        startTime: { $lt: twentyFourHoursAgo },
        status: { $in: ['published', 'booked', 'heading_to_pickup', 'arrived'] }
      },
      { $set: { status: 'expired' } }
    );
    console.log(`🚀 [CLEANUP] Cleaned up ${result.modifiedCount} old rides instantly on startup!`);
  } catch (error) {
    console.log("Cleanup error:", error);
  }
};
expireOldRidesImmediately();

// ==========================================
// ⚡ SOCKET.IO LOGIC (Live Tracking + Chat)
// ==========================================
io.on('connection', (socket) => {
  console.log('⚡ A user connected via Socket:', socket.id);

  // ----------------------------------------
  // 🚗 1. PURANA RIDE TRACKING LOGIC
  // ----------------------------------------
  socket.on('join-ride', (rideId) => {
    socket.join(rideId);
    console.log(`👤 User joined ride room: ${rideId}`);
  });

  socket.on('update-location', (data) => {
    socket.to(data.rideId).emit('driver-location', { lat: data.lat, lng: data.lng });
  });

  socket.on('status-change', (data) => {
    socket.to(data.rideId).emit('ride-status-updated', { status: data.status });
  });

  // ----------------------------------------
  // 💬 2. ENHANCED CHAT SYSTEM LOGIC
  // ----------------------------------------
  
  // User joins their personal chat room
  socket.on("join_chat", (userId) => {
    socket.join(userId);
    console.log(`💬 User ${userId} joined their personal chat room.`);
    
    // Broadcast online status
    io.emit("user_online", { userId });
  });

  // User typing indicator
  socket.on("typing", ({ userId, peerId }) => {
    io.to(peerId).emit("typing", { userId });
  });

  // User stopped typing
  socket.on("stop_typing", ({ userId, peerId }) => {
    io.to(peerId).emit("stop_typing", { userId });
  });

  // Send and save message
  socket.on("send_message", async (data) => {
    console.log("🔥 MESSAGE RECEIVED:", data);
    try {
      const { senderId, receiverId, text, tempId } = data;
      
      // Save message to database
      const newMessage = await Message.create({
        sender: senderId,
        receiver: receiverId,
        text: text,
        read: false,
        deliveredAt: new Date()
      });

      // Send delivery confirmation to sender
      io.to(senderId).emit("message_delivered", { 
        messageId: tempId,
        dbId: newMessage._id 
      });

      // Send message to receiver in real-time
      io.to(receiverId).emit("receive_message", {
        ...newMessage.toObject(),
        senderId: newMessage.sender,
        receiverId: newMessage.receiver
      });
      
    } catch (error) {
      console.error("Error saving message:", error);
      io.to(data.senderId).emit("message_failed", { 
        tempId: data.tempId,
        error: "Failed to send message" 
      });
    }
  });

  // Message read receipt
  socket.on("message_read", async ({ messageId, senderId }) => {
    try {
      await Message.findByIdAndUpdate(messageId, { 
        read: true, 
        readAt: new Date() 
      });
      
      // Notify sender that message was read
      io.to(senderId).emit("message_read", { messageId });
    } catch (error) {
      console.error("Error updating read status:", error);
    }
  });

  // User disconnect - broadcast offline status
  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
    // Note: We'd need to track userId to socket.id mapping for this
    // For simplicity, emitting generic offline event
  });
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/users/kyc', kycRoutes); // KYC Route API

const PORT = process.env.PORT || 5000;

// IMPORTANT: 'server.listen' hi use hoga (App.listen nahi)
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});