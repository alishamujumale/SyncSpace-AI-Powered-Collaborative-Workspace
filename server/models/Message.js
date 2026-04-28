const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true
  },
  isAI: {
    type: Boolean,
    default: false  // true when message is from AI assistant
  }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);