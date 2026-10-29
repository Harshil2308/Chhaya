/**
 * backend/scripts/seedAdmin.js
 *
 * Seed script to create or update the official fixed Admin account for Chhaya.
 *
 * Credentials:
 * - Phone: 9876504321
 * - Password: Admin@123
 * - Role: admin
 * - Name: Chhaya Admin
 * - Occupation: other
 * - Location: Ahmedabad
 * - Language: en
 *
 * Usage:
 *   From backend folder: node scripts/seedAdmin.js
 *   From project root:   npm run seed:admin
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

const ADMIN_CONFIG = {
  name: 'Chhaya Admin',
  phone: '9876504321',
  password: 'Admin@123',
  role: 'admin',
  occupation: 'other',
  location: 'Ahmedabad',
  language: 'en'
};

const seedAdmin = async () => {
  console.log('\n=============================================');
  console.log('    Chhaya — Official Admin Account Seeder');
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

    const existingUser = await User.findOne({ phone: ADMIN_CONFIG.phone });

    if (existingUser) {
      console.log(`ℹ️  User with phone ${ADMIN_CONFIG.phone} already exists.`);

      let needsSave = false;

      if (existingUser.role !== ADMIN_CONFIG.role) {
        console.log(`   Updating role: "${existingUser.role}" -> "${ADMIN_CONFIG.role}"`);
        existingUser.role = ADMIN_CONFIG.role;
        needsSave = true;
      }

      // Ensure password matches Admin@123
      const isPasswordMatch = await bcrypt.compare(ADMIN_CONFIG.password, existingUser.password);
      if (!isPasswordMatch) {
        console.log('   Updating password to hash of "Admin@123"...');
        existingUser.password = await bcrypt.hash(ADMIN_CONFIG.password, 10);
        needsSave = true;
      }

      if (existingUser.name !== ADMIN_CONFIG.name) {
        existingUser.name = ADMIN_CONFIG.name;
        needsSave = true;
      }
      if (existingUser.occupation !== ADMIN_CONFIG.occupation) {
        existingUser.occupation = ADMIN_CONFIG.occupation;
        needsSave = true;
      }
      if (existingUser.location !== ADMIN_CONFIG.location) {
        existingUser.location = ADMIN_CONFIG.location;
        needsSave = true;
      }
      if (existingUser.language !== ADMIN_CONFIG.language) {
        existingUser.language = ADMIN_CONFIG.language;
        needsSave = true;
      }

      if (needsSave) {
        await existingUser.save();
        console.log('✅ Existing user successfully updated to official admin specs.');
      } else {
        console.log('✅ Existing user already matches official admin specs.');
      }

      console.log(`\n🎉 Admin Account Ready: Phone: ${existingUser.phone} | Role: ${existingUser.role}\n`);
    } else {
      console.log(`Creating new admin account with phone ${ADMIN_CONFIG.phone}...`);
      const hashedPassword = await bcrypt.hash(ADMIN_CONFIG.password, 10);

      const newAdmin = await User.create({
        name: ADMIN_CONFIG.name,
        phone: ADMIN_CONFIG.phone,
        password: hashedPassword,
        role: ADMIN_CONFIG.role,
        occupation: ADMIN_CONFIG.occupation,
        location: ADMIN_CONFIG.location,
        language: ADMIN_CONFIG.language
      });

      console.log('✅ New admin account successfully created.');
      console.log(`\n🎉 Admin Account Ready: Phone: ${newAdmin.phone} | Role: ${newAdmin.role}\n`);
    }

    await mongoose.connection.close();
    console.log('Database connection closed cleanly.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin account:', error.message);
    try {
      await mongoose.connection.close();
    } catch (_) {}
    process.exit(1);
  }
};

seedAdmin();
