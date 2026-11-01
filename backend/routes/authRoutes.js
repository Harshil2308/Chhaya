const express = require('express');
const router = express.Router();
const { register, login, updateMe, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', protect, (req, res) => {
  res.json({
    id: req.user._id,
    name: req.user.name,
    email: req.user.email || '',
    phone: req.user.phone,
    role: req.user.role,
    occupation: req.user.occupation || 'other',
    location: req.user.location || '',
    emergencyContactName: req.user.emergencyContactName || '',
    emergencyContactPhone: req.user.emergencyContactPhone || '',
    language: req.user.language || 'en',
    profilePhoto: req.user.profilePhoto || ''
  });
});
router.put('/me', protect, updateMe);
router.put('/change-password', protect, changePassword);

module.exports = router;
