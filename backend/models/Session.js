const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    roomId: { type: String, required: true },
    products: { type: Array, default: [] },
    categories: { type: Array, default: [] },
    members: { type: Array, default: [] },
    createdAt: { type: Date, default: Date.now, expires: 86400 } // Auto-delete after 24 hours
});

module.exports = mongoose.model('Session', sessionSchema);
