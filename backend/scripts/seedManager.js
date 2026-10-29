/**
 * backend/scripts/seedManager.js
 *
 * Seed script to create or update the official fixed Manager account for Chhaya.
 *
 * Credentials:
 * - Phone: 9876501234
 * - Password: Manager@123
 * - Role: manager
 * - Name: Chhaya Manager
 * - Occupation: other
 * - Location: Ahmedabad
 * - Language: en
 *
 * Usage:
 *   From backend folder: node scripts/seedManager.js
 *   From project root:   npm run seed:manager
 */

const path = require('path');
const dns = require('dns');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Load environment variables from backend/.env regardless of current working directory
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config(); // Fallback to current working directory

// Configure DNS resolution for MongoDB Atlas SRV URIs on Windows / ISP environments
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (err) {
  // Silently fall back if setServers is not supported in the runtime
}

const User = require('../models/User');

const MANAGER_CONFIG = {
  name: 'Chhaya Manager',
  phone: '9876501234',
  password: 'Manager@123',
  role: 'manager',
  occupation: 'other',
  location: 'Ahmedabad',
  language: 'en'
};

const seedManager = async () => {
  console.log('\n=============================================');
  console.log('   Chhaya — Official Manager Account Seeder');
  console.log('=============================================\n');

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('❌ Error: MONGO_URI is not defined in backend/.env');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log(`✅ MongoDB Connected Successfully: ${mongoose.connection.host}\n`);

    const existingUser = await User.findOne({ phone: MANAGER_CONFIG.phone });

    if (existingUser) {
      console.log(`ℹ️  User with phone ${MANAGER_CONFIG.phone} already exists.`);

      let needsSave = false;

      if (existingUser.role !== MANAGER_CONFIG.role) {
        console.log(`   Updating role: "${existingUser.role}" -> "${MANAGER_CONFIG.role}"`);
        existingUser.role = MANAGER_CONFIG.role;
        needsSave = true;
      }

      // Ensure password matches Manager@123
      const isPasswordMatch = await bcrypt.compare(MANAGER_CONFIG.password, existingUser.password);
      if (!isPasswordMatch) {
        console.log('   Updating password to hash of "Manager@123"...');
        existingUser.password = await bcrypt.hash(MANAGER_CONFIG.password, 10);
        needsSave = true;
      }

      if (existingUser.name !== MANAGER_CONFIG.name) {
        existingUser.name = MANAGER_CONFIG.name;
        needsSave = true;
      }
      if (existingUser.occupation !== MANAGER_CONFIG.occupation) {
        existingUser.occupation = MANAGER_CONFIG.occupation;
        needsSave = true;
      }
      if (existingUser.location !== MANAGER_CONFIG.location) {
        existingUser.location = MANAGER_CONFIG.location;
        needsSave = true;
      }
      if (existingUser.language !== MANAGER_CONFIG.language) {
        existingUser.language = MANAGER_CONFIG.language;
        needsSave = true;
      }

      if (needsSave) {
        await existingUser.save();
        console.log('✅ Existing user successfully updated to official manager specs.');
      } else {
        console.log('✅ Existing user already matches official manager specs.');
      }

      console.log(`\n🎉 Manager Account Ready: Phone: ${existingUser.phone} | Role: ${existingUser.role}\n`);
    } else {
      console.log(`Creating new manager account with phone ${MANAGER_CONFIG.phone}...`);
      const hashedPassword = await bcrypt.hash(MANAGER_CONFIG.password, 10);

      const newManager = await User.create({
        name: MANAGER_CONFIG.name,
        phone: MANAGER_CONFIG.phone,
        password: hashedPassword,
        role: MANAGER_CONFIG.role,
        occupation: MANAGER_CONFIG.occupation,
        location: MANAGER_CONFIG.location,
        language: MANAGER_CONFIG.language
      });

      console.log('✅ New manager account successfully created.');
      console.log(`\n🎉 Manager Account Ready: Phone: ${newManager.phone} | Role: ${newManager.role}\n`);
    }

    await mongoose.connection.close();
    console.log('Database connection closed cleanly.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding manager account:', error.message);
    try {
      await mongoose.connection.close();
    } catch (_) {}
    process.exit(1);
  }
};

seedManager();
