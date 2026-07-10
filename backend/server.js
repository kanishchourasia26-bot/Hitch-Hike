const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const rideRoutes = require('./routes/rideRoutes');

// NAYA LOGIC: Socket.io ke imports
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();
connectDB();

const app = express();
app.use(express.json());
app.use(cors());

// NAYA LOGIC: HTTP server banaya aur Socket.io initialize kiya
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Abhi ke liye sab allow kar rahe hain (testing ke liye)
    methods: ["GET", "POST", "PUT"]
  }
});

// NAYA LOGIC: Socket connection check karna
io.on('connection', (socket) => {
  console.log('⚡ A user connected via Socket:', socket.id);

  // NAYA LOGIC: Socket connection check karna
io.on('connection', (socket) => {
  console.log('⚡ A user connected via Socket:', socket.id);

  // 👇 YAHAN SE NAYA CODE ADD KARO 👇
  // Jab driver apni location bheje, toh use baaki sab (passenger) ko forward kar do
  socket.on('send-location', (data) => {
    // data mein aayega: { rideId, lat, lng }
    console.log(`📍 Location received for ride ${data.rideId}:`, data.lat, data.lng);
    
    // Broadcast location to passenger
    socket.broadcast.emit('receive-location', data);
  });
  // 👆 YAHAN TAK 👆

  // Jab user disconnect ho
  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
  });
});

});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/rides', rideRoutes);

const PORT = process.env.PORT || 5000;

// IMPORTANT: Ab 'app.listen' ki jagah 'server.listen' use hoga
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});