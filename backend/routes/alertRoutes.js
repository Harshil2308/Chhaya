const express = require('express');
const router = express.Router();
const { getHeatAlert, getForecastAlert } = require('../controllers/alertController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getHeatAlert);
router.get('/forecast', protect, getForecastAlert);

module.exports = router;