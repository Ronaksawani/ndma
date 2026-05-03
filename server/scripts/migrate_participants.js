/*
Migration script: consolidate per-registration participant documents into single Participant documents with trainings[]
Usage:
  node scripts/migrate_participants.js

This script will:
 - Read all documents from the existing `participants` collection
 - Group them by `aadhaarNumber` if present, otherwise by `email`
 - Create/replace a single consolidated document per group with `trainings` array
 - WARNING: Back up your DB before running this script.
*/

const mongoose = require('mongoose');
const path = require('path');

async function run() {
  const MONGO_URI = process.env.MONGO_URI || process.env.MONGO_URL || 'mongodb://localhost:27017/DTM';
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to', MONGO_URI);

  const db = mongoose.connection.db;
  const raw = db.collection('participants');
  const docs = await raw.find({}).toArray();
  console.log('Found', docs.length, 'participant documents (old format)');

  const groups = new Map();
  for (const d of docs) {
    const key = d.aadhaarNumber || (d.email && d.email.toLowerCase()) || d._id.toString();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(d);
  }

  console.log('Grouping produced', groups.size, 'unique participants');

  // Build consolidated documents array
  const consolidatedArray = [];
  for (const [key, items] of groups) {
    const first = items[0];
    const trainings = items.map((it) => ({
      trainingId: it.trainingId || undefined,
      trainingTitle: it.trainingTitle || undefined,
      trainingTheme: it.trainingTheme || undefined,
      trainingDates: it.trainingDates || undefined,
      organization: it.organization || undefined,
      status: it.status || (it.certificateIssued ? 'completed' : 'registered'),
      certificateIssued: !!it.certificateIssued,
      certificateIssuedAt: it.certificateIssuedAt || undefined,
      certificateUrl: it.certificateUrl || undefined,
      createdAt: it.createdAt || it._id.getTimestamp(),
    }));

    consolidatedArray.push({
      fullName: first.fullName || '',
      aadhaarNumber: first.aadhaarNumber || undefined,
      email: first.email ? first.email.toLowerCase() : undefined,
      phone: first.phone || undefined,
      organization: first.organization || undefined,
      trainings,
      createdAt: first.createdAt || new Date(),
    });
  }

  console.log('Prepared', consolidatedArray.length, 'consolidated participant documents');

  // Safety: require explicit confirmation via env flag to perform destructive replace
  if (!process.env.CONFIRM_MIGRATE) {
    console.log('DRY RUN: Set environment variable CONFIRM_MIGRATE=1 to execute replace of participants collection.');
    process.exit(0);
  }

  // Replace entire participants collection with consolidated documents
  console.log('Replacing participants collection with consolidated documents...');
  await raw.deleteMany({});
  if (consolidatedArray.length > 0) {
    await raw.insertMany(consolidatedArray);
  }

  console.log('Migration complete. Participants collection replaced with consolidated documents.');
  process.exit(0);
}

run().catch((err) => {
  console.error('Migration error', err);
  process.exit(1);
});
