/**
 * Assistant Controller — POST /api/assistant
 *
 * Flow:
 *  1. Validate input (message, language)
 *  2. Check per-user rate limit (15 req / hour, in-process Map)
 *  3. Emergency check — skip AI if emergency phrase detected
 *  4. Fetch live weather for user's city, recompute personal risk server-side
 *  5. Build system prompt with only safe context (job, city, riskLevel, heatIndex)
 *  6. Call Sarvam AI with 15s timeout
 *  7. Return JSON with reply, disclaimer, emergency flag
 *
 * No chat is stored in DB.
 * API key is never sent to the frontend.
 */

const axios = require('axios');
const { calculateHeatIndex, getRiskLevel } = require('../utils/heatIndex');
const { calculatePersonalRisk } = require('../utils/personalRisk');
const { checkEmergency } = require('../utils/emergencyCheck');
const { callSarvam, friendlyError } = require('../utils/sarvamClient');

// ── Per-user in-memory rate limiter ──────────────────────────────────────────
// Map<userId, { count: number, windowStart: number }>
const userRateLimitStore = new Map();
const RATE_LIMIT_MAX = 15;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

const isRateLimited = (userId) => {
  const now = Date.now();
  const entry = userRateLimitStore.get(userId);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    // New window
    userRateLimitStore.set(userId, { count: 1, windowStart: now });
    return false;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return true;
  }

  entry.count += 1;
  return false;
};

// ── System prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT =
  "You are Chhaya's heat-safety helper for Indian outdoor workers. " +
  'Reply in the user\'s language, in very simple words, maximum 3 short sentences. ' +
  'Give only general heat-safety tips: shade, water, ORS, rest breaks, cooler working hours, ' +
  'light clothing, covering the head. ' +
  "Use the worker's job and current risk level to make tips practical (they cannot always stop working). " +
  'Do NOT diagnose, do NOT give medicine or doses, do NOT claim to be a doctor. ' +
  'If the question is not about heat safety, politely say you can only help with heat safety. ' +
  'If you are unsure or the situation sounds serious, tell them to call 108.';

const DISCLAIMER = 'AI guidance, not medical advice. In an emergency call 108.';

const VALID_LANGUAGES = ['en', 'hi', 'gu'];

// ── Fetch weather data ────────────────────────────────────────────────────────
const fetchWeatherForCity = async (city) => {
  const apiKey = process.env.WEATHER_API_KEY;
  if (!apiKey || !city) return null;
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}`;
    const response = await axios.get(url, { timeout: 8000 });
    const { temp, humidity } = response.data.main;
    return { temp, humidity };
  } catch {
    return null;
  }
};

// ── POST /api/assistant ───────────────────────────────────────────────────────
const askAssistant = async (req, res) => {
  // Feature gate: if no key, return 503
  if (!process.env.SARVAM_API_KEY) {
    return res.status(503).json({ enabled: false, message: 'Assistant unavailable' });
  }

  // 1. Validate input
  const rawMessage = req.body.message;
  if (!rawMessage || typeof rawMessage !== 'string') {
    return res.status(400).json({ message: 'Message is required.' });
  }
  const message = rawMessage.trim();
  if (message.length === 0) {
    return res.status(400).json({ message: 'Message cannot be empty.' });
  }
  if (message.length > 300) {
    return res.status(400).json({ message: 'Message must be 300 characters or fewer.' });
  }

  // 2. Resolve language: body > user profile > default 'en'
  const rawLang = req.body.language || req.user?.language || 'en';
  const lang = VALID_LANGUAGES.includes(rawLang) ? rawLang : 'en';

  // 3. Per-user rate limit
  const userId = req.user._id.toString();
  if (isRateLimited(userId)) {
    return res.status(429).json({
      message: 'You have reached the limit of 15 questions per hour. Please try again later.',
      disclaimer: DISCLAIMER,
    });
  }

  // 4. Emergency check — do NOT call AI
  const { isEmergency, reply: emergencyReply } = checkEmergency(message, lang);
  if (isEmergency) {
    return res.status(200).json({
      reply: emergencyReply,
      emergency: true,
      disclaimer: DISCLAIMER,
    });
  }

  // 5. Compute personal risk server-side (never trust client values)
  const occupation = req.user.occupation || 'other';
  const city = req.user.location || '';

  let personalRiskLevel = 'Unknown';
  let personalHeatIndex = null;

  const weatherData = await fetchWeatherForCity(city);
  if (weatherData) {
    const baseHeatIndex = calculateHeatIndex(weatherData.temp, weatherData.humidity);
    const personalRisk = calculatePersonalRisk(baseHeatIndex, occupation);
    if (personalRisk) {
      personalRiskLevel = personalRisk.personalRiskLevel;
      personalHeatIndex = personalRisk.personalHeatIndex;
    }
  }

  // 6. Build context for AI (no phone, name, password, token, or full user doc)
  const contextLines = [
    `Worker occupation: ${occupation}`,
    `Worker city: ${city || 'Unknown'}`,
    `Personal risk level: ${personalRiskLevel}`,
    personalHeatIndex != null ? `Personal heat index: ${personalHeatIndex}°C` : '',
    `Reply language: ${lang}`,
  ].filter(Boolean);

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `Worker context:\n${contextLines.join('\n')}\n\nWorker question: ${message}`,
    },
  ];

  // 7. Call Sarvam
  try {
    const aiReply = await callSarvam(messages, { temperature: 0.3, max_tokens: 150 });
    return res.status(200).json({
      reply: aiReply,
      emergency: false,
      disclaimer: DISCLAIMER,
    });
  } catch (err) {
    // Log only the error code/status, never the user message
    console.error('[Assistant] Sarvam call failed:', err?.response?.status || err.code || err.message);
    const safe = friendlyError(err);
    return res.status(502).json({
      message: safe,
      disclaimer: DISCLAIMER,
    });
  }
};

// ── GET /api/assistant/status ─────────────────────────────────────────────────
const getAssistantStatus = (req, res) => {
  const enabled = Boolean(process.env.SARVAM_API_KEY);
  return res.status(200).json({ enabled });
};

module.exports = { askAssistant, getAssistantStatus };
