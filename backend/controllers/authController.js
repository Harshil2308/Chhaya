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
      emergencyContactPhone,
      language
    } = req.body;

    // Check all required sections
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Full Name is required' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ message: 'Phone number is required' });
    }
    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }
    if (!location || !location.trim()) {
      return res.status(400).json({ message: 'Location / City is required' });
    }

    // Phone number validation: must be 10 digits starting with 6, 7, 8, or 9
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone.trim())) {
      return res.status(400).json({
        message: 'Phone number must be a valid 10-digit mobile number starting with 6, 7, 8, or 9'
      });
    }

    // Secure password validation: at least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters long'
      });
    }
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password);

    if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      return res.status(400).json({
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      });
    }

    // Emergency contact phone validation (if provided)
    if (emergencyContactPhone && emergencyContactPhone.trim() && !phoneRegex.test(emergencyContactPhone.trim())) {
      return res.status(400).json({
        message: 'Emergency contact phone must be a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ phone: phone.trim() });
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

    // Public registration is strictly for workers; prevents privilege escalation
    const sanitizedRole = 'worker';

    const validLanguages = ['en', 'hi', 'gu'];
    const sanitizedLanguage = language && validLanguages.includes(language) ? language : 'en';

    const user = await User.create({
      name: name.trim(),
      phone: phone.trim(),
      password: hashedPassword,
      role: sanitizedRole,
      occupation: sanitizedOccupation,
      location: location.trim(),
      emergencyContactName: emergencyContactName ? emergencyContactName.trim() : '',
      emergencyContactPhone: emergencyContactPhone ? emergencyContactPhone.trim() : '',
      language: sanitizedLanguage
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
        emergencyContactPhone: user.emergencyContactPhone,
        language: user.language
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
        emergencyContactPhone: user.emergencyContactPhone || '',
        language: user.language || 'en'
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
      emergencyContactPhone,
      language
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

    if (language !== undefined) {
      const validLanguages = ['en', 'hi', 'gu'];
      if (validLanguages.includes(language)) {
        user.language = language;
      }
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
        emergencyContactPhone: user.emergencyContactPhone,
        language: user.language
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { register, login, updateMe };