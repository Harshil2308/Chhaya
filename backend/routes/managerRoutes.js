const express = require('express');
const router = express.Router();
const { getAreaSummary, getAreaWorkers, getAreaHotspots } = require('../controllers/managerController');
const { protect, manager } = require('../middleware/authMiddleware');

// All manager routes require JWT auth + manager (or admin) role
router.get('/area-summary', protect, manager, getAreaSummary);
router.get('/workers',      protect, manager, getAreaWorkers);
router.get('/hotspots',     protect, manager, getAreaHotspots);

module.exports = router;
