require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

// Import models
const User = require("./models/User");
const Partner = require("./models/Partner");
const TrainingEvent = require("./models/TrainingEvent");
const Participant = require("./models/Participant");

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/DTM";

// Function to convert MongoDB Extended JSON format to native JavaScript
function convertMongoDBJSON(obj) {
  if (obj === null || obj === undefined) return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => convertMongoDBJSON(item));
  }

  if (obj.$oid) {
    return new mongoose.Types.ObjectId(obj.$oid);
  }

  if (obj.$date) {
    return new Date(obj.$date);
  }

  if (typeof obj === "object") {
    const converted = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        converted[key] = convertMongoDBJSON(obj[key]);
      }
    }
    return converted;
  }

  return obj;
}

// Function to read and parse JSON files
function readJSONFile(filePath) {
  try {
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return null;
  }
}

// Function to seed collections
async function seedDatabase() {
  try {
    // Connect to MongoDB
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✓ MongoDB connected successfully\n");

    const dataFolder = path.join(__dirname, "../DATA");

    // 1. Seed Users
    console.log("📥 Uploading Users collection...");
    const usersFile = path.join(dataFolder, "DTM.users.json");
    let usersData = readJSONFile(usersFile);

    if (usersData) {
      usersData = usersData.map((user) => convertMongoDBJSON(user));

      // Remove __v field if present
      usersData = usersData.map(({ __v, ...rest }) => rest);

      const deletedUsers = await User.deleteMany({});
      console.log(`   Deleted ${deletedUsers.deletedCount} existing users`);

      const insertedUsers = await User.insertMany(usersData, {
        ordered: false,
      });
      console.log(`✓ ${insertedUsers.length} users uploaded successfully\n`);
    }

    // 2. Seed Partners
    console.log("📥 Uploading Partners collection...");
    const partnersFile = path.join(dataFolder, "DTM.partners.json");
    let partnersData = readJSONFile(partnersFile);

    if (partnersData) {
      partnersData = partnersData.map((partner) => convertMongoDBJSON(partner));

      // Remove __v field if present
      partnersData = partnersData.map(({ __v, ...rest }) => rest);

      const deletedPartners = await Partner.deleteMany({});
      console.log(
        `   Deleted ${deletedPartners.deletedCount} existing partners`,
      );

      const insertedPartners = await Partner.insertMany(partnersData, {
        ordered: false,
      });
      console.log(
        `✓ ${insertedPartners.length} partners uploaded successfully\n`,
      );
    }

    // 3. Seed Training Events
    console.log("📥 Uploading Training Events collection...");
    const trainingEventsFile = path.join(dataFolder, "DTM.trainingevents.json");
    let trainingEventsData = readJSONFile(trainingEventsFile);

    if (trainingEventsData) {
      trainingEventsData = trainingEventsData.map((event) =>
        convertMongoDBJSON(event),
      );

      // Remove __v field if present
      trainingEventsData = trainingEventsData.map(({ __v, ...rest }) => rest);

      const deletedEvents = await TrainingEvent.deleteMany({});
      console.log(
        `   Deleted ${deletedEvents.deletedCount} existing training events`,
      );

      const insertedEvents = await TrainingEvent.insertMany(
        trainingEventsData,
        {
          ordered: false,
        },
      );
      console.log(
        `✓ ${insertedEvents.length} training events uploaded successfully\n`,
      );
    }

    // 4. Seed Participants
    console.log("📥 Uploading Participants collection...");
    const participantsFile = path.join(dataFolder, "DTM.participants.json");
    let participantsData = readJSONFile(participantsFile);

    if (participantsData) {
      participantsData = participantsData.map((participant) =>
        convertMongoDBJSON(participant),
      );

      // Remove __v field if present
      participantsData = participantsData.map(({ __v, ...rest }) => rest);

      const deletedParticipants = await Participant.deleteMany({});
      console.log(
        `   Deleted ${deletedParticipants.deletedCount} existing participants`,
      );

      const insertedParticipants = await Participant.insertMany(
        participantsData,
        {
          ordered: false,
        },
      );
      console.log(
        `✓ ${insertedParticipants.length} participants uploaded successfully\n`,
      );
    }

    // Summary
    console.log("========================================");
    console.log("✓ Database seeding completed successfully!");
    console.log("========================================");

    const userCount = await User.countDocuments();
    const partnerCount = await Partner.countDocuments();
    const trainingCount = await TrainingEvent.countDocuments();
    const participantCount = await Participant.countDocuments();

    console.log(`\nDatabase Summary:`);
    console.log(`  Users: ${userCount}`);
    console.log(`  Partners: ${partnerCount}`);
    console.log(`  Training Events: ${trainingCount}`);
    console.log(`  Participants: ${participantCount}`);

    await mongoose.connection.close();
    console.log("\n✓ Database connection closed");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the seed function
seedDatabase();
