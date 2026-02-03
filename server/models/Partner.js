const mongoose = require("mongoose");

const PartnerSchema = new mongoose.Schema({
  organizationName: {
    type: String,
    required: true,
  },
  organizationType: {
    type: String,
    enum: ["govt", "ngo", "private", "training"],
    required: true,
  },
  state: String,
  district: String,
  address: String,
  contactPerson: String,
  email: {
    type: String,
    unique: true,
    required: true,
  },
  phone: String,
  documents: [
    {
      filename: String,
      url: String,
      uploadedAt: Date,
    },
  ],
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  rejectionReason: String,
  userId: mongoose.Schema.Types.ObjectId,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  approvedAt: Date,
  approvedBy: mongoose.Schema.Types.ObjectId,
});

module.exports = mongoose.model("Partner", PartnerSchema);
