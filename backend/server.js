const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const rideRoutes = require('./routes/rideRoutes');
const chatRoutes = require('./routes/chatRoutes'); // 🆕 NAYA: Chat Route Import

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
  // 💬 2. NAYA CHAT SYSTEM LOGIC
  // ----------------------------------------
  // User apna personal chat room join karega
  socket.on("join_chat", (userId) => {
    socket.join(userId);
    console.log(`💬 User ${userId} joined their personal chat room.`);
  });

  // Message bhejne aur save karne ka logic
  socket.on("send_message", async (data) => {
    try {
      const { senderId, receiverId, text } = data;
      
      // A) Database mein save karo (History ke liye)
      const newMessage = await Message.create({
        sender: senderId,
        receiver: receiverId,
        text: text
      });

      // B) Receiver ko real-time push notification (Socket) bhejo
      io.to(receiverId).emit("receive_message", newMessage);
      
    } catch (error) {
      console.error("Error saving message:", error);
    }
  });

  // Jab user disconnect ho
  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
  });
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/chats', chatRoutes); // 🆕 NAYA: Chat Route API

const PORT = process.env.PORT || 5000;

// IMPORTANT: 'server.listen' hi use hoga (App.listen nahi)
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});