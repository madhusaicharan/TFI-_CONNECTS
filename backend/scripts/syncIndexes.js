'use strict';

const mongoose = require('mongoose');
const Movie = require('../models/Movie');
require('dotenv').config();

async function syncIndexes() {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('[syncIndexes] MONGO_URI not defined');
      process.exit(1);
    }

    console.log('[syncIndexes] Connecting to MongoDB...');
    await mongoose.connect(mongoUri);

    console.log('[syncIndexes] Syncing indexes on Movie collection...');
    await Movie.syncIndexes();
    console.log('[syncIndexes] ✅ Movie collection text index synced successfully.');

  } catch (err) {
    console.error('[syncIndexes] ❌ Index sync failed:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

if (require.main === module) {
  syncIndexes();
}

module.exports = syncIndexes;
