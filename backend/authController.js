const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const USERS_FILE = path.join(__dirname, 'users.json');
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_dev_key_12345';

// Helper: Load Users
const loadUsers = () => {
    try {
        if (fs.existsSync(USERS_FILE)) {
            return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
        }
    } catch (e) {
        console.error("Error loading users:", e);
    }
    return [];
};

// Helper: Save Users
const saveUsers = (users) => {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
};

// --- CONTROLLERS ---

const register = async (req, res) => {
    const { username, pin } = req.body;

    if (!username || !pin) {
        return res.status(400).json({ message: 'Usuario y PIN son obligatorios' });
    }

    // PIN Validation: Exactly 4 digits
    const pinRegex = /^\d{4}$/;
    if (!pinRegex.test(pin)) {
        return res.status(400).json({
            message: 'El PIN debe ser de 4 dígitos numéricos.'
        });
    }

    const users = loadUsers();
    if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
        return res.status(400).json({ message: 'El nombre de usuario ya existe' });
    }

    const hashedPin = await bcrypt.hash(pin, 10);
    const newUser = {
        id: Date.now().toString(),
        username,
        pin: hashedPin,
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    saveUsers(users);

    // Auto-login after register
    const token = jwt.sign({ id: newUser.id, username: newUser.username }, JWT_SECRET, { expiresIn: '365d' }); // Long expiry

    res.status(201).json({
        message: 'Usuario registrado',
        token,
        user: { id: newUser.id, name: newUser.username }
    });
};

const login = async (req, res) => {
    const { username, pin } = req.body;
    const users = loadUsers();
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());

    if (!user) {
        return res.status(400).json({ message: 'Usuario no encontrado' });
    }

    const isMatch = await bcrypt.compare(pin, user.pin);
    if (!isMatch) {
        return res.status(400).json({ message: 'PIN incorrecto' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '365d' });

    res.json({
        message: 'Login exitoso',
        token,
        user: { id: user.id, name: user.username }
    });
};

module.exports = { register, login };
