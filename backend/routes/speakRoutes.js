const express = require('express');
const router = express.Router();
const { SarvamAIClient } = require('sarvamai');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const { protect } = require('../middleware/authMiddleware');

// ── Rate limiter: 20 TTS requests per minute per IP ──
const ttsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'Too many TTS requests, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── In-memory audio cache (key = md5(text+lang), value = base64 string) ──
const audioCache = new Map();
const MAX_CACHE_SIZE = 200; // evict oldest after 200 entries

function getCacheKey(text, lang) {
  return crypto.createHash('md5').update(`${lang}:${text}`).digest('hex');
}

function cacheSet(key, value) {
  if (audioCache.size >= MAX_CACHE_SIZE) {
    // evict the oldest entry
    audioCache.delete(audioCache.keys().next().value);
  }
  audioCache.set(key, value);
}

// ── Language code mapping: our app codes → Sarvam BCP-47 codes ──
const LANG_CODE_MAP = {
  en: 'en-IN',
  hi: 'hi-IN',
  gu: 'gu-IN',
};

/**
 * POST /api/speak
 * Body: { text: string, lang: 'en'|'hi'|'gu' }
 * Returns: { audio: '<base64-pcm>' }
 */
router.post('/', ttsLimiter, protect, async (req, res) => {
  try {
    const { text, lang = 'en' } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'text is required' });
    }
    if (text.length > 500) {
      return res.status(400).json({ error: 'text exceeds 500 character limit' });
    }

    const languageCode = LANG_CODE_MAP[lang] || 'en-IN';
    const cacheKey = getCacheKey(text, languageCode);

    // Return cached audio if available
    if (audioCache.has(cacheKey)) {
      return res.json({ audio: audioCache.get(cacheKey), cached: true });
    }

    const client = new SarvamAIClient({
      apiSubscriptionKey: process.env.SARVAM_API_KEY,
    });

    const response = await client.textToSpeech.convert({
      inputs: [text],
      target_language_code: languageCode,
      model: 'bulbul:v1',
      speaker: 'anushka',
    });

    // bulbul returns an array of base64 audio strings in response.audios
    const audios = response.audios || response.audio;
    if (!audios || audios.length === 0) {
      return res.status(502).json({ error: 'No audio returned from Sarvam TTS' });
    }

    const audioBase64 = Array.isArray(audios) ? audios[0] : audios;
    cacheSet(cacheKey, audioBase64);

    return res.json({ audio: audioBase64 });
  } catch (err) {
    console.error('[TTS] Sarvam error:', err?.message || err);
    // Return 503 so the frontend can show a graceful fallback
    return res.status(503).json({ error: 'TTS service temporarily unavailable' });
  }
});

module.exports = router;
