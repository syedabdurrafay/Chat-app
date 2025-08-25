import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

// Route imports
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import messageRoutes from './routes/messageRoutes.js';

// Middleware imports
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Get directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
import fs from 'fs';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware configuration
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

// Serve static files from uploads directory
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api/user', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/message', messageRoutes);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

// Socket.io configuration
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000
});

io.on('connection', (socket) => {
  console.log('Connected to socket.io');

  socket.on('setup', (userData) => {
    if (userData?._id) {
      socket.join(userData._id);
      socket.emit('connected');
    }
  });

  socket.on('join chat', (room) => {
    socket.join(room);
    console.log(`User Joined Room: ${room}`);
  });

  socket.on('typing', (room) => socket.in(room).emit('typing'));
  socket.on('stop typing', (room) => socket.in(room).emit('stop typing'));

  socket.on('new message', (newMessageReceived) => {
    const chat = newMessageReceived.chat;
    if (!chat?.users) return console.log('chat.users not defined');

    chat.users.forEach((user) => {
      if (user._id === newMessageReceived.sender._id) return;
      socket.in(user._id).emit('message received', newMessageReceived);
    });
  });

  socket.on('message updated', (updatedMessage) => {
    const chat = updatedMessage.chat;
    if (!chat?.users) return console.log('chat.users not defined');

    chat.users.forEach((user) => {
      socket.in(user._id).emit('message updated', updatedMessage);
    });
  });

  socket.on('message deleted', (data) => {
    const { messageId, chat } = data;
    if (!chat?.users) return console.log('chat.users not defined');

    chat.users.forEach((user) => {
      socket.in(user._id).emit('message deleted', messageId);
    });
  });

  socket.on('disconnect', () => {
    console.log('USER DISCONNECTED');
  });
});

// Database connection and server start
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/chat-app';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  });

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
  httpServer.close(() => process.exit(1));
});