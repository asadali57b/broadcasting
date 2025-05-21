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
  seen_by: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  is_seen: {
    type: Boolean,
    default: false
  },
  deleted_for: [{ // ✅ Add this field
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  timestamp: {
    type: Number,
    default: () => Math.floor(Date.now() / 1000)
  }
}, { versionKey: false });

module.exports = mongoose.model('Group_Message', messageSchema);
