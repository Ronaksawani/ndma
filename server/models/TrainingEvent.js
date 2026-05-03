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
  trainerContactNo: String,
  participantsCount: {
    type: Number,
    default: 0,
  },
  participantsCount: Number,
  registeredParticipants: [
    {
      participantId: mongoose.Schema.Types.ObjectId,
      email: String,
      name: String,
      registeredAt: Date,
      status: {
        type: String,
        enum: ["registered", "attended", "cancelled"],
        default: "registered",
      },
    },
  ],
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
    enum: ["upcoming", "pending", "approved", "rejected", "ongoing", "completed", "cancelled"],
    default: "pending",
  },
  statusChangeReason: String,
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
TrainingEventSchema.index({ startDate: 1 });
TrainingEventSchema.index({ "location.state": 1, "location.district": 1 });

module.exports = mongoose.model("TrainingEvent", TrainingEventSchema);
