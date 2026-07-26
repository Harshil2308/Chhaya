const express = require('express');
const router = express.Router();

const {
  getCoolingCenters,
  addCoolingCenter,
  deleteCoolingCenter
} = require('../controllers/coolingCenterController');

const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', protect, getCoolingCenters);
router.post('/', protect, admin, addCoolingCenter);
router.delete('/:id', protect, admin, deleteCoolingCenter);

module.exports = router;