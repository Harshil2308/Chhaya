/**
 * backend/scripts/testSarvam.js
 *
 * Quick smoke-test for the Sarvam AI integration.
 * Run from the backend directory:
 *   node scripts/testSarvam.js
 *
 * Requires SARVAM_API_KEY to be set in backend/.env
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { callSarvam, friendlyError } = require('../utils/sarvamClient');

const SYSTEM_PROMPT =
  "You are Chhaya's heat-safety helper for Indian outdoor workers. " +
  'Reply in the user\'s language, in very simple words, maximum 3 short sentences. ' +
  'Give only general heat-safety tips: shade, water, ORS, rest breaks, cooler working hours, ' +
  'light clothing, covering the head.';

const run = async () => {
  console.log('\n═══════════════════════════════════════════');
  console.log('  Chhaya — Sarvam AI Integration Test');
  console.log('═══════════════════════════════════════════\n');

  if (!process.env.SARVAM_API_KEY) {
    console.error('❌  SARVAM_API_KEY is not set in backend/.env');
    process.exit(1);
  }

  console.log('✅  SARVAM_API_KEY found\n');

  const testQuestion = 'I am a construction worker in Ahmedabad. How do I stay safe in today\'s heat?';

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `Worker context:\nWorker occupation: construction\nWorker city: Ahmedabad\nPersonal risk level: High\nPersonal heat index: 42°C\nReply language: en\n\nWorker question: ${testQuestion}`,
    },
  ];

  console.log('📤  Sending test question to Sarvam AI...');
  console.log(`    Question: "${testQuestion}"\n`);

  try {
    const reply = await callSarvam(messages, { temperature: 0.3, max_tokens: 150 });
    console.log('✅  SUCCESS! Model reply:');
    console.log('─────────────────────────────────────────');
    console.log(reply);
    console.log('─────────────────────────────────────────\n');
  } catch (err) {
    const safe = friendlyError(err);
    console.error('❌  FAILED! Raw error:', err?.response?.status || err.code || err.message);
    console.error('    Friendly message:', safe);
    process.exit(1);
  }

  console.log('✅  Test complete. Integration is working.\n');
};

run();
