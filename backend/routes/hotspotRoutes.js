const express = require('express');
const router = express.Router();

const {
  reportHotspot,
  getHotspots,
  updateHotspotStatus
} = require('../controllers/hotspotController');

const { protect, admin } = require('../middleware/authMiddleware');

// Any logged-in user can report and view
router.post('/', protect, reportHotspot);
router.get('/', protect, getHotspots);

// Only admin can update status
router.put('/:id', protect, admin, updateHotspotStatus);

module.exports = router;