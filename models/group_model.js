const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    group_pic: {
        type: String,
        default: "https://cdn-icons-png.flaticon.com/512/149/149071.png"
    },
   timestamp: {
        type: Number,
        default: () => Math.floor(Date.now() / 1000) // Unix timestamp
    }
}, {
    versionKey: false
});

module.exports = mongoose.model('Group', groupSchema);
