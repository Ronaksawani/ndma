const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User.js");
const Partner = require("../models/Partner.js");
const Participant = require("../models/Participant.js");
const TrainingEvent = require("../models/TrainingEvent.js");
const auth = require("../middleware/auth.js");

const router = express.Router();

async function syncParticipantCertificates(participant) {
  const trainings = participant?.trainings || [];
  const trainingIds = [
    ...new Set(
      trainings
        .map((training) => training.trainingId)
        .filter(Boolean)
        .map((trainingId) => trainingId.toString()),
    ),
  ];

  if (trainingIds.length === 0) {
    return trainings;
  }

  const approvedTrainings = await TrainingEvent.find({
    _id: { $in: trainingIds },
    status: { $in: ["approved", "ongoing", "completed"] },
  }).lean();

  const approvedById = new Map(
    approvedTrainings.map((training) => [training._id.toString(), training]),
  );

  let changed = false;
  const updatedTrainings = trainings.map((training) => {
    if (!training.trainingId) return training;

    const liveTraining = approvedById.get(training.trainingId.toString());
    if (!liveTraining || training.status === "cancelled") return training;

    const shouldIssueCertificate = !training.certificateIssued;
    if (!shouldIssueCertificate && training.status === "completed") {
      return training;
    }

    changed = true;
    return {
      ...training,
      status: "completed",
      certificateIssued: true,
      certificateIssuedAt:
        training.certificateIssuedAt || liveTraining.approvedAt || new Date(),
    };
  });

  if (changed) {
    participant.trainings = updatedTrainings;
    await participant.save();
  }

  return participant.trainings || [];
}

function normalizeParticipantPayload(body) {
  const fullName = String(body.fullName || "").trim();
  const aadhaarNumber = String(body.aadhaarNumber || "")
    .replace(/\D/g, "")
    .slice(0, 12);
  const email = String(body.email || "")
    .trim()
    .toLowerCase();
  const phone = String(body.phone || "")
    .replace(/\D/g, "")
    .slice(0, 10);
  const dateOfBirth = body.dateOfBirth ? new Date(body.dateOfBirth) : null;
  const gender = String(body.gender || "").trim();
  const state = String(body.state || "").trim();
  const nearbyDistricts = Array.isArray(body.nearbyDistricts)
    ? body.nearbyDistricts
        .map((district) => String(district).trim())
        .filter(Boolean)
    : [];

  return {
    fullName,
    aadhaarNumber,
    email,
    phone,
    dateOfBirth,
    gender,
    state,
    nearbyDistricts,
  };
}

// Register
router.post("/register", async (req, res) => {
  try {
    const {
      email,
      password,
      organizationName,
      organizationType,
      state,
      district,
      address,
      contactPerson,
      phone,
    } = req.body;

    let existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const user = new User({
      email,
      password,
      role: "partner",
    });
    await user.save();

    const partner = new Partner({
      organizationName,
      organizationType,
      state,
      district,
      address,
      contactPerson,
      email,
      phone,
      userId: user._id,
      status: "pending",
    });
    await partner.save();

    user.organizationId = partner._id;
    await user.save();

    res.status(201).json({
      message: "Registration submitted. Awaiting admin approval.",
      partner: {
        _id: partner._id,
        organizationName: partner.organizationName,
        status: partner.status,
      },
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Registration failed", error: error.message });
  }
});

// Participant registration
router.post("/participant-register", async (req, res) => {
  try {
    const {
      fullName,
      aadhaarNumber,
      email,
      phone,
      dateOfBirth,
      gender,
      state,
      nearbyDistricts,
    } = normalizeParticipantPayload(req.body);

    if (
      !fullName ||
      !aadhaarNumber ||
      !email ||
      !phone ||
      !dateOfBirth ||
      !gender ||
      !state
    ) {
      return res
        .status(400)
        .json({ message: "All participant fields are required" });
    }

    if (!/^\d{12}$/.test(aadhaarNumber)) {
      return res
        .status(400)
        .json({ message: "Aadhaar number must be exactly 12 digits" });
    }

    if (!/^\d{10}$/.test(phone)) {
      return res
        .status(400)
        .json({ message: "Phone number must be exactly 10 digits" });
    }

    if (!(dateOfBirth instanceof Date) || Number.isNaN(dateOfBirth.getTime())) {
      return res.status(400).json({ message: "Date of birth is invalid" });
    }

    if (nearbyDistricts.length !== 3) {
      return res
        .status(400)
        .json({ message: "Please select exactly 3 nearby districts" });
    }

    const existingParticipant = await Participant.findOne({
      $or: [{ email }, { aadhaarNumber }],
    });

    if (existingParticipant) {
      return res
        .status(400)
        .json({ message: "Participant already registered" });
    }

    const participant = new Participant({
      fullName,
      aadhaarNumber,
      email,
      phone,
      dateOfBirth,
      gender,
      state,
      nearbyDistricts,
      trainings: [],
    });

    await participant.save();

    res.status(201).json({
      message: "Participant registration successful",
      participant: {
        id: participant._id,
        fullName: participant.fullName,
        email: participant.email,
        phone: participant.phone,
        aadhaarNumber: participant.aadhaarNumber,
        dateOfBirth: participant.dateOfBirth,
        gender: participant.gender,
        state: participant.state,
        nearbyDistricts: participant.nearbyDistricts,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Participant registration failed",
      error: error.message,
    });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (user.role !== role) {
      return res
        .status(400)
        .json({ message: `User role is ${user.role}, not ${role}` });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (user.status !== "active") {
      return res.status(403).json({ message: "User account is not active" });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "your_jwt_secret_key_change_this_in_production",
      { expiresIn: "7d" },
    );

    let userData = {
      id: user._id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    };

    if (user.organizationId) {
      const partner = await Partner.findById(user.organizationId);
      if (partner) {
        userData = {
          ...userData,
          organizationName: partner.organizationName,
          organizationType: partner.organizationType,
          contactPerson: partner.contactPerson,
          phone: partner.phone,
          status: partner.status,
        };
      }
    }

    res.json({
      message: "Login successful",
      token,
      user: userData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Login failed", error: error.message });
  }
});

// Participant login (email + Aadhaar)
router.post("/participant-login", async (req, res) => {
  try {
    const { email, aadhaarNumber } = req.body;

    if (!email || !aadhaarNumber) {
      return res
        .status(400)
        .json({ message: "Email and Aadhaar number are required" });
    }

    const participant = await Participant.findOne({
      email: email.toLowerCase(),
      aadhaarNumber,
    });

    if (!participant) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const certificatesCount = (participant.trainings || []).filter(
      (t) => t.certificateIssued,
    ).length;

    const token = jwt.sign(
      {
        participantId: participant._id,
        email: participant.email,
        role: "participant",
      },
      process.env.JWT_SECRET || "your_jwt_secret_key_change_this_in_production",
      { expiresIn: "7d" },
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: participant._id,
        participantId: participant._id,
        email: participant.email,
        role: "participant",
        fullName: participant.fullName,
        phone: participant.phone,
        aadhaarNumber: participant.aadhaarNumber,
        organization: participant.organization,
        certificatesCount,
      },
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Participant login failed", error: error.message });
  }
});

// Refresh token
router.post("/refresh", auth, async (req, res) => {
  try {
    let tokenPayload = null;

    if (req.user.role === "participant") {
      const participant = await Participant.findOne({ email: req.user.email });
      if (!participant) {
        return res.status(404).json({ message: "Participant not found" });
      }
      tokenPayload = {
        participantId: participant._id,
        email: participant.email,
        role: "participant",
      };
    } else {
      const user = await User.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      tokenPayload = { userId: user._id, email: user.email, role: user.role };
    }

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || "your_jwt_secret_key_change_this_in_production",
      { expiresIn: "7d" },
    );

    res.json({ token });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Token refresh failed", error: error.message });
  }
});

// Change password
router.post("/change-password", auth, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "New passwords do not match" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Failed to change password", error: error.message });
  }
});

// Get user profile
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password -__v");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let userData = user.toObject();

    if (user.organizationId) {
      const partner = await Partner.findById(user.organizationId);
      if (partner) {
        userData = {
          ...userData,
          organizationName: partner.organizationName,
          organizationType: partner.organizationType,
          contactPerson: partner.contactPerson,
          phone: partner.phone,
          state: partner.state,
          district: partner.district,
          address: partner.address,
          status: partner.status,
        };
      }
    }

    res.json(userData);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch profile", error: error.message });
  }
});

// Participant profile
router.get("/participant/profile", auth, async (req, res) => {
  try {
    if (req.user.role !== "participant") {
      return res.status(403).json({ message: "Only participants can access" });
    }

    const participant = await Participant.findOne({
      email: req.user.email.toLowerCase(),
    });
    if (!participant)
      return res.status(404).json({ message: "Participant not found" });

    res.json({
      id: participant._id,
      email: participant.email,
      fullName: participant.fullName,
      phone: participant.phone,
      aadhaarNumber: participant.aadhaarNumber,
      dateOfBirth: participant.dateOfBirth,
      gender: participant.gender,
      state: participant.state,
      nearbyDistricts: participant.nearbyDistricts,
      organization: participant.organization,
      participationsCount: (participant.trainings || []).length,
      certificatesCount: (participant.trainings || []).filter(
        (t) => t.certificateIssued,
      ).length,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch participant profile",
      error: error.message,
    });
  }
});

// Participant records (participations + certificates)
router.get("/participant/records", auth, async (req, res) => {
  try {
    if (req.user.role !== "participant") {
      return res.status(403).json({ message: "Only participants can access" });
    }

    const participant = await Participant.findOne({
      email: req.user.email.toLowerCase(),
    });
    if (!participant)
      return res.status(404).json({ message: "Participant not found" });

    const records = await syncParticipantCertificates(participant);
    const certificates = records.filter((r) => r.certificateIssued);

    const sortedRecords = records
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ records: sortedRecords, certificates });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch participant records",
      error: error.message,
    });
  }
});

// Participant dashboard summary
router.get("/participant/dashboard", auth, async (req, res) => {
  try {
    if (req.user.role !== "participant") {
      return res.status(403).json({ message: "Only participants can access" });
    }

    const participant = await Participant.findOne({
      email: req.user.email.toLowerCase(),
    });
    if (!participant)
      return res.status(404).json({ message: "Participant not found" });

    const syncedTrainings = await syncParticipantCertificates(participant);

    const completedTrainingIds = [
      ...new Set(
        syncedTrainings
          .filter((t) => t.certificateIssued && t.trainingId)
          .map((t) => t.trainingId.toString()),
      ),
    ];

    const myTrainingDetails = completedTrainingIds.length
      ? await TrainingEvent.find({ _id: { $in: completedTrainingIds } }).sort({
          startDate: -1,
        })
      : [];

    const nearbyDistricts = (participant.nearbyDistricts || [])
      .map((district) => String(district || "").trim())
      .filter(Boolean);

    const nearbyTrainingQuery = {
      status: { $in: ["approved", "upcoming", "ongoing"] },
      startDate: { $gte: new Date() },
    };

    if (nearbyDistricts.length > 0) {
      nearbyTrainingQuery["location.district"] = { $in: nearbyDistricts };
    }

    const nearbyTrainings = await TrainingEvent.find(nearbyTrainingQuery).sort({
      startDate: 1,
    });

    res.json({
      stats: {
        totalParticipations: syncedTrainings.length,
        certificatesIssued: syncedTrainings.filter((r) => r.certificateIssued)
          .length,
        upcomingTrainings: nearbyTrainings.length,
        statesCovered: new Set(
          myTrainingDetails.map((t) => t.location?.state).filter(Boolean),
        ).size,
      },
      myRecords: syncedTrainings,
      myTrainingDetails,
      nearbyTrainings,
      upcomingTrainings: nearbyTrainings,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch participant dashboard",
      error: error.message,
    });
  }
});

// Update participant profile
router.put("/participant/profile", auth, async (req, res) => {
  try {
    if (req.user.role !== "participant") {
      return res.status(403).json({ message: "Only participants can access" });
    }

    const { fullName, phone, dateOfBirth, gender, state, nearbyDistricts } =
      req.body;

    const records = await Participant.find({ email: req.user.email }).sort({
      createdAt: -1,
    });

    if (!records.length) {
      return res.status(404).json({ message: "Participant not found" });
    }

    // Update latest record
    const latest = records[0];
    if (fullName) latest.fullName = fullName;
    if (phone) latest.phone = phone;
    if (dateOfBirth) latest.dateOfBirth = dateOfBirth;
    if (gender) latest.gender = gender;
    if (state) latest.state = state;
    if (nearbyDistricts) latest.nearbyDistricts = nearbyDistricts;

    await latest.save();

    res.json({
      message: "Profile updated successfully",
      profile: {
        id: latest._id,
        email: latest.email,
        fullName: latest.fullName,
        phone: latest.phone,
        dateOfBirth: latest.dateOfBirth,
        gender: latest.gender,
        state: latest.state,
        nearbyDistricts: latest.nearbyDistricts,
        aadhaarNumber: latest.aadhaarNumber,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update profile", error: error.message });
  }
});

// Get participant notifications
router.get("/participant/notifications", auth, async (req, res) => {
  try {
    if (req.user.role !== "participant") {
      return res.status(403).json({ message: "Only participants can access" });
    }

    const Notification = require("../models/Notification.js");
    const notifications = await Notification.find({
      recipientEmail: req.user.email,
    })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = notifications.filter((n) => !n.read).length;

    res.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch notifications", error: error.message });
  }
});

// Mark notification as read
router.patch("/participant/notifications/:id/read", auth, async (req, res) => {
  try {
    if (req.user.role !== "participant") {
      return res.status(403).json({ message: "Only participants can access" });
    }

    const Notification = require("../models/Notification.js");
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    if (notification.recipientEmail !== req.user.email) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    notification.read = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({ message: "Notification marked as read" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update notification", error: error.message });
  }
});

module.exports = router;
