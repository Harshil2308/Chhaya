const mongoose = require('mongoose');

const coolingCenterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['Park', 'Community Hall', 'School', 'Hospital', 'Other'],
    default: 'Other'
  },
  facilities: {
    type: String,
    default: 'Shade, Water'
  },
  contact: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CoolingCenter', coolingCenterSchema);