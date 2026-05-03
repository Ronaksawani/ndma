const mongoose = require("mongoose");

const TrainingsSubSchema = new mongoose.Schema({
  trainingId: { type: mongoose.Schema.Types.ObjectId, ref: "TrainingEvent" },
  trainingTitle: String,
  trainingTheme: String,
  trainingDates: {
    start: String,
    end: String,
  },
  organization: String,
  status: {
    type: String,
    enum: ["registered", "completed", "cancelled"],
    default: "registered",
  },
  certificateIssued: {
    type: Boolean,
    default: false,
  },
  certificateIssuedAt: Date,
  certificateUrl: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const ParticipantSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },
  aadhaarNumber: {
    type: String,
    unique: true,
    sparse: true,
  },
  email: { type: String, lowercase: true },
  phone: String,
  dateOfBirth: Date,
  gender: {
    type: String,
    enum: ["Male", "Female", "Other", "Prefer not to say"],
  },
  state: String,
  nearbyDistricts: [String],
  organization: String,
  trainings: [TrainingsSubSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Participant", ParticipantSchema);
