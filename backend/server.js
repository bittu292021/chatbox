const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');  // ✅ FIXED import
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

// ✅ FIXED Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// ✅ FIXED: Remove duplicate route - use ONLY ONE
app.use('/api/auth', authRoutes);  // ← SINGLE LINE

app.get('/api/health', (req, res) => {
  res.json({ status: 'Server running', socketio: true });
});

// ✅ COMPLETE Socket.IO events for chat app
io.on('connection', (socket) => {
  console.log(`👤 User connected: ${socket.id}`);
  
  // Join user room
  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`📡 User ${userId} joined room`);
    // Broadcast user online status
    socket.broadcast.emit('userOnline', userId);
  });
  
  // Send message
  socket.on('sendMessage', (data) => {
    console.log(`💬 Message from ${data.from} to ${data.to}:`, data.message);
    io.to(data.to).emit('receiveMessage', data);
  });
  
  // Typing indicator
  socket.on('typing', (data) => {
    socket.broadcast.to(data.to).emit('userTyping', data);
  });
  
  socket.on('stopTyping', (data) => {
    socket.broadcast.to(data.to).emit('stopTyping');
  });
  
  socket.on('disconnect', () => {
    console.log(`👤 User disconnected: ${socket.id}`);
    io.emit('userOffline', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Socket.IO ready on port ${PORT}`);
});
