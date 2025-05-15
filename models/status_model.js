const mongoose = require('mongoose');

const statusSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    media_url: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['image', 'video', 'text'],
        default:"image"
    },
    caption: {
        type: String,
        default: ''
    },
    created_at: {
        type: Date,
        default: Date.now,
        expires: 86400 // 👈 Auto-delete after 24 hours (60 * 60 * 24)
    }
}, { versionKey: false });

module.exports = mongoose.model('Status', statusSchema);
