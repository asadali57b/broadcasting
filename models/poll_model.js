const mongoose = require('mongoose');

const pollSchema = new mongoose.Schema({
    group_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },
    question: {
        type: String,
        required: true
    },
    options: [
        {
            text: String,
            votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] // store who voted
        }
    ],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    timestamp: {
        type: Number,
        default: () => Math.floor(Date.now() / 1000) // Unix timestamp
    }
},{
    versionKey: false});

module.exports = mongoose.model('Poll', pollSchema);
