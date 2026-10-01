const mongoose = require('mongoose');

const checkInSchema = new mongoose.Schema({
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  worker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['OK', 'SOS'],
    required: true
  },
  latitude: {
    type: Number,
    default: null
  },
  longitude: {
    type: Number,
    default: null
  },
  note: {
    type: String,
    default: '',
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CheckIn', checkInSchema);
