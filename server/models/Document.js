const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    default: 'Untitled Document'
  },
  content: {
    type: String,
    default: ''
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  collaborators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  shareId: {
    type: String,
    unique: true  // unique link for sharing
  },
  isPublic: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Document', documentSchema);