const express = require('express');
const router = express.Router();
const {
  createTeam,
  joinTeam,
  getMyTeams
} = require('../controllers/teamController');
const { protect, manager } = require('../middleware/authMiddleware');

router.post('/', protect, manager, createTeam);
router.get('/my', protect, getMyTeams);
router.post('/join', protect, joinTeam);
router.post('/:id/join', protect, joinTeam);

module.exports = router;
