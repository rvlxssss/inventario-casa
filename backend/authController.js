const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendRecoveryEmail } = require('./emailService');

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
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    // Password Validation Regex
    // At least 8 chars, 1 letter, 1 number, 1 special char (broadened)
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&._\-])[A-Za-z\d@$!%*#?&._\-]{8,}$/;
    if (!passwordRegex.test(password)) {
        return res.status(400).json({
            message: 'La contraseña debe tener al menos 8 caracteres, una letra, un número y un carácter especial (@$!%*#?&._-).'
        });
    }

    const users = loadUsers();
    if (users.find(u => u.email === email)) {
        return res.status(400).json({ message: 'El usuario ya existe' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
        id: Date.now().toString(),
        email,
        name,
        password: hashedPassword,
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    saveUsers(users);

    // Auto-login after register
    const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
        message: 'Usuario registrado',
        token,
        user: { id: newUser.id, name: newUser.name, email: newUser.email }
    });
};

const login = async (req, res) => {
    const { email, password } = req.body;
    const users = loadUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
        return res.status(400).json({ message: 'Credenciales inválidas' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(400).json({ message: 'Credenciales inválidas' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
        message: 'Login exitoso',
        token,
        user: { id: user.id, name: user.name, email: user.email }
    });
};

const forgotPassword = async (req, res) => {
    const { email } = req.body;
    const users = loadUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
        // Security: Don't reveal if user exists
        return res.json({ message: 'Si el correo existe, recibirás instrucciones.' });
    }

    const resetToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1h' });
    user.resetToken = resetToken;
    saveUsers(users);

    await sendRecoveryEmail(email, resetToken);

    res.json({ message: 'Si el correo existe, recibirás instrucciones.' });
};

const resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const users = loadUsers();
        const user = users.find(u => u.id === decoded.id);

        if (!user || user.resetToken !== token) {
            return res.status(400).json({ message: 'Token inválido o expirado' });
        }

        // Validate new password
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({
                message: 'La contraseña debe tener al menos 8 caracteres, una letra, un número y un carácter especial.'
            });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        delete user.resetToken;
        saveUsers(users);

        res.json({ message: 'Contraseña actualizada correctamente' });

    } catch (error) {
        return res.status(400).json({ message: 'Token inválido o expirado' });
    }
};

module.exports = { register, login, forgotPassword, resetPassword };
