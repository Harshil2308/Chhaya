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
    audioCache.delete(audioCache.keys().next().value);
  }
  audioCache.set(key, value);
}

// ── Language code mapping: our app codes → Sarvam BCP-47 codes ──
const LANG_CODE_MAP = {
  en: 'en-IN',
  'en-IN': 'en-IN',
  hi: 'hi-IN',
  'hi-IN': 'hi-IN',
  gu: 'gu-IN',
  'gu-IN': 'gu-IN',
};

// Known advice translations fallback to guarantee no English text is spoken under hi-IN/gu-IN
const ADVICE_MAP = {
  'Normal conditions. Stay hydrated.': {
    'hi-IN': 'सामान्य स्थितियाँ। नियमित रूप से पानी पीते रहें।',
    'gu-IN': 'સામાન્ય સ્થિતિ. પૂરતું પાણી પીતા રહો.',
    'en-IN': 'Normal conditions. Stay hydrated.',
  },
  'Drink water regularly and take short breaks.': {
    'hi-IN': 'नियमित पानी पिएं और छाया में छोटे ब्रेक लें।',
    'gu-IN': 'નિયમિત પાણી પીઓ અને છાંયડામાં ટૂંકો વિરામ લો.',
    'en-IN': 'Drink water regularly and take short breaks.',
  },
  'Limit outdoor work. Take frequent breaks in shade.': {
    'hi-IN': 'बाहरी काम सीमित करें। छाया में बार-बार आराम करें।',
    'gu-IN': 'બહારનું કામ મર્યાદિત કરો. છાંયડામાં વારંવાર આરામ કરો.',
    'en-IN': 'Limit outdoor work. Take frequent breaks in shade.',
  },
  'Dangerous! Avoid heavy work during peak hours.': {
    'hi-IN': 'खतरनाक! दोपहर के चरम घंटों में भारी काम से बचें।',
    'gu-IN': 'જોખમી! બપોરના આકરા તડકામાં ભારે કામ કરવાનું ટાળો.',
    'en-IN': 'Dangerous! Avoid heavy work during peak hours.',
  },
  'Extreme danger. Stay indoors if possible.': {
    'hi-IN': 'अत्यधिक खतरा। यदि संभव हो तो धूप में काम तुरंत रोकें।',
    'gu-IN': 'અત્યંત ગંભીર જોખમ. શક્ય હોય તો તડકામાં કામ તરત જ અટકાવો.',
    'en-IN': 'Extreme danger. Stay indoors if possible.',
  },
  'Normal conditions. Drink water every 30 minutes before feeling thirsty. Keep ORS packet handy.': {
    'hi-IN': 'सामान्य स्थितियाँ। प्यास लगने से पहले हर 30 मिनट में पानी पिएं। ORS पैकेट पास रखें।',
    'gu-IN': 'સામાન્ય સ્થિતિ. તરસ લાગે તે પહેલાં દર ૩૦ મિનિટે પાણી પીઓ. ORS પેકેટ સાથે રાખો.',
    'en-IN': 'Normal conditions. Drink water every 30 minutes before feeling thirsty. Keep ORS packet handy.',
  },
};

/**
 * POST /api/speak
 * Body: { text: string, lang: 'en'|'hi'|'gu'|'en-IN'|'hi-IN'|'gu-IN' }
 * Returns: { audio: '<base64-wav>', lang: string, cached?: boolean }
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

    if (!process.env.SARVAM_API_KEY) {
      return res.status(500).json({ error: 'SARVAM_API_KEY not configured' });
    }

    const client = new SarvamAIClient({
      apiSubscriptionKey: process.env.SARVAM_API_KEY,
    });

    // Guard against English text being spoken under hi-IN or gu-IN
    let textToSpeak = text.trim();
    if (ADVICE_MAP[textToSpeak] && ADVICE_MAP[textToSpeak][languageCode]) {
      textToSpeak = ADVICE_MAP[textToSpeak][languageCode];
    } else if (languageCode !== 'en-IN' && /[a-zA-Z]{3,}/.test(textToSpeak)) {
      // If text contains English words and target language is Gujarati or Hindi, translate first
      try {
        const trRes = await client.text.translate({
          input: textToSpeak,
          source_language_code: 'en-IN',
          target_language_code: languageCode,
        });
        if (trRes && trRes.translated_text) {
          textToSpeak = trRes.translated_text.trim();
        }
      } catch (trErr) {
        console.warn('[TTS] Automatic translation warning:', trErr?.message || trErr);
      }
    }

    const cacheKey = getCacheKey(textToSpeak, languageCode);

    // Return cached audio if available
    if (audioCache.has(cacheKey)) {
      return res.json({ audio: audioCache.get(cacheKey), lang: languageCode, cached: true });
    }

    // Call Sarvam text-to-speech with proper language_code and bulbul:v3 model
    const response = await client.textToSpeech.convert({
      text: textToSpeak,
      language_code: languageCode,
      model: 'bulbul:v3',
      speaker: 'ritu',
    });

    const audios = response.audios || response.audio;
    if (!audios || audios.length === 0) {
      return res.status(502).json({ error: 'No audio returned from Sarvam TTS' });
    }

    const audioBase64 = Array.isArray(audios) ? audios[0] : audios;
    cacheSet(cacheKey, audioBase64);

    return res.json({ audio: audioBase64, lang: languageCode });
  } catch (err) {
    console.error('[TTS] Sarvam error:', err?.message || err, err?.body || '');
    return res.status(503).json({
      error: 'TTS service temporarily unavailable',
      details: err?.message || 'Sarvam API error'
    });
  }
});

module.exports = router;
