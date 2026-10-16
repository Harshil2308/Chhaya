const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { askAssistant, getAssistantStatus } = require('../controllers/assistantController');

// GET /api/assistant/status — check if feature is enabled
router.get('/status', protect, getAssistantStatus);

// POST /api/assistant — ask the heat-safety assistant
router.post('/', protect, askAssistant);

module.exports = router;
