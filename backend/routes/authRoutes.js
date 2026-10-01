const express = require('express');
const router = express.Router();
const { register, login, updateMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', protect, (req, res) => {
  res.json(req.user);
});
router.put('/me', protect, updateMe);

module.exports = router;