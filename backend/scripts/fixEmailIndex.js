const mongoose = require('mongoose');
const dotenv = require('dotenv');
const dns = require('dns');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {}

async function run() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('MONGO_URI is missing');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('Connected!');

  const coll = mongoose.connection.collection('users');
  const indexes = await coll.indexes();
  console.log('Current indexes on users collection:');
  console.log(JSON.stringify(indexes, null, 2));

  const countEmpty = await coll.countDocuments({ email: '' });
  console.log(`Users with email === "": ${countEmpty}`);

  const countNull = await coll.countDocuments({ email: null });
  console.log(`Users with email === null: ${countNull}`);

  // 1. Drop existing email_1 index if it exists
  const hasEmailIndex = indexes.some(idx => idx.name === 'email_1');
  if (hasEmailIndex) {
    console.log('Dropping email_1 index...');
    await coll.dropIndex('email_1');
    console.log('Dropped email_1 index successfully.');
  }

  // 2. Unset empty strings and nulls so they are not indexed as values
  if (countEmpty > 0 || countNull > 0) {
    console.log('Cleaning up empty/null email fields in existing users...');
    const updateResult = await coll.updateMany(
      { $or: [{ email: '' }, { email: null }] },
      { $unset: { email: '' } }
    );
    console.log(`Updated ${updateResult.modifiedCount} user documents (unset email).`);
  }

  // 3. Create partial unique index
  console.log('Creating new partial unique index on email...');
  await coll.createIndex(
    { email: 1 },
    {
      unique: true,
      partialFilterExpression: { email: { $type: 'string', $gt: '' } },
      name: 'email_1'
    }
  );
  console.log('New partialFilterExpression unique index created successfully!');

  const updatedIndexes = await coll.indexes();
  console.log('Updated indexes:');
  console.log(JSON.stringify(updatedIndexes, null, 2));

  await mongoose.connection.close();
  console.log('Done!');
}

run().catch((err) => {
  console.error('Error running fixEmailIndex:', err);
  process.exit(1);
});

