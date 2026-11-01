/**
 * backend/scripts/seedManager.js
 *
 * Seed script to create or update all official Gujarat Area Manager accounts for Chhaya.
 *
 * Accounts:
 * 1) Vadodara - Makarpura   | Phone: 9876501234 | Password: Manager@123
 * 2) Ahmedabad - Naroda     | Phone: 9876501235 | Password: Manager@123
 * 3) Surat - Varachha       | Phone: 9876501236 | Password: Manager@123
 * 4) Kutch - Bhuj           | Phone: 9876501237 | Password: Manager@123
 *
 * Usage:
 *   From backend folder: node scripts/seedManager.js
 *   From project root:   npm run seed:manager  (in backend package.json)
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

const MANAGERS = [
  {
    name: 'Vadodara Makarpura Manager',
    phone: '9876501234',
    password: 'Manager@123',
    role: 'manager',
    occupation: 'other',
    location: 'Vadodara',
    city: 'Vadodara',
    areaName: 'Makarpura',
    managedCity: 'Vadodara',
    managedArea: 'Makarpura',
    language: 'en',
    emergencyContactName: 'Chhaya Admin',
    emergencyContactPhone: '9000000001'
  },
  {
    name: 'Ahmedabad Naroda Manager',
    phone: '9876501235',
    password: 'Manager@123',
    role: 'manager',
    occupation: 'other',
    location: 'Ahmedabad',
    city: 'Ahmedabad',
    areaName: 'Naroda',
    managedCity: 'Ahmedabad',
    managedArea: 'Naroda',
    language: 'en',
    emergencyContactName: 'Chhaya Admin',
    emergencyContactPhone: '9000000001'
  },
  {
    name: 'Surat Varachha Manager',
    phone: '9876501236',
    password: 'Manager@123',
    role: 'manager',
    occupation: 'other',
    location: 'Surat',
    city: 'Surat',
    areaName: 'Varachha',
    managedCity: 'Surat',
    managedArea: 'Varachha',
    language: 'en',
    emergencyContactName: 'Chhaya Admin',
    emergencyContactPhone: '9000000001'
  },
  {
    name: 'Kutch Bhuj Manager',
    phone: '9876501237',
    password: 'Manager@123',
    role: 'manager',
    occupation: 'other',
    location: 'Kutch',
    city: 'Kutch',
    areaName: 'Bhuj',
    managedCity: 'Kutch',
    managedArea: 'Bhuj',
    language: 'en',
    emergencyContactName: 'Chhaya Admin',
    emergencyContactPhone: '9000000001'
  }
];

const upsertManager = async (config) => {
  const existingUser = await User.findOne({ phone: config.phone });

  if (existingUser) {
    console.log(`ℹ️  Found existing user with phone ${config.phone}.`);
    let needsSave = false;

    const fields = ['role', 'name', 'occupation', 'location', 'city', 'areaName', 'managedCity', 'managedArea', 'language', 'emergencyContactName', 'emergencyContactPhone'];
    for (const field of fields) {
      if (existingUser[field] !== config[field]) {
        console.log(`   Updating ${field}: "${existingUser[field]}" -> "${config[field]}"`);
        existingUser[field] = config[field];
        needsSave = true;
      }
    }

    // Ensure password matches Manager@123
    const isPasswordMatch = await bcrypt.compare(config.password, existingUser.password);
    if (!isPasswordMatch) {
      console.log(`   Updating password...`);
      existingUser.password = await bcrypt.hash(config.password, 10);
      needsSave = true;
    }

    if (needsSave) {
      await existingUser.save();
      console.log(`✅ Updated: ${config.name} (${config.managedCity} - ${config.managedArea})`);
    } else {
      console.log(`✅ Already up-to-date: ${config.name}`);
    }
  } else {
    console.log(`   Creating: ${config.name} (Phone: ${config.phone})...`);
    const hashedPassword = await bcrypt.hash(config.password, 10);

    await User.create({
      name: config.name,
      phone: config.phone,
      password: hashedPassword,
      role: config.role,
      occupation: config.occupation,
      location: config.location,
      city: config.city,
      areaName: config.areaName,
      managedCity: config.managedCity,
      managedArea: config.managedArea,
      language: config.language,
      emergencyContactName: config.emergencyContactName,
      emergencyContactPhone: config.emergencyContactPhone
    });

    console.log(`✅ Created: ${config.name} (${config.managedCity} - ${config.managedArea})`);
  }
};

const seedManagers = async () => {
  console.log('\n================================================');
  console.log('   Chhaya — Gujarat Area Manager Account Seeder');
  console.log('================================================\n');

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('❌ Error: MONGO_URI is not defined in backend/.env');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log(`✅ MongoDB Connected: ${mongoose.connection.host}\n`);

    for (const config of MANAGERS) {
      await upsertManager(config);
    }

    console.log('\n🎉 All manager accounts seeded successfully!\n');
    console.log('── Manager Credentials ──────────────────────────────');
    MANAGERS.forEach((m) => {
      console.log(`  ${m.managedCity} - ${m.managedArea}`);
      console.log(`    Phone: ${m.phone} | Password: ${m.password}`);
    });
    console.log('─────────────────────────────────────────────────────\n');

    await mongoose.connection.close();
    console.log('Database connection closed cleanly.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding manager accounts:', error.message);
    try { await mongoose.connection.close(); } catch (_) {}
    process.exit(1);
  }
};

seedManagers();
