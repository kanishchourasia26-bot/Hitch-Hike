require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

// Route modules
const userRoutes = require('./routes/userRoutes');
const rideRoutes = require('./routes/rideRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
    cors: { origin: "*" }
});

// Middleware
app.use(cors());
app.use(express.json());

// Socket Logic
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-ride', (rideId) => {
        socket.join(rideId);
        console.log(`User joined ride room: ${rideId}`);
    });

    socket.on('update-location', (data) => {
        socket.to(data.rideId).emit('location-update', {
            lat: data.lat,
            lng: data.lng
        });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Routes
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));
app.use('/api/users', userRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/bookings', bookingRoutes);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    await connectDB();
    httpServer.listen(PORT, () => {
        console.log(`🚀 Hitchhike backend & Socket.io running on port ${PORT}`);
    });
};

startServer();

module.exports = app;
