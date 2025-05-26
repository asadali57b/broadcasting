// models/Message.js

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true
    },
    message_type: {
        type: String,
        enum: ['text', 'image', 'video', 'audio','document'],
        default: 'text'
    },
    is_seen: {
        type: Boolean,
        default: false
    },
    timestamp: {
        type: Number,
        default: () => Math.floor(Date.now() / 1000) // Unix timestamp
    }
}, {
    versionKey: false
});

module.exports = mongoose.model('Message', messageSchema);
