const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    profile_pic: {
        type: String,
        default: "https://cdn-icons-png.flaticon.com/512/149/149071.png"
    },
    phone_number: {
        type: String,
        required: true,
    },
    is_admin: {
        type: Boolean,
        default: false
    },
    is_active: {
        type: Boolean,
        default: false
    },
    created_at: {
        type: Number,
        default: () => Math.floor(Date.now() / 1000) // Unix timestamp
    },
    // models/User.js

resetPasswordToken: {
  type: String,
  default: null
},
resetPasswordExpires: {
  type: Date,
  default: null
}

}, {
    versionKey: false // Removes __v
});

module.exports = mongoose.model('User', userSchema);
