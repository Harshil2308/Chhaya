const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    sparse: true,
    unique: true
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
  profilePhoto: {
    type: String,
    default: ''
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
    required: true,
    trim: true,
    default: ''
  },
  // ── Gujarat city + area fields ─────────────────────────────────────────────
  // Workers: their assigned city + area
  city: {
    type: String,
    trim: true,
    default: ''
  },
  areaName: {
    type: String,
    trim: true,
    default: ''
  },
  // Managers: the city + area they are responsible for
  managedCity: {
    type: String,
    trim: true,
    default: ''
  },
  managedArea: {
    type: String,
    trim: true,
    default: ''
  },
  // ──────────────────────────────────────────────────────────────────────────
  emergencyContactName: {
    type: String,
    default: '',
    trim: true
  },
  emergencyContactPhone: {
    type: String,
    default: '',
    trim: true
  },
  language: {
    type: String,
    enum: ['en', 'hi', 'gu'],
    default: 'en'
  },
  // ── Profile extras ────────────────────────────────────────────────────────
  email: {
    type: String,
    default: '',
    lowercase: true,
    trim: true,
    sparse: true   // sparse index so empty strings don't conflict
  },
  profilePhoto: {
    type: String,
    default: ''   // base64 data URL or empty string
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
