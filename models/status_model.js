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
    default: 'image'
  },
  caption: {
    type: String,
    default: ''
  },
  created_at: {
    type: Number,
    default: () => Math.floor(Date.now() / 1000) // ✅ Unix timestamp
  },
  expires_at: {
    type: Number,
    default: () => Math.floor(Date.now() / 1000) + 86400,  // +24 hours in seconds
  },
  seen_by: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      seen_at: {
        type: Number,
        default: () => Math.floor(Date.now() / 1000) // Unix timestamp
      }
    }
  ]
}, { versionKey: false });

module.exports = mongoose.model('Status', statusSchema);
