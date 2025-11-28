const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_dev_key_12345';

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

    try {
        const existingUser = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } });
        if (existingUser) {
            return res.status(400).json({ message: 'El nombre de usuario ya existe' });
        }

        const hashedPin = await bcrypt.hash(pin, 10);
        const newUser = new User({
            username,
            pin: hashedPin
        });

        await newUser.save();

        // Auto-login after register
        const token = jwt.sign({ id: newUser._id, username: newUser.username }, JWT_SECRET, { expiresIn: '365d' });

        res.status(201).json({
            message: 'Usuario registrado',
            token,
            user: { id: newUser._id, name: newUser.username }
        });
    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ message: 'Error al registrar usuario' });
    }
};

const login = async (req, res) => {
    const { username, pin } = req.body;

    try {
        const user = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } });

        if (!user) {
            return res.status(400).json({ message: 'Usuario no encontrado' });
        }

        const isMatch = await bcrypt.compare(pin, user.pin);
        if (!isMatch) {
            return res.status(400).json({ message: 'PIN incorrecto' });
        }

        const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '365d' });

        res.json({
            message: 'Login exitoso',
            token,
            user: { id: user._id, name: user.username }
        });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: 'Error al iniciar sesión' });
    }
};

module.exports = { register, login };
