import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Automatically add token to every request
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// ── Assistant (Heat Helper) ──────────────────────────────────────────────────

/**
 * Send a message to the heat-safety assistant.
 * @param {string} message
 * @param {string} language - 'en' | 'hi' | 'gu'
 * @returns {Promise<{ reply: string, emergency: boolean, disclaimer: string }>}
 */
export const askAssistant = (message, language) =>
  API.post('/assistant', { message, language }).then((r) => r.data);

/**
 * Check if the assistant feature is enabled on the server.
 * @returns {Promise<{ enabled: boolean }>}
 */
export const getAssistantStatus = () =>
  API.get('/assistant/status').then((r) => r.data);

export default API;