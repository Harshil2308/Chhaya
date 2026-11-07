const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { isValidCity, isValidArea } = require('../utils/gujaratData');

// Helper: build safe user object for API responses
const buildUserResponse = (user) => ({
  id: user._id,
  name: user.name,
  phone: user.phone,
  email: user.email || '',
  role: user.role,
  occupation: user.occupation || 'other',
  location: user.location || '',
  city: user.city || '',
  areaName: user.areaName || '',
  managedCity: user.managedCity || '',
  managedArea: user.managedArea || '',
  emergencyContactName: user.emergencyContactName || '',
  emergencyContactPhone: user.emergencyContactPhone || '',
  language: user.language || 'en',
  profilePhoto: user.profilePhoto || ''
});

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
      city,
      areaName,
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
    if (!emergencyContactName || !emergencyContactName.trim()) {
      return res.status(400).json({ message: 'Emergency contact name is required' });
    }
    if (!emergencyContactPhone || !emergencyContactPhone.trim()) {
      return res.status(400).json({ message: 'Emergency contact phone is required' });
    }

    // Phone number validation: must be 10 digits starting with 6, 7, 8, or 9
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone.trim())) {
      return res.status(400).json({
        message: 'Phone number must be a valid 10-digit mobile number starting with 6, 7, 8, or 9'
      });
    }

    // Emergency contact phone validation
    if (!phoneRegex.test(emergencyContactPhone.trim())) {
      return res.status(400).json({
        message: 'Emergency contact phone must be a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9'
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

    // Gujarat city validation (required for workers)
    const trimmedCity = city ? city.trim() : '';
    const trimmedArea = areaName ? areaName.trim() : '';

    if (!trimmedCity) {
      return res.status(400).json({ message: 'City is required' });
    }
    if (!isValidCity(trimmedCity)) {
      return res.status(400).json({ message: `"${trimmedCity}" is not a valid Gujarat city` });
    }
    if (!trimmedArea) {
      return res.status(400).json({ message: 'Area is required' });
    }
    if (!isValidArea(trimmedCity, trimmedArea)) {
      return res.status(400).json({ message: `"${trimmedArea}" is not a valid area in ${trimmedCity}` });
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
      city: trimmedCity,
      areaName: trimmedArea,
      emergencyContactName: emergencyContactName ? emergencyContactName.trim() : '',
      emergencyContactPhone: emergencyContactPhone ? emergencyContactPhone.trim() : '',
      language: sanitizedLanguage
    });

    // Create token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: buildUserResponse(user)
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
      user: buildUserResponse(user)
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
      email,
      phone,
      occupation,
      location,
      city,
      areaName,
      emergencyContactName,
      emergencyContactPhone,
      language,
      profilePhoto
    } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const phoneRegex = /^[6-9]\d{9}$/;

    // Name
    if (name !== undefined) {
      if (!name || !name.trim()) {
        return res.status(400).json({ message: 'Full Name cannot be empty' });
      }
      user.name = name.trim();
    }

    // Phone validation & uniqueness check
    if (phone !== undefined && phone.trim()) {
      const trimmedPhone = phone.trim();
      if (!phoneRegex.test(trimmedPhone)) {
        return res.status(400).json({
          message: 'Phone number must be a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9'
        });
      }

      if (trimmedPhone !== user.phone) {
        const phoneExists = await User.findOne({
          phone: trimmedPhone,
          _id: { $ne: user._id }
        });
        if (phoneExists) {
          return res.status(400).json({
            message: 'Phone number is already registered to another account'
          });
        }
        user.phone = trimmedPhone;
      }
    }

    // Email validation & uniqueness check (optional)
    if (email !== undefined) {
      const trimmedEmail = email ? email.toLowerCase().trim() : '';
      if (trimmedEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
          return res.status(400).json({
            message: 'Please enter a valid email address'
          });
        }

        const emailExists = await User.findOne({
          email: trimmedEmail,
          _id: { $ne: user._id }
        });
        if (emailExists) {
          return res.status(400).json({
            message: 'Email address is already in use by another account'
          });
        }
        user.email = trimmedEmail;
      } else {
        user.email = undefined;
      }
    }

    // Occupation (only meaningful for workers, but accept from all)
    if (occupation !== undefined) {
      const valid = ['construction', 'farmer', 'delivery', 'vendor', 'other'];
      if (valid.includes(occupation.toLowerCase().trim())) {
        user.occupation = occupation.toLowerCase().trim();
      }
    }

    // Location (city name text, legacy field)
    if (location !== undefined) {
      user.location = location.trim();
    }

    // Update Gujarat city + area (workers)
    if (city !== undefined && areaName !== undefined) {
      const trimmedCity = city.trim();
      const trimmedArea = areaName.trim();
      if (trimmedCity && isValidCity(trimmedCity)) {
        if (trimmedArea && isValidArea(trimmedCity, trimmedArea)) {
          user.city = trimmedCity;
          user.areaName = trimmedArea;
        }
      }
    }

    // Emergency contact name
    if (emergencyContactName !== undefined) {
      user.emergencyContactName = emergencyContactName.trim();
    }

    // Emergency contact phone
    if (emergencyContactPhone !== undefined) {
      const trimmedPhone = emergencyContactPhone.trim();
      if (trimmedPhone && !phoneRegex.test(trimmedPhone)) {
        return res.status(400).json({
          message: 'Emergency contact phone must be a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9'
        });
      }
      user.emergencyContactPhone = trimmedPhone;
    }

    // Language
    if (language !== undefined) {
      const validLanguages = ['en', 'hi', 'gu'];
      if (validLanguages.includes(language)) {
        user.language = language;
      }
    }

    // Profile photo
    if (profilePhoto !== undefined) {
      user.profilePhoto = profilePhoto || '';
    }

    // Ensure required location field is never empty to prevent validation failure
    if (!user.location || !user.location.trim()) {
      user.location = (location && location.trim()) ? location.trim() : 'Ahmedabad';
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: buildUserResponse(user)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Change Password (PUT /api/auth/change-password)
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword) {
      return res.status(400).json({ message: 'Current password is required' });
    }
    if (!newPassword) {
      return res.status(400).json({ message: 'New password is required' });
    }

    // Query user with password hash
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify oldPassword against stored hash
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Validate newPassword rules: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return res.status(400).json({
        message: 'New password must be at least 8 characters long'
      });
    }

    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(newPassword);

    if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      return res.status(400).json({
        message: 'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      });
    }

    // Check if new password is same as current password
    const isSame = await bcrypt.compare(newPassword, user.password);
    if (isSame) {
      return res.status(400).json({
        message: 'New password cannot be the same as your current password'
      });
    }

    // Hash and save new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({
      message: 'Password changed successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/auth/me — return current user profile (all fields)
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(buildUserResponse(user));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { register, login, updateMe, changePassword, getMe };
