const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    group_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },
    sender: {
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
        enum: ['text', 'image', 'video', 'audio'],
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

module.exports = mongoose.model('Group_Message', messageSchema);
