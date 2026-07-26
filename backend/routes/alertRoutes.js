const express = require('express');
const router = express.Router();
const { getHeatAlert } = require('../controllers/alertController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getHeatAlert);

module.exports = router;