const mongoose = require("mongoose");

const ParticipantSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },
  aadhaarNumber: String,
  email: String,
  phone: String,
  trainingId: mongoose.Schema.Types.ObjectId,
  trainingTitle: String,
  trainingTheme: String,
  trainingDates: {
    start: String,
    end: String,
  },
  organization: String,
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

module.exports = mongoose.model("Participant", ParticipantSchema);
