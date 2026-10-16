/**
 * Emergency symptom detector for heat-related emergencies.
 * Covers English, Hindi (Devanagari + Hinglish), and Gujarati.
 * Returns a fixed localized response WITHOUT calling the AI.
 */

const EMERGENCY_PATTERNS = [
  // English
  /\bdizzy\b/i,
  /\bfaint(ing|ed)?\b/i,
  /\bvomit(ing|ed)?\b/i,
  /\bconfus(ed|ion)\b/i,
  /\bno(t)?\s+sweat(ing)?\b/i,
  /\bstopped?\s+sweat(ing)?\b/i,
  /\bdry\s+skin\b/i,
  /\bhot\s+(and\s+)?dry\s+skin\b/i,
  /\bchest\s+pain\b/i,
  /\bseizure\b/i,
  /\bunconscious\b/i,
  /\bpass(ed|ing)?\s+out\b/i,
  /\bnot\s+breathing\b/i,
  /\bheat\s+stroke\b/i,
  /\bcan('t|not)\s+breathe\b/i,

  // Hindi Devanagari
  /चक्कर/,
  /बेहोश/,
  /उल्टी/,
  /घबराहट/,
  /पसीना\s+नहीं/,
  /पसीना\s+बंद/,
  /सूखी\s+त्वचा/,
  /छाती\s+में\s+दर्द/,
  /दौरा/,
  /बेसुध/,
  /साँस\s+नहीं/,
  /साँस\s+बंद/,
  /लू\s+लगना/,
  /लू\s+लग/,
  /बहुत\s+गरम/,

  // Hinglish (transliterated Hindi)
  /\bchakkar\b/i,
  /\bbehosh\b/i,
  /\bulti\b/i,
  /\bultee\b/i,
  /\bpaseena\s+nahi\b/i,
  /\bpaseena\s+band\b/i,
  /\blath?pak\b/i,
  /\bchati\s+(mein|me)\s+(dard|pain)\b/i,
  /\bseene\s+(mein|me)\s+(dard|pain)\b/i,
  /\bdaura\b/i,
  /\bbesudh\b/i,
  /\blu\s+lag(i|a)?\b/i,
  /\bheat\s+stroke\b/i,

  // Gujarati
  /ચક્કર/,
  /બેભાન/,
  /ઉલ્ટી/,
  /ગભરામણ/,
  /પરસેવો\s+નહીં/,
  /પરસેવો\s+બંધ/,
  /સૂકી\s+ત્વચા/,
  /છાતીમાં\s+દુખાવો/,
  /હુમલો/,
  /અચેત/,
  /શ્વાસ\s+નહીં/,
  /ઊકળાટ/,
  /લૂ\s+લાગ/,
];

const EMERGENCY_REPLIES = {
  en: '🚨 This sounds like a heat emergency. Call 108 immediately. Move to shade or a cool place right away. Use the SOS button in the app.',
  hi: '🚨 यह गर्मी की आपात स्थिति लग रही है। तुरंत 108 पर कॉल करें। अभी छाँव या ठंडी जगह पर जाएँ। ऐप में SOS बटन दबाएँ।',
  gu: '🚨 આ ગરમીની કટોકટી જેવું લાગે છે. તરત 108 પર ફોન કરો. તડકામાંથી છાંયડામાં જાઓ. ઍપમાં SOS બટન દબાવો.',
};

/**
 * Check if the message contains emergency symptoms.
 * @param {string} message - The user's message
 * @param {string} lang - 'en' | 'hi' | 'gu'
 * @returns {{ isEmergency: boolean, reply: string|null }}
 */
const checkEmergency = (message, lang = 'en') => {
  if (!message || typeof message !== 'string') {
    return { isEmergency: false, reply: null };
  }

  const matched = EMERGENCY_PATTERNS.some((pattern) => pattern.test(message));

  if (!matched) {
    return { isEmergency: false, reply: null };
  }

  const validLang = ['en', 'hi', 'gu'].includes(lang) ? lang : 'en';
  return {
    isEmergency: true,
    reply: EMERGENCY_REPLIES[validLang],
  };
};

module.exports = { checkEmergency };
