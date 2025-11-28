const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    pin: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    products: { type: Array, default: [] },
    categories: { type: Array, default: [] },
    expenses: { type: Object, default: {} },
    transactions: { type: Array, default: [] }
});

module.exports = mongoose.model('User', userSchema);
