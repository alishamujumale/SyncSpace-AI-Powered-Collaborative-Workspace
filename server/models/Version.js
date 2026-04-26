const mongoose = require('mongoose');

const versionSchema = new mongoose.Schema({
  document: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  savedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  versionNumber: {
    type: Number,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Version', versionSchema);