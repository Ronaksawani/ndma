const mongoose = require("mongoose");

const CertificateSchema = new mongoose.Schema({
  certificateId: {
    type: String,
    unique: true,
    required: true,
  },
  traineeName: String,
  trainingId: mongoose.Schema.Types.ObjectId,
  trainingTitle: String,
  issueDate: Date,
  certificateUrl: String,
  verified: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Certificate", CertificateSchema);
