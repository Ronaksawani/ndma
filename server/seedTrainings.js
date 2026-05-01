require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const TrainingEvent = require("./models/TrainingEvent");
const Partner = require("./models/Partner");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/DTM";

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
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        converted[key] = convertMongoDBJSON(obj[key]);
      }
    }
    return converted;
  }

  return obj;
}

function readJSONFile(filePath) {
  try {
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return null;
  }
}

async function seedTrainings() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✓ MongoDB connected successfully\n");

    const dataFolder = path.join(__dirname, "../DATA");
    const trainingEventsFile = path.join(dataFolder, "DTM.trainingevents.json");
    let trainingEventsData = readJSONFile(trainingEventsFile);

    if (!trainingEventsData || trainingEventsData.length === 0) {
      console.log("No training events found in JSON file. Nothing to seed.");
      return;
    }

    trainingEventsData = trainingEventsData.map((event) =>
      convertMongoDBJSON(event),
    );
    trainingEventsData = trainingEventsData.map(({ __v, ...rest }) => rest);

    const partners = await Partner.find().sort({ createdAt: 1 }).select("_id");
    if (!partners.length) {
      throw new Error(
        "No partners found in the database. Seed partners before seeding trainings.",
      );
    }

    trainingEventsData = trainingEventsData.map((event, index) => ({
      ...event,
      partnerId: partners[index % partners.length]._id,
    }));

    console.log("   ✓ Partner IDs mapped to training events");

    const deletedEvents = await TrainingEvent.deleteMany({});
    console.log(
      `   Deleted ${deletedEvents.deletedCount} existing training events`,
    );

    const insertedEvents = await TrainingEvent.insertMany(trainingEventsData, {
      ordered: false,
    });

    console.log(
      `✓ ${insertedEvents.length} training events uploaded successfully`,
    );
  } catch (error) {
    console.error("Error seeding trainings:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close().catch(() => {});
    console.log("✓ Database connection closed");
  }
}

if (require.main === module) {
  seedTrainings();
}

module.exports = seedTrainings;
