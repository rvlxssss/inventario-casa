// This file is the backend server required for real synchronization.
// To run: 
// 1. npm install express socket.io cors
// 2. node backend/server.js

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

// Health Check for Render
// Render needs to receive a 200 OK response to know the service is live.
app.get('/', (req, res) => {
  res.send('PantryPal Sync Server is Running');
});

const server = http.createServer(app);

// Initialize Socket.io with CORS enabled for all origins (for development)
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

// In-memory storage for demo purposes
// In a real app, use Redis or a Database (MongoDB/Postgres)
// Note: On Render free tier, this memory resets if the server "sleeps" due to inactivity.
const activeSessions = new Map(); // code -> { roomId, products, categories, members }

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // 1. Create a Sync Session (Source Device)
  socket.on('create_session', (initialData) => {
    // Generate a 6-digit code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const roomId = `room_${code}`;
    
    // Store initial data
    activeSessions.set(code, {
      roomId,
      ...initialData
    });

    socket.join(roomId);
    socket.emit('session_created', { code });
    console.log(`Session created. Code: ${code}, Room: ${roomId}`);
  });

  // 2. Join a Session (Target Device)
  socket.on('join_session', ({ code, user }) => {
    const formattedCode = code.toUpperCase();
    const session = activeSessions.get(formattedCode);

    if (session) {
      socket.join(session.roomId);
      
      // Send current data to the new device
      socket.emit('sync_initial_data', {
        products: session.products,
        categories: session.categories,
        members: session.members
      });

      // Notify others in room
      io.to(session.roomId).emit('member_joined', user);
      console.log(`User ${user.name} joined room ${session.roomId}`);
    } else {
      socket.emit('error', { message: 'Invalid or expired code' });
    }
  });

  // 3. Sync Updates (Bi-directional)
  socket.on('update_data', ({ roomId, type, data }) => {
    // Broadcast changes to everyone else in the room
    // type can be 'products', 'categories', 'members'
    socket.to(roomId).emit('data_updated', { type, data });
    
    // Update server state (naive implementation)
    // Find session by roomId (inefficient for demo, better to store mapping)
    for (let session of activeSessions.values()) {
        if (session.roomId === roomId) {
            session[type] = data;
            break;
        }
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Sync Server running on port ${PORT}`);
});