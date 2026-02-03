const mongoose = require("mongoose");
require("dotenv").config();

const User = require("./models/User");
const Partner = require("./models/Partner");
const TrainingEvent = require("./models/TrainingEvent");

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/disaster_training"
    );
    console.log("Connected to MongoDB");

    // Clear existing data (optional - comment out if you want to preserve existing data)
    // await User.deleteMany({});
    // await Partner.deleteMany({});
    // await TrainingEvent.deleteMany({});

    // Create a test partner user
    const partnerUser = new User({
      email: "partner@example.com",
      password: "password123", // Note: In production, use bcrypt
      role: "partner",
      organizationId: null,
    });
    await partnerUser.save();
    console.log("✓ Partner user created: partner@example.com");

    // Create a partner organization
    const partner = new Partner({
      userId: partnerUser._id,
      organizationName: "Disaster Relief Organization",
      type: "NGO",
      contactPerson: "John Doe",
      phone: "9876543210",
      email: "partner@example.com",
      location: {
        address: "123 Main Street",
        state: "Maharashtra",
        district: "Mumbai",
        city: "Mumbai",
      },
      status: "approved",
    });
    await partner.save();
    console.log("✓ Partner organization created");

    // Create 3 dummy training events
    const dummyTrainings = [
      {
        title: "Flood Rescue & Response Training",
        theme: "flood",
        startDate: new Date("2024-12-20"),
        endDate: new Date("2024-12-22"),
        location: {
          state: "Maharashtra",
          district: "Mumbai",
          city: "Mumbai",
          pincode: "400001",
          latitude: 19.076,
          longitude: 72.8479,
        },
        trainerName: "Dr. Rajesh Kumar",
        trainerEmail: "rajesh.kumar@example.com",
        participantsCount: 45,
        partnerId: partner._id,
        status: "approved",
        approvedAt: new Date(),
      },
      {
        title: "Earthquake Preparedness Workshop",
        theme: "earthquake",
        startDate: new Date("2024-12-25"),
        endDate: new Date("2024-12-26"),
        location: {
          state: "Gujarat",
          district: "Ahmedabad",
          city: "Ahmedabad",
          pincode: "380001",
          latitude: 23.0225,
          longitude: 72.5714,
        },
        trainerName: "Prof. Anjali Singh",
        trainerEmail: "anjali.singh@example.com",
        participantsCount: 60,
        partnerId: partner._id,
        status: "pending",
      },
      {
        title: "First Aid & Emergency Medical Response",
        theme: "first-aid",
        startDate: new Date("2024-12-28"),
        endDate: new Date("2024-12-29"),
        location: {
          state: "Karnataka",
          district: "Bangalore",
          city: "Bangalore",
          pincode: "560001",
          latitude: 12.9716,
          longitude: 77.5946,
        },
        trainerName: "Dr. Priya Sharma",
        trainerEmail: "priya.sharma@example.com",
        participantsCount: 35,
        partnerId: partner._id,
        status: "approved",
        approvedAt: new Date(),
      },
    ];

    await TrainingEvent.insertMany(dummyTrainings);
    console.log("✓ 3 dummy training events created");

    console.log("\n✅ Database seeding completed successfully!");
    console.log("\nTest Credentials:");
    console.log("Email: partner@example.com");
    console.log("Password: password123");
    console.log("Role: Partner");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

seedDatabase();
