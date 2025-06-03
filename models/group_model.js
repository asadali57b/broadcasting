const e = require('express');
const mongoose = require('mongoose');
const { send_message } = require('../controller/messages_controller');

const groupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ""
    },
    media_visability: {
        type: Boolean,
        enum: [true, false],
        default: true
    },
    disappearing_messages: {
        type: Number,
        default: 0
    },
    chat_lock: {
        type: Boolean,
        enum: [true, false],
        default: false
    },
   group_permissions: {
  members_can: {
    edit_group_settings: { type: Boolean, default: true },
    send_message: { type: Boolean, default: true },
    add_other_members: { type: Boolean, default: false }
  },
  admins_can: {
    approve_new_members: { type: Boolean, default: false },
  },
 
},
group_link: {
    type: String,
    default: ""
},
    
    admin: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
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
