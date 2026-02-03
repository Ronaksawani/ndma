const mongoose = require("mongoose");

const TrainingEventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  theme: {
    type: String,
    required: true,
  },
  description: String,
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  location: {
    state: String,
    district: String,
    city: String,
    latitude: Number,
    longitude: Number,
    address: String,
  },
  trainerName: String,
  trainerEmail: String,
  participantsCount: Number,
  participantBreakdown: {
    government: { type: Number, default: 0 },
    ngo: { type: Number, default: 0 },
    volunteers: { type: Number, default: 0 },
  },
  photos: [
    {
      filename: String,
      url: String,
    },
  ],
  attendanceSheet: {
    filename: String,
    url: String,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  rejectionReason: String,
  partnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Partner",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  approvedAt: Date,
  approvedBy: mongoose.Schema.Types.ObjectId,
});

// Index for geo queries
TrainingEventSchema.index({ "location.latitude": 1, "location.longitude": 1 });

module.exports = mongoose.model("TrainingEvent", TrainingEventSchema);
