require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const bcryptjs = require("bcryptjs");

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

// Function to hash passwords
async function hashPasswords(usersData) {
  return Promise.all(
    usersData.map(async (user) => {
      return {
        ...user,
        password: await bcryptjs.hash(user.password, 10),
      };
    }),
  );
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
    const idMap = {}; // Store mapping of indices to actual MongoDB IDs

    // 1. Seed Users
    console.log("📥 Uploading Users collection...");
    const usersFile = path.join(dataFolder, "DTM.users.json");
    let usersData = readJSONFile(usersFile);

    if (usersData) {
      usersData = usersData.map((user) => convertMongoDBJSON(user));

      // Remove __v field if present
      usersData = usersData.map(({ __v, ...rest }) => rest);

      // Hash passwords before insertion (since insertMany bypasses pre-save hooks)
      console.log("   🔐 Hashing passwords...");
      usersData = await hashPasswords(usersData);

      const deletedUsers = await User.deleteMany({});
      console.log(`   Deleted ${deletedUsers.deletedCount} existing users`);

      const insertedUsers = await User.insertMany(usersData, {
        ordered: false,
      });
      idMap.users = insertedUsers.map((user) => user._id);
      console.log(`✓ ${insertedUsers.length} users uploaded successfully\n`);
    }

    // 2. Seed Partners with User ID Mapping
    console.log("📥 Uploading Partners collection...");
    const partnersFile = path.join(dataFolder, "DTM.partners.json");
    let partnersData = readJSONFile(partnersFile);

    if (partnersData) {
      partnersData = partnersData.map((partner) => convertMongoDBJSON(partner));

      // Remove __v field if present
      partnersData = partnersData.map(({ __v, ...rest }) => rest);

      // Map user IDs to partners: link partners to their corresponding users
      if (idMap.users && idMap.users.length > 1) {
        // Skip the admin user (index 0) and map to partner users (indices 1-4)
        partnersData = partnersData.map((partner, index) => {
          const userIndex = (index + 1) % idMap.users.length;
          return {
            ...partner,
            userId: idMap.users[userIndex],
          };
        });
        console.log("   ✓ User IDs mapped to partners");
      }

      const deletedPartners = await Partner.deleteMany({});
      console.log(
        `   Deleted ${deletedPartners.deletedCount} existing partners`,
      );

      const insertedPartners = await Partner.insertMany(partnersData, {
        ordered: false,
      });
      idMap.partners = insertedPartners.map((partner) => partner._id);
      console.log(
        `✓ ${insertedPartners.length} partners uploaded successfully\n`,
      );

      // Update User documents with organizationId
      if (idMap.users && idMap.users.length > 1 && idMap.partners) {
        console.log("   🔗 Linking users to partners (organizationId)...");
        // Skip admin (index 0) and link partner users to their partners
        for (let i = 0; i < idMap.partners.length; i++) {
          const userIndex = (i + 1) % idMap.users.length;
          await User.findByIdAndUpdate(idMap.users[userIndex], {
            organizationId: idMap.partners[i],
          });
        }
        console.log("   ✓ Users linked to partners via organizationId\n");
      }
    }

    // 3. Seed Training Events with Partner ID Mapping
    console.log("📥 Uploading Training Events collection...");
    const trainingEventsFile = path.join(dataFolder, "DTM.trainingevents.json");
    let trainingEventsData = readJSONFile(trainingEventsFile);

    if (trainingEventsData) {
      trainingEventsData = trainingEventsData.map((event) =>
        convertMongoDBJSON(event),
      );

      // Remove __v field if present
      trainingEventsData = trainingEventsData.map(({ __v, ...rest }) => rest);

      // Map partner IDs: use actual partner IDs from idMap
      if (idMap.partners && idMap.partners.length > 0) {
        trainingEventsData = trainingEventsData.map((event, index) => {
          const partnerIndex = index % idMap.partners.length;
          return {
            ...event,
            partnerId: idMap.partners[partnerIndex],
          };
        });
        console.log("   ✓ Partner IDs mapped to training events");
      }

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
      idMap.trainingEvents = insertedEvents.map((event) => event._id);
      console.log(
        `✓ ${insertedEvents.length} training events uploaded successfully\n`,
      );
    }

    // 4. Seed Participants with Training Event ID Mapping
    console.log("📥 Uploading Participants collection...");
    const participantsFile = path.join(dataFolder, "DTM.participants.json");
    let participantsData = readJSONFile(participantsFile);

    if (participantsData) {
      participantsData = participantsData.map((participant) =>
        convertMongoDBJSON(participant),
      );

      // Remove __v field if present
      participantsData = participantsData.map(({ __v, ...rest }) => rest);

      // Map training event IDs: use actual training event IDs from idMap
      if (idMap.trainingEvents && idMap.trainingEvents.length > 0) {
        participantsData = participantsData.map((participant, index) => {
          // Map participants to training events based on their data
          let trainingIndex = 0;
          if (
            participant.trainingTitle === "First Aid & Emergency Response" ||
            participant.trainingTheme === "Medical Emergency Handling"
          ) {
            trainingIndex = 1;
          } else if (
            participant.trainingTitle === "Flood Management & Prevention" ||
            participant.trainingTheme === "Water Disaster Mitigation"
          ) {
            trainingIndex = 2;
          } else if (
            participant.trainingTitle === "Earthquake Safety & Preparedness" ||
            participant.trainingTheme === "Seismic Hazard Mitigation"
          ) {
            trainingIndex = 3;
          }

          // Ensure we don't exceed available training events
          trainingIndex = trainingIndex % idMap.trainingEvents.length;

          return {
            ...participant,
            trainingId: idMap.trainingEvents[trainingIndex],
          };
        });
        console.log("   ✓ Training Event IDs mapped to participants");
      }

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

    // Display ID Mapping Summary
    console.log("\n📋 ID Mapping Summary:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    console.log("\n👥 User IDs:");
    if (idMap.users && idMap.users.length > 0) {
      const users = await User.find().select("_id email role");
      users.forEach((user, index) => {
        console.log(`   [${index}] ${user.email} (${user.role})`);
      });
    }

    console.log("\n🤝 Partner-User Linkage:");
    if (idMap.partners && idMap.partners.length > 0) {
      const partners = await Partner.find().select(
        "_id organizationName userId email",
      );
      partners.forEach((partner) => {
        console.log(
          `   ${partner.organizationName} → User: ${partner.userId} (${partner.email})`,
        );
      });
    }

    console.log("\n📚 Training Event IDs and their Partner Mappings:");
    if (idMap.trainingEvents && idMap.trainingEvents.length > 0) {
      const trainingEvents = await TrainingEvent.find().select(
        "_id title partnerId",
      );
      trainingEvents.forEach((event) => {
        console.log(
          `   [${event._id}] ${event.title} → Partner: ${event.partnerId}`,
        );
      });
    }

    console.log("\n👤 Participant-Training Event Mappings:");
    const participants = await Participant.find().select(
      "_id fullName trainingId trainingTitle",
    );
    participants.forEach((participant) => {
      console.log(
        `   ${participant.fullName} (${participant.trainingTitle}) → Training: ${participant.trainingId}`,
      );
    });

    console.log("\n✓ All ID mappings are correctly established!\n");

    await mongoose.connection.close();
    console.log("✓ Database connection closed");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the seed function
seedDatabase();
