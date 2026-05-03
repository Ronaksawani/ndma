const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  recipientEmail: {
    type: String,
    required: true,
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: "recipientType",
  },
  recipientType: {
    type: String,
    enum: ["Participant", "User", "Partner"],
  },
  type: {
    type: String,
    enum: [
      "training_created",
      "training_updated",
      "training_cancelled",
      "registration_confirmed",
      "certificate_issued",
      "reminder",
    ],
    required: true,
  },
  title: String,
  message: {
    type: String,
    required: true,
  },
  trainingId: mongoose.Schema.Types.ObjectId,
  data: {
    trainingTitle: String,
    trainingDate: Date,
    reason: String,
  },
  read: {
    type: Boolean,
    default: false,
  },
  readAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Notification", NotificationSchema);
