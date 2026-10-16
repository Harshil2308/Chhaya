/**
 * Sarvam AI client — wraps the chat completions API.
 * Uses the sarvamai npm package with OpenAI-compatible calls,
 * falls back to raw axios if the package call style differs.
 *
 * Primary model : sarvam-105b-conversations
 * Fallback model: sarvam-105b
 * Endpoint      : POST https://api.sarvam.ai/v1/chat/completions
 * Auth header   : api-subscription-key: <key>
 */

const axios = require('axios');

const SARVAM_BASE = 'https://api.sarvam.ai/v1';
const PRIMARY_MODEL = 'sarvam-105b-conversations';
const FALLBACK_MODEL = 'sarvam-105b';
const TIMEOUT_MS = 15000;

/**
 * Call Sarvam chat completions.
 * @param {Array<{role: string, content: string}>} messages
 * @param {{ temperature?: number, max_tokens?: number }} opts
 * @returns {Promise<string>} the assistant reply text
 */
const callSarvam = async (messages, opts = {}) => {
  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) {
    const err = new Error('SARVAM_API_KEY_MISSING');
    err.code = 'NO_KEY';
    throw err;
  }

  const payload = {
    model: PRIMARY_MODEL,
    messages,
    temperature: opts.temperature ?? 0.3,
    max_tokens: opts.max_tokens ?? 150,
    stream: false,
  };

  const headers = {
    'Content-Type': 'application/json',
    'api-subscription-key': apiKey,
  };

  const tryModel = async (model) => {
    const response = await axios.post(
      `${SARVAM_BASE}/chat/completions`,
      { ...payload, model },
      { headers, timeout: TIMEOUT_MS }
    );
    const text = response.data?.choices?.[0]?.message?.content;
    if (!text) throw new Error('EMPTY_RESPONSE');
    return text.trim();
  };

  try {
    return await tryModel(PRIMARY_MODEL);
  } catch (primaryErr) {
    // Only retry with fallback model on model-not-found type errors
    const status = primaryErr?.response?.status;
    const errMsg = (primaryErr?.response?.data?.error?.message || '').toLowerCase();
    const isModelErr =
      status === 404 ||
      errMsg.includes('model') ||
      errMsg.includes('not found') ||
      errMsg.includes('not available');

    if (isModelErr) {
      console.error('[Sarvam] Primary model failed, trying fallback:', primaryErr.message);
      return await tryModel(FALLBACK_MODEL);
    }

    // Re-throw all other errors (rate limit, auth, network, timeout)
    throw primaryErr;
  }
};

/**
 * Translate a raw axios/network error into a friendly message.
 * Never exposes the API key or stack traces.
 */
const friendlyError = (err) => {
  if (err.code === 'NO_KEY') {
    return 'Heat safety assistant is not configured. Please contact support.';
  }
  if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
    return 'Response timed out. Please try again in a moment.';
  }
  const status = err?.response?.status;
  if (status === 401 || status === 403) {
    return 'Assistant is temporarily unavailable. Please try again later.';
  }
  if (status === 429) {
    return 'AI service is busy right now. Please wait a moment and try again.';
  }
  if (status === 402) {
    return 'Assistant is temporarily unavailable (service limit). Please try again later.';
  }
  if (!status) {
    return 'Network error. Please check your connection and try again.';
  }
  return 'Assistant encountered an issue. Please try again.';
};

module.exports = { callSarvam, friendlyError };
