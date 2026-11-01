const express = require('express');
const router = express.Router();
const { register, login, updateMe, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);

module.exports = router;