// This file is the backend server required for real synchronization.
// To run: 
// 1. npm install express socket.io cors mongoose dotenv
// 2. node backend/server.js

require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const authController = require('./authController');
const User = require('./models/User');
const Session = require('./models/Session');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// --- MONGODB CONNECTION ---
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("ERROR: MONGODB_URI not found in environment variables.");
  // process.exit(1); // Don't exit, let it fail gracefully or wait for config
} else {
  mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));
}

// Health Check for Render
app.get('/', (req, res) => {
  res.send('PantryPal Sync Server is Running');
});

// --- AUTH ROUTES ---
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // --- USER ROOM LOGIC ---
  socket.on('join_user_room', async (userId) => {
    if (!userId) return;
    const roomId = `user_${userId}`;
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined user room ${roomId}`);

    try {
      const user = await User.findById(userId);
      if (user) {
        socket.emit('sync_initial_data', {
          products: user.products || [],
          categories: user.categories || [],
          expenses: user.expenses || {},
          transactions: user.transactions || []
        });
      }
    } catch (err) {
      console.error("Error loading user data:", err);
    }
  });

  // --- SYNC LOGIC ---

  // 1. Create a Sync Session (Source Device)
  socket.on('create_session', async (initialData) => {
    // Generate a 6-digit code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const roomId = `room_${code}`;

    try {
      const newSession = new Session({
        code,
        roomId,
        ...initialData
      });
      await newSession.save();

      socket.join(roomId);
      socket.emit('session_created', { code });
      console.log(`Session created. Code: ${code}, Room: ${roomId}`);
    } catch (err) {
      console.error("Error creating session:", err);
      socket.emit('error', { message: 'Error al crear sesión' });
    }
  });

  // 2. Join a Session (Target Device)
  socket.on('join_session', async ({ code, user }) => {
    if (!code) return;
    const formattedCode = code.toUpperCase();

    try {
      const session = await Session.findOne({ code: formattedCode });

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
    } catch (err) {
      console.error("Error joining session:", err);
    }
  });

  // 3. Sync Updates (Bi-directional)
  socket.on('update_data', async ({ roomId, type, data }) => {
    socket.to(roomId).emit('data_updated', { type, data });

    // Update DB
    try {
      if (roomId.startsWith('user_')) {
        // Not typically used for full sync in user rooms, but supported
      } else {
        const session = await Session.findOne({ roomId });
        if (session) {
          session[type] = data;
          await session.save();
        }
      }
    } catch (err) {
      console.error("Error updating data:", err);
    }
  });

  // 4. Granular Sync (Actions) - Preferred
  socket.on('sync_action', async ({ roomId, action, userId }) => {
    // Broadcast action to others in the room
    socket.to(roomId).emit('sync_action', action);

    // Apply to server state
    try {
      if (roomId.startsWith('user_')) {
        const targetUserId = roomId.replace('user_', '');
        await updateUserState(targetUserId, action);
      } else {
        const session = await Session.findOne({ roomId });
        if (session) {
          applyActionToState(session, action);
          await session.save();
        }
      }
    } catch (err) {
      console.error("Error syncing action:", err);
    }
  });

  function applyActionToState(state, action) {
    if (action.type === 'ADD_PRODUCT') {
      state.products = [action.payload, ...(state.products || [])];
    } else if (action.type === 'UPDATE_PRODUCT') {
      state.products = (state.products || []).map(p => p.id === action.payload.id ? action.payload : p);
    } else if (action.type === 'DELETE_PRODUCT') {
      state.products = (state.products || []).filter(p => p.id !== action.payload);
    } else if (action.type === 'ADD_CATEGORY') {
      state.categories = [...(state.categories || []), action.payload];
    } else if (action.type === 'UPDATE_CATEGORY') {
      state.categories = (state.categories || []).map(c => c.id === action.payload.id ? action.payload : c);
    } else if (action.type === 'DELETE_CATEGORY') {
      state.categories = (state.categories || []).filter(c => c.id !== action.payload);
    } else if (action.type === 'UPDATE_MEMBERS') {
      state.members = action.payload;
    }
    // Mark as modified for Mongoose mixed types/arrays if needed
    if (state.markModified) {
      state.markModified('products');
      state.markModified('categories');
      state.markModified('members');
    }
  }

  async function updateUserState(userId, action) {
    const user = await User.findById(userId);
    if (user) {
      applyActionToState(user, action);
      await user.save();
    }
  }

  const cors = require('cors');
  const bodyParser = require('body-parser');
  const mongoose = require('mongoose');
  const authController = require('./authController');
  const User = require('./models/User');
  const Session = require('./models/Session');

  const app = express();
  app.use(cors());
  app.use(bodyParser.json());

  // --- MONGODB CONNECTION ---
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    console.error("ERROR: MONGODB_URI not found in environment variables.");
    // process.exit(1); // Don't exit, let it fail gracefully or wait for config
  } else {
    mongoose.connect(MONGODB_URI)
      .then(() => console.log('Connected to MongoDB'))
      .catch(err => console.error('MongoDB connection error:', err));
  }

  // Health Check for Render
  app.get('/', (req, res) => {
    res.send('PantryPal Sync Server is Running');
  });

  // --- AUTH ROUTES ---
  app.post('/api/auth/register', authController.register);
  app.post('/api/auth/login', authController.login);

  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // --- USER ROOM LOGIC ---
    socket.on('join_user_room', async (userId) => {
      if (!userId) return;
      const roomId = `user_${userId}`;
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined user room ${roomId}`);

      try {
        const user = await User.findById(userId);
        if (user) {
          socket.emit('sync_initial_data', {
            products: user.products || [],
            categories: user.categories || [],
            expenses: user.expenses || {},
            transactions: user.transactions || []
          });
        }
      } catch (err) {
        console.error("Error loading user data:", err);
      }
    });

    // --- SYNC LOGIC ---

    // 1. Create a Sync Session (Source Device)
    socket.on('create_session', async (initialData) => {
      // Generate a 6-digit code
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const roomId = `room_${code}`;

      try {
        const newSession = new Session({
          code,
          roomId,
          ...initialData
        });
        await newSession.save();

        socket.join(roomId);
        socket.emit('session_created', { code });
        console.log(`Session created. Code: ${code}, Room: ${roomId}`);
      } catch (err) {
        console.error("Error creating session:", err);
        socket.emit('error', { message: 'Error al crear sesión' });
      }
    });

    // 2. Join a Session (Target Device)
    socket.on('join_session', async ({ code, user }) => {
      if (!code) return;
      const formattedCode = code.toUpperCase();

      try {
        const session = await Session.findOne({ code: formattedCode });

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
      } catch (err) {
        console.error("Error joining session:", err);
      }
    });

    // 3. Sync Updates (Bi-directional)
    socket.on('update_data', async ({ roomId, type, data }) => {
      socket.to(roomId).emit('data_updated', { type, data });

      // Update DB
      try {
        if (roomId.startsWith('user_')) {
          // Not typically used for full sync in user rooms, but supported
        } else {
          const session = await Session.findOne({ roomId });
          if (session) {
            session[type] = data;
            await session.save();
          }
        }
      } catch (err) {
        console.error("Error updating data:", err);
      }
    });

    // 4. Granular Sync (Actions) - Preferred
    socket.on('sync_action', async ({ roomId, action, userId }) => {
      // Broadcast action to others in the room
      socket.to(roomId).emit('sync_action', action);

      // Apply to server state
      try {
        if (roomId.startsWith('user_')) {
          const targetUserId = roomId.replace('user_', '');
          await updateUserState(targetUserId, action);
        } else {
          const session = await Session.findOne({ roomId });
          if (session) {
            applyActionToState(session, action);
            await session.save();
          }
        }
      } catch (err) {
        console.error("Error syncing action:", err);
      }
    });

    function applyActionToState(state, action) {
      if (action.type === 'ADD_PRODUCT') {
        state.products = [action.payload, ...(state.products || [])];
      } else if (action.type === 'UPDATE_PRODUCT') {
        state.products = (state.products || []).map(p => p.id === action.payload.id ? action.payload : p);
      } else if (action.type === 'DELETE_PRODUCT') {
        state.products = (state.products || []).filter(p => p.id !== action.payload);
      } else if (action.type === 'ADD_CATEGORY') {
        state.categories = [...(state.categories || []), action.payload];
      } else if (action.type === 'UPDATE_CATEGORY') {
        state.categories = (state.categories || []).map(c => c.id === action.payload.id ? action.payload : c);
      } else if (action.type === 'DELETE_CATEGORY') {
        state.categories = (state.categories || []).filter(c => c.id !== action.payload);
      } else if (action.type === 'UPDATE_MEMBERS') {
        state.members = action.payload;
      }
      // Mark as modified for Mongoose mixed types/arrays if needed
      if (state.markModified) {
        state.markModified('products');
        state.markModified('categories');
        state.markModified('members');
      }
    }

    async function updateUserState(userId, action) {
      const user = await User.findById(userId);
      if (user) {
        applyActionToState(user, action);
        await user.save();
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