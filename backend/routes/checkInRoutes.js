const express = require('express');
const router = express.Router();
const {
  createCheckIn,
  getTeamLiveBoard
} = require('../controllers/checkInController');
const { protect, manager } = require('../middleware/authMiddleware');

router.post('/', protect, createCheckIn);
router.get('/team/:teamId', protect, manager, getTeamLiveBoard);

module.exports = router;
