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
    set: (v) => (v && typeof v === 'string' && v.trim() ? v.trim().toLowerCase() : undefined)
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
    default: '' // base64 data URL or empty string
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
  }
}, {
  timestamps: true
});

// Partial unique index: only enforces uniqueness for non-empty string emails.
// Omits null, undefined, and empty strings so accounts without emails never conflict.
userSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: { email: { $type: 'string', $gt: '' } }
  }
);

module.exports = mongoose.model('User', userSchema);
