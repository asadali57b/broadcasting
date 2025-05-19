const mongoose = require("mongoose");

const CallSchema = new mongoose.Schema({
  caller_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiver_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  call_type: { type: String, enum: ["audio", "video"], required: true },
  status: {
    type: String,
    enum: ["initiated", "accepted", "rejected", "missed", "ended"],
    default: "initiated",
  },
  started_at: { type: Number }, // Unix timestamp in milliseconds
  ended_at: { type: Number },   // Unix timestamp in milliseconds
  duration: { type: Number },  // in seconds
  channel_id: { type: String },
}, { timestamps: true }); // Optional: Mongo's own createdAt & updatedAt

module.exports = mongoose.model("Call", CallSchema);
