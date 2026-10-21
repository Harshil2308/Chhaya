const mongoose = require('mongoose');
const dotenv = require('dotenv');
const dns = require('dns');

dotenv.config();

// Fix for Node.js querySrv ECONNREFUSED on Windows / local ISP DNS with MongoDB Atlas SRV URIs
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (err) {
  // Silently fall back if setServers is not supported in the environment
}

const RETRY_DELAY_MS = 10000; // retry every 10 seconds

const connectDB = async () => {
  const attempt = async () => {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI);
      console.log(`MongoDB Connected Successfully: ${conn.connection.host}`);
    } catch (error) {
      console.error('[DB] MongoDB connection failed:', error.message);
      console.error(`[DB] Retrying in ${RETRY_DELAY_MS / 1000}s... (check Atlas IP whitelist)`);
      // DO NOT process.exit — keep the server alive so non-DB routes still work
      setTimeout(attempt, RETRY_DELAY_MS);
    }
  };

  // Handle unexpected disconnections after initial connect
  mongoose.connection.on('disconnected', () => {
    console.warn('[DB] MongoDB disconnected. Attempting reconnect...');
    setTimeout(attempt, RETRY_DELAY_MS);
  });

  await attempt();
};

module.exports = connectDB;