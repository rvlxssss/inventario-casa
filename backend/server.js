// This file is the backend server required for real synchronization.
// To run: 
// 1. npm install express socket.io cors
// 2. node backend/server.js

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());

// Health Check for Render
app.get('/', (req, res) => {
  res.send('PantryPal Sync Server is Running');
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// --- PERSISTENCE LAYER ---
const DB_FILE = path.join(__dirname, 'database.json');

// In-memory storage
let activeSessions = new Map(); // code -> { roomId, products, categories, members }

// Load from file on start
const loadDatabase = () => {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      const data = JSON.parse(raw);
      // Convert Object to Map
      activeSessions = new Map(Object.entries(data));
      console.log(`Database loaded. ${activeSessions.size} active sessions.`);
    }
  } catch (e) {
    console.error("Error loading database:", e);
  }
};

// Save to file on change
const saveDatabase = () => {
  try {
    // Convert Map to Object
    const data = Object.fromEntries(activeSessions);
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Error saving database:", e);
  }
};

loadDatabase();

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
    saveDatabase();

    socket.join(roomId);
    socket.emit('session_created', { code });
    console.log(`Session created. Code: ${code}, Room: ${roomId}`);
  });

  // 2. Join a Session (Target Device)
  socket.on('join_session', ({ code, user }) => {
    if (!code) return;
    const formattedCode = code.toUpperCase();
    const session = activeSessions.get(formattedCode);

    if (session) {
      socket.join(session.roomId);

      // ACK to the user that they joined successfully
      socket.emit('session_joined', { code: formattedCode });

      // Send current data to the new device
      socket.emit('sync_initial_data', {
        products: session.products,
        categories: session.categories,
        members: session.members
      });

      console.log(`Socket ${socket.id} joined room ${session.roomId}`);
    } else {
      socket.emit('error', { message: 'Código inválido o expirado' });
    }
  });

  // 3. Sync Updates (Bi-directional)
  // Legacy/Full Sync (Overwrites) - Keep for compatibility or bulk updates
  socket.on('update_data', ({ roomId, type, data }) => {
    socket.to(roomId).emit('data_updated', { type, data });
    updateServerState(roomId, type, data);
  });

  // 4. Granular Sync (Actions) - Preferred
  socket.on('sync_action', ({ roomId, action }) => {
    // Broadcast action to others
    socket.to(roomId).emit('sync_action', action);

    // Apply to server state
    const session = getSessionByRoomId(roomId);
    if (session) {
      if (action.type === 'ADD_PRODUCT') {
        session.products = [action.payload, ...(session.products || [])];
      } else if (action.type === 'UPDATE_PRODUCT') {
        session.products = (session.products || []).map(p => p.id === action.payload.id ? action.payload : p);
      } else if (action.type === 'DELETE_PRODUCT') {
        session.products = (session.products || []).filter(p => p.id !== action.payload);
      } else if (action.type === 'ADD_CATEGORY') {
        session.categories = [...(session.categories || []), action.payload];
      } else if (action.type === 'UPDATE_CATEGORY') {
        session.categories = (session.categories || []).map(c => c.id === action.payload.id ? action.payload : c);
      } else if (action.type === 'DELETE_CATEGORY') {
        session.categories = (session.categories || []).filter(c => c.id !== action.payload);
      } else if (action.type === 'UPDATE_MEMBERS') {
        session.members = action.payload;
      }

      saveDatabase();
    }
  });

  function getSessionByRoomId(roomId) {
    for (let [c, s] of activeSessions.entries()) {
      if (s.roomId === roomId) return s;
    }
    return null;
  }

  function updateServerState(roomId, type, data) {
    let foundCode = null;
    let foundSession = null;

    for (let [c, s] of activeSessions.entries()) {
      if (s.roomId === roomId) {
        foundCode = c;
        foundSession = s;
        break;
      }
    }

    if (foundCode && foundSession) {
      foundSession[type] = data;
      activeSessions.set(foundCode, foundSession);
      saveDatabase();
    }
  }

  socket.on('disconnect', () => {
    // console.log('Client disconnected', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Sync Server running on port ${PORT}`);
});