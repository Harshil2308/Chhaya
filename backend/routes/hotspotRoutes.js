const express = require('express');
const router = express.Router();

const {
  reportHotspot,
  getHotspots,
  updateHotspotStatus
} = require('../controllers/hotspotController');

const { protect, manager } = require('../middleware/authMiddleware');

// Any logged-in user can report and view complaints/hotspots
router.post('/', protect, reportHotspot);
router.get('/', protect, getHotspots);

// Managers and Admins can update status (Pending -> Verified -> Resolved)
router.put('/:id', protect, manager, updateHotspotStatus);

module.exports = router;