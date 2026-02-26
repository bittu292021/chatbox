const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

// ✅ Allow multiple origins: from environment variable (comma-separated) plus localhost for dev
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://127.0.0.1:3000'];

// Add production frontend URL if CLIENT_URL is set separately
if (process.env.CLIENT_URL && !allowedOrigins.includes(process.env.CLIENT_URL)) {
  allowedOrigins.push(process.env.CLIENT_URL);
}

// CORS middleware for HTTP
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'Server running', socketio: true });
});

// ✅ Socket.IO with same allowed origins
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Socket events (as updated earlier)
io.on('connection', (socket) => {
  console.log(`👤 User connected: ${socket.id}`);

  socket.on('user_join', (userId) => {
    socket.join(userId);
    console.log(`📡 User ${userId} joined room`);
    socket.broadcast.emit('userOnline', userId);
  });

  socket.on('send_message', (data) => {
    console.log(`💬 Message from ${data.senderId} to ${data.receiverId}: ${data.text}`);
    io.to(data.receiverId).emit('receive_message', data);
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