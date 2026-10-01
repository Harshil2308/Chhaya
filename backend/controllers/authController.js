const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register
const register = async (req, res) => {
  try {
    const {
      name,
      phone,
      password,
      role,
      occupation,
      location,
      emergencyContactName,
      emergencyContactPhone
    } = req.body;

    // Phone number validation
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        message: 'Please enter a valid 10-digit Indian mobile number'
      });
    }

    // Emergency contact phone validation (if provided)
    if (emergencyContactPhone && !phoneRegex.test(emergencyContactPhone)) {
      return res.status(400).json({
        message: 'Emergency contact phone must be a valid 10-digit Indian mobile number'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const validOccupations = ['construction', 'farmer', 'delivery', 'vendor', 'other'];
    const sanitizedOccupation = occupation && validOccupations.includes(occupation.toLowerCase().trim())
      ? occupation.toLowerCase().trim()
      : 'other';

    const user = await User.create({
      name,
      phone,
      password: hashedPassword,
      role: role || 'worker',
      occupation: sanitizedOccupation,
      location: location || '',
      emergencyContactName: emergencyContactName ? emergencyContactName.trim() : '',
      emergencyContactPhone: emergencyContactPhone ? emergencyContactPhone.trim() : ''
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        occupation: user.occupation,
        location: user.location,
        emergencyContactName: user.emergencyContactName,
        emergencyContactPhone: user.emergencyContactPhone
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    // Phone number validation
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        message: 'Please enter a valid 10-digit Indian mobile number'
      });
    }

    // Check user
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        occupation: user.occupation || 'other',
        location: user.location,
        emergencyContactName: user.emergencyContactName || '',
        emergencyContactPhone: user.emergencyContactPhone || ''
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update current user profile (PUT /api/auth/me)
const updateMe = async (req, res) => {
  try {
    const {
      name,
      occupation,
      location,
      emergencyContactName,
      emergencyContactPhone
    } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) user.name = name.trim();

    if (occupation) {
      const valid = ['construction', 'farmer', 'delivery', 'vendor', 'other'];
      if (valid.includes(occupation.toLowerCase().trim())) {
        user.occupation = occupation.toLowerCase().trim();
      }
    }

    if (location !== undefined) {
      user.location = location.trim();
    }

    if (emergencyContactName !== undefined) {
      user.emergencyContactName = emergencyContactName.trim();
    }

    if (emergencyContactPhone !== undefined) {
      const trimmedPhone = emergencyContactPhone.trim();
      if (trimmedPhone && !/^[6-9]\d{9}$/.test(trimmedPhone)) {
        return res.status(400).json({
          message: 'Emergency contact phone must be a valid 10-digit Indian mobile number'
        });
      }
      user.emergencyContactPhone = trimmedPhone;
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        occupation: user.occupation,
        location: user.location,
        emergencyContactName: user.emergencyContactName,
        emergencyContactPhone: user.emergencyContactPhone
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { register, login, updateMe };