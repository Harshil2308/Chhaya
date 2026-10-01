const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['worker', 'manager', 'admin'],
    default: 'worker'
  },
  occupation: {
    type: String,
    enum: ['construction', 'farmer', 'delivery', 'vendor', 'other'],
    default: 'other',
    lowercase: true,
    trim: true
  },
  location: {
    type: String,
    default: ''
  },
  emergencyContactName: {
    type: String,
    default: '',
    trim: true
  },
  emergencyContactPhone: {
    type: String,
    default: '',
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);