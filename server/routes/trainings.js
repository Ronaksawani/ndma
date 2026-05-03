const express = require("express");
const TrainingEvent = require("../models/TrainingEvent.js");
const auth = require("../middleware/auth.js");
const jwt = require("jsonwebtoken");

const router = express.Router();

// Optional auth middleware - sets req.user if token provided
const optionalAuth = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];
  if (token) {
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET ||
          "your_jwt_secret_key_change_this_in_production",
      );
      req.user = decoded;
    } catch (error) {
      // Token invalid, but continue as unauthenticated
    }
  }
  next();
};

// Get all trainings (with filters)
router.get("/", optionalAuth, async (req, res) => {
  try {
    const { status, partnerId, theme, state, limit = 50, page = 1 } = req.query;

    let filter = {};
    if (status) filter.status = status;
    if (partnerId) filter.partnerId = partnerId;
    if (theme) filter.theme = theme;
    if (state) filter["location.state"] = state;

    // Only approved trainings visible to public (unless authenticated as partner/admin viewing their own)
    // For now, show all trainings for public calendar
    if (
      req.user &&
      (req.user.role === "admin" || req.user.role === "partner")
    ) {
      // Admin/Partner can see all trainings
    } else {
      // Public can see all trainings (change to "approved" when needed)
      // filter.status = "approved";
    }

    const skip = (page - 1) * limit;
    const trainings = await TrainingEvent.find(filter)
      .populate("partnerId", "organizationName")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await TrainingEvent.countDocuments(filter);

    res.json({
      trainings,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page),
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch trainings", error: error.message });
  }
});

// Get training by ID
router.get("/:id", async (req, res) => {
  try {
    const training = await TrainingEvent.findById(req.params.id).populate(
      "partnerId",
      "organizationName contactPerson phone",
    );
    if (!training) {
      return res.status(404).json({ message: "Training not found" });
    }

    // Fetch participants for this training from consolidated Participant documents
    const Participant = require("../models/Participant.js");
    const participantDocs = await Participant.find({
      "trainings.trainingId": training._id,
    }).lean();

    // Map to include only the relevant training entry per participant
    const participants = participantDocs.map((p) => {
      const t = p.trainings.find((tt) => tt.trainingId && tt.trainingId.toString() === training._id.toString());
      return {
        participantId: p._id,
        email: p.email,
        name: p.fullName,
        training: t || null,
      };
    });

    res.json({
      ...training.toObject(),
      participants: participants || [],
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch training", error: error.message });
  }
});

// Create training (admin only)
router.post("/admin/create", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Only admins can create trainings via this endpoint",
      });
    }

    const {
      title,
      theme,
      description,
      startDate,
      endDate,
      state,
      district,
      city,
      latitude,
      longitude,
      address,
      trainerName,
      trainerEmail,
      trainerContactNo,
      participantsCount,
      government = 0,
      ngo = 0,
      volunteers = 0,
      partnerId,
    } = req.body;

    // Validate required fields
    if (!title || !theme || !startDate || !endDate || !state || !city) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!partnerId) {
      return res.status(400).json({ message: "Partner ID is required" });
    }

    const training = new TrainingEvent({
      title,
      theme,
      description,
      startDate,
      endDate,
      location: {
        state,
        district,
        city,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        address: address || `${city}, ${state}`,
      },
      trainerName,
      trainerEmail,
      trainerContactNo,
      participantsCount: parseInt(participantsCount) || 0,
      participantBreakdown: {
        government: parseInt(government) || 0,
        ngo: parseInt(ngo) || 0,
        volunteers: parseInt(volunteers) || 0,
      },
      partnerId,
      status: "approved",
      approvedBy: req.user.userId,
      approvedAt: new Date(),
    });

    await training.save();

    res.status(201).json({
      message: "Training event created successfully by admin",
      training,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Failed to create training", error: error.message });
  }
});

// Create training (partner only)
router.post("/", auth, async (req, res) => {
  try {
    if (req.user.role !== "partner") {
      return res
        .status(403)
        .json({ message: "Only partners can create trainings" });
    }

    // Get the partner's organization ID
    const Partner = require("../models/Partner");
    const partner = await Partner.findOne({ userId: req.user.userId });

    if (!partner) {
      return res
        .status(404)
        .json({ message: "Partner organization not found" });
    }

    const {
      title,
      theme,
      startDate,
      endDate,
      state,
      district,
      city,
      latitude,
      longitude,
      address,
      trainerName,
      trainerEmail,
      trainerContactNo,
      participantsCount,
      photos,
      attendanceSheet,
      participants,
    } = req.body;

    const training = new TrainingEvent({
      title,
      theme,
      startDate,
      endDate,
      location: {
        state,
        district,
        city,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        address: address || `${city}, ${state}`,
      },
      trainerName,
      trainerEmail,
      trainerContactNo,
      participantsCount: parseInt(participantsCount) || 0,
      partnerId: partner._id,
      status: "pending",
    });

    // Parse and add photos if provided
    if (photos) {
      try {
        const photoArray =
          typeof photos === "string" ? JSON.parse(photos) : photos;
        training.photos = photoArray.map((photo) => ({
          url: photo.url,
          filename: photo.filename || photo.publicId || "photo",
        }));
      } catch (e) {
        console.log("Photos parsing error:", e.message);
      }
    }

    // Parse and add attendance sheet if provided
    if (attendanceSheet) {
      try {
        const sheetData =
          typeof attendanceSheet === "string"
            ? JSON.parse(attendanceSheet)
            : attendanceSheet;
        training.attendanceSheet = {
          url: sheetData.url,
          filename: sheetData.filename || "attendance",
        };
      } catch (e) {
        console.log("Attendance sheet parsing error:", e.message);
      }
    }

    await training.save();

    // Save participants to consolidated Participant documents if provided
    if (participants) {
      try {
        const participantsArray =
          typeof participants === "string"
            ? JSON.parse(participants)
            : participants;
        const Partner = require("../models/Partner");
        const partnerDoc = await Partner.findOne({ userId: req.user.userId });
        const organizationName =
          partnerDoc?.organizationName || "Training Organization";

        const Participant = require("../models/Participant.js");

        for (const p of participantsArray) {
          const filter = {};
          if (p.aadhaarNumber) filter.aadhaarNumber = p.aadhaarNumber;
          else if (p.email) filter.email = p.email.toLowerCase();

          const trainingEntry = {
            trainingId: training._id,
            trainingTitle: title,
            trainingTheme: theme,
            trainingDates: { start: startDate, end: endDate },
            organization: organizationName,
            certificateIssued: true,
            certificateIssuedAt: new Date(),
            createdAt: new Date(),
          };

          if (Object.keys(filter).length) {
            const existing = await Participant.findOne(filter);
            if (existing) {
              existing.trainings.push(trainingEntry);
              await existing.save();
            } else {
              const newP = new Participant({
                fullName: p.fullName || "",
                aadhaarNumber: p.aadhaarNumber || undefined,
                email: p.email ? p.email.toLowerCase() : undefined,
                phone: p.phone || undefined,
                organization: p.organization || organizationName,
                trainings: [trainingEntry],
              });
              await newP.save();
            }
          }
        }
      } catch (e) {
        console.log("Participants saving error:", e.message);
        // Don't fail the training creation if participants saving fails
      }
    }

    res.status(201).json({
      message: "Training event created successfully",
      training,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Failed to create training", error: error.message });
  }
});

// Create scheduled training (partner only, status=upcoming)
router.post("/schedule", auth, async (req, res) => {
  try {
    if (req.user.role !== "partner") {
      return res
        .status(403)
        .json({ message: "Only partners can schedule trainings" });
    }

    const Partner = require("../models/Partner");
    const partner = await Partner.findOne({ userId: req.user.userId });

    if (!partner) {
      return res
        .status(404)
        .json({ message: "Partner organization not found" });
    }

    const {
      title,
      theme,
      startDate,
      endDate,
      state,
      district,
      city,
      latitude,
      longitude,
      address,
      trainerName,
      trainerEmail,
      trainerContactNo,
      participantsCount,
    } = req.body;

    if (!title || !theme || !startDate || !endDate || !state || !district) {
      return res.status(400).json({
        message: "Missing required fields for scheduled training",
      });
    }

    const training = new TrainingEvent({
      title,
      theme,
      startDate,
      endDate,
      location: {
        state,
        district,
        city,
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
        address: address || [city, district, state].filter(Boolean).join(", "),
      },
      trainerName,
      trainerEmail,
      trainerContactNo,
      participantsCount: parseInt(participantsCount, 10) || 0,
      partnerId: partner._id,
      status: "upcoming",
    });

    await training.save();

    res.status(201).json({
      message: "Training scheduled successfully",
      training,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Failed to schedule training", error: error.message });
  }
});

// Submit scheduled training for approval (partner owner only)
router.patch("/:id/submit-for-approval", auth, async (req, res) => {
  try {
    if (req.user.role !== "partner") {
      return res
        .status(403)
        .json({ message: "Only partners can submit trainings for approval" });
    }

    const Partner = require("../models/Partner");
    const partner = await Partner.findOne({ userId: req.user.userId });
    if (!partner) {
      return res
        .status(404)
        .json({ message: "Partner organization not found" });
    }

    const training = await TrainingEvent.findById(req.params.id);
    if (!training) {
      return res.status(404).json({ message: "Training not found" });
    }

    if (training.partnerId.toString() !== partner._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this training" });
    }

    if (training.status !== "upcoming") {
      return res.status(400).json({
        message: "Only upcoming trainings can be submitted for approval",
      });
    }

    const {
      title,
      theme,
      startDate,
      endDate,
      state,
      district,
      city,
      latitude,
      longitude,
      address,
      trainerName,
      trainerEmail,
      trainerContactNo,
      participantsCount,
      photos,
      attendanceSheet,
      participants,
    } = req.body;

    if (title) training.title = title;
    if (theme) training.theme = theme;
    if (startDate) training.startDate = startDate;
    if (endDate) training.endDate = endDate;
    if (trainerName !== undefined) training.trainerName = trainerName;
    if (trainerEmail !== undefined) training.trainerEmail = trainerEmail;
    if (trainerContactNo !== undefined)
      training.trainerContactNo = trainerContactNo;
    if (participantsCount !== undefined)
      training.participantsCount = parseInt(participantsCount, 10) || 0;

    if (
      state !== undefined ||
      district !== undefined ||
      city !== undefined ||
      latitude !== undefined ||
      longitude !== undefined ||
      address !== undefined
    ) {
      training.location = {
        state: state !== undefined ? state : training.location?.state,
        district:
          district !== undefined ? district : training.location?.district,
        city: city !== undefined ? city : training.location?.city,
        latitude:
          latitude !== undefined
            ? parseFloat(latitude)
            : training.location?.latitude,
        longitude:
          longitude !== undefined
            ? parseFloat(longitude)
            : training.location?.longitude,
        address: address !== undefined ? address : training.location?.address,
      };
    }

    if (photos !== undefined) {
      try {
        const photoArray =
          typeof photos === "string" ? JSON.parse(photos) : photos;
        training.photos = photoArray.map((photo) => ({
          url: photo.url,
          filename: photo.filename || photo.publicId || "photo",
        }));
      } catch (e) {
        console.log("Photos parsing error:", e.message);
      }
    }

    if (attendanceSheet !== undefined) {
      try {
        if (attendanceSheet === null) {
          training.attendanceSheet = null;
        } else {
          const sheetData =
            typeof attendanceSheet === "string"
              ? JSON.parse(attendanceSheet)
              : attendanceSheet;
          training.attendanceSheet = {
            url: sheetData.url,
            filename: sheetData.filename || "attendance",
          };
        }
      } catch (e) {
        console.log("Attendance sheet parsing error:", e.message);
      }
    }

    training.status = "pending";
    training.rejectionReason = undefined;
    training.approvedAt = undefined;
    training.approvedBy = undefined;

    await training.save();

    if (participants) {
      try {
        const participantsArray =
          typeof participants === "string"
            ? JSON.parse(participants)
            : participants;
        const db = require("mongoose").connection;
        const partnerDoc = await Partner.findOne({ userId: req.user.userId });
        const organizationName =
          partnerDoc?.organizationName || "Training Organization";

        await db
          .collection("participants")
          .deleteMany({ trainingId: training._id });

        const participantDocs = participantsArray.map((participant) => ({
          ...participant,
          trainingId: training._id,
          trainingTitle: training.title,
          trainingTheme: training.theme,
          trainingDates: {
            start: training.startDate,
            end: training.endDate,
          },
          organization: organizationName,
          certificateIssued: true,
          certificateIssuedAt: new Date(),
          createdAt: new Date(),
        }));

        if (participantDocs.length > 0) {
          await db.collection("participants").insertMany(participantDocs);
        }
      } catch (e) {
        console.log("Participants update error:", e.message);
      }
    }

    res.json({
      message: "Training submitted for approval successfully",
      training,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to submit training for approval",
      error: error.message,
    });
  }
});

// Cancel scheduled training (partner owner only)
router.patch("/:id/cancel-scheduled", auth, async (req, res) => {
  try {
    if (req.user.role !== "partner") {
      return res
        .status(403)
        .json({ message: "Only partners can cancel scheduled trainings" });
    }

    const Partner = require("../models/Partner");
    const partner = await Partner.findOne({ userId: req.user.userId });
    if (!partner) {
      return res
        .status(404)
        .json({ message: "Partner organization not found" });
    }

    const training = await TrainingEvent.findById(req.params.id);
    if (!training) {
      return res.status(404).json({ message: "Training not found" });
    }

    if (training.partnerId.toString() !== partner._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this training" });
    }

    if (training.status !== "upcoming") {
      return res.status(400).json({
        message: "Only upcoming scheduled trainings can be canceled",
      });
    }

    training.status = "canceled";
    await training.save();

    res.json({
      message: "Scheduled training canceled successfully",
      training,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to cancel scheduled training",
      error: error.message,
    });
  }
});

// Update training (partner owner or admin)
router.put("/:id", auth, async (req, res) => {
  try {
    const training = await TrainingEvent.findById(req.params.id);
    if (!training) {
      return res.status(404).json({ message: "Training not found" });
    }

    // Check authorization
    if (req.user.role !== "admin") {
      const Partner = require("../models/Partner");
      const partner = await Partner.findOne({ userId: req.user.userId });

      if (
        !partner ||
        training.partnerId.toString() !== partner._id.toString()
      ) {
        return res
          .status(403)
          .json({ message: "Not authorized to update this training" });
      }
    }

    const {
      title,
      theme,
      startDate,
      endDate,
      state,
      district,
      city,
      latitude,
      longitude,
      trainerName,
      trainerEmail,
      participantsCount,
      participants,
      photos,
      attendanceSheet,
    } = req.body;

    // Only update allowed fields (not status)
    if (title) training.title = title;
    if (theme) training.theme = theme;
    if (startDate) training.startDate = startDate;
    if (endDate) training.endDate = endDate;
    if (trainerName) training.trainerName = trainerName;
    if (trainerEmail) training.trainerEmail = trainerEmail;
    if (participantsCount)
      training.participantsCount = parseInt(participantsCount);

    // Update location
    if (state || district || city || latitude || longitude) {
      training.location = {
        state: state || training.location?.state,
        district: district || training.location?.district,
        city: city || training.location?.city,
        latitude: latitude ? parseFloat(latitude) : training.location?.latitude,
        longitude: longitude
          ? parseFloat(longitude)
          : training.location?.longitude,
      };
    }

    // Update photos if provided
    if (photos !== undefined) {
      try {
        const photoArray =
          typeof photos === "string" ? JSON.parse(photos) : photos;
        training.photos = photoArray.map((photo) => ({
          url: photo.url,
          filename: photo.filename || photo.publicId || "photo",
        }));
      } catch (e) {
        console.log("Photos parsing error:", e.message);
      }
    }

    // Update attendance sheet if provided
    if (attendanceSheet !== undefined) {
      try {
        if (attendanceSheet === null) {
          training.attendanceSheet = null;
        } else {
          const sheetData =
            typeof attendanceSheet === "string"
              ? JSON.parse(attendanceSheet)
              : attendanceSheet;
          training.attendanceSheet = {
            url: sheetData.url,
            filename: sheetData.filename || "attendance",
          };
        }
      } catch (e) {
        console.log("Attendance sheet parsing error:", e.message);
      }
    }

    await training.save();

    // Handle participants update if provided
    if (participants) {
      try {
        const participantsArray =
          typeof participants === "string"
            ? JSON.parse(participants)
            : participants;
        const db = require("mongoose").connection;
        const Partner = require("../models/Partner");
        const partnerDoc = await Partner.findOne({ userId: req.user.userId });
        const organizationName =
          partnerDoc?.organizationName || "Training Organization";

        // Remove any existing training entries for this training across participants
        const Participant = require("../models/Participant.js");
        await Participant.updateMany({}, { $pull: { trainings: { trainingId: training._id } } });

        // Add updated participants into consolidated Participant documents
        for (const participant of participantsArray) {
          const filter = {};
          if (participant.aadhaarNumber) filter.aadhaarNumber = participant.aadhaarNumber;
          else if (participant.email) filter.email = participant.email.toLowerCase();

          const trainingEntry = {
            trainingId: training._id,
            trainingTitle: title || training.title,
            trainingTheme: theme || training.theme,
            trainingDates: {
              start: startDate || training.startDate,
              end: endDate || training.endDate,
            },
            organization: organizationName,
            certificateIssued: true,
            certificateIssuedAt: new Date(),
            createdAt: new Date(),
          };

          if (Object.keys(filter).length) {
            const existing = await Participant.findOne(filter);
            if (existing) {
              existing.trainings = existing.trainings || [];
              existing.trainings.push(trainingEntry);
              await existing.save();
            } else {
              const newP = new Participant({
                fullName: participant.fullName || "",
                aadhaarNumber: participant.aadhaarNumber || undefined,
                email: participant.email ? participant.email.toLowerCase() : undefined,
                phone: participant.phone || undefined,
                organization: participant.organization || organizationName,
                trainings: [trainingEntry],
              });
              await newP.save();
            }
          }
        }
      } catch (e) {
        console.log("Participants update error:", e.message);
        // Don't fail the training update if participants update fails
      }
    }

    // Fetch updated participants and return
    const Participant = require("../models/Participant.js");
    const participantDocs = await Participant.find({ "trainings.trainingId": training._id }).lean();
    const updatedParticipants = participantDocs.map((p) => {
      const t = p.trainings.find((tt) => tt.trainingId && tt.trainingId.toString() === training._id.toString());
      return {
        participantId: p._id,
        email: p.email,
        name: p.fullName,
        training: t || null,
      };
    });

    res.json({
      message: "Training updated successfully",
      training: {
        ...training.toObject(),
        participants: updatedParticipants || [],
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update training", error: error.message });
  }
});

// Update training status (admin only)
router.patch("/:id/status", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admins can update status" });
    }

    const { status, reason } = req.body;

    const update = { status };
    if (status === "approved") {
      update.approvedAt = new Date();
      update.approvedBy = req.user.userId;
    } else if (status === "rejected") {
      update.rejectionReason = reason;
    }

    const training = await TrainingEvent.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true },
    );

    if (!training) {
      return res.status(404).json({ message: "Training not found" });
    }

    res.json({
      message: `Training ${status} successfully`,
      training,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update training status",
      error: error.message,
    });
  }
});

// Delete training (admin or partner owner)
router.delete("/:id", auth, async (req, res) => {
  try {
    const training = await TrainingEvent.findById(req.params.id);
    if (!training) {
      return res.status(404).json({ message: "Training not found" });
    }

    if (
      req.user.role !== "admin" &&
      training.partnerId.toString() !== req.user.userId.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this training" });
    }

    await TrainingEvent.findByIdAndDelete(req.params.id);

    res.json({ message: "Training deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete training", error: error.message });
  }
});

// Register participant for training
router.post("/:id/register", auth, async (req, res) => {
  try {
    if (req.user.role !== "participant") {
      return res.status(403).json({ message: "Only participants can register" });
    }

    const training = await TrainingEvent.findById(req.params.id);
    if (!training) {
      return res.status(404).json({ message: "Training not found" });
    }

    const Participant = require("../models/Participant.js");

    // Find or create participant profile and add training entry
    const email = req.user.email.toLowerCase();
    let participant = await Participant.findOne({ email });

    const already = participant?.trainings?.find(
      (t) => t.trainingId && t.trainingId.toString() === req.params.id && t.status !== "cancelled",
    );
    if (already) {
      return res.status(400).json({ message: "Already registered for this training" });
    }

    const trainingEntry = {
      trainingId: training._id,
      trainingTitle: training.title,
      trainingTheme: training.theme,
      trainingDates: { start: training.startDate, end: training.endDate },
      organization: training.partnerId.toString(),
      status: "registered",
      createdAt: new Date(),
    };

    if (!participant) {
      participant = new Participant({
        fullName: req.user.fullName || "",
        email,
        aadhaarNumber: req.user.aadhaarNumber || undefined,
        phone: req.user.phone || undefined,
        trainings: [trainingEntry],
      });
    } else {
      participant.trainings = participant.trainings || [];
      participant.trainings.push(trainingEntry);
    }

    await participant.save();

    // Add to training's registered participants
    training.registeredParticipants.push({
      participantId: participant._id,
      email,
      name: participant.fullName || req.user.fullName || "Participant",
      registeredAt: new Date(),
      status: "registered",
    });

    await training.save();

    // Create notification
    const Notification = require("../models/Notification.js");
    const notification = new Notification({
      recipientEmail: req.user.email,
      type: "registration_confirmed",
      title: "Registration Confirmed",
      message: `You have successfully registered for ${training.title}`,
      trainingId: training._id,
      data: {
        trainingTitle: training.title,
        trainingDate: training.startDate,
      },
    });

    await notification.save();

    res.status(201).json({
      message: "Successfully registered for training",
      registration: {
        id: participant._id,
        trainingId: training._id,
        title: training.title,
        startDate: training.startDate,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to register for training", error: error.message });
  }
});

// Cancel registration
router.post("/:id/cancel-registration", auth, async (req, res) => {
  try {
    if (req.user.role !== "participant") {
      return res.status(403).json({ message: "Only participants can cancel" });
    }
    const Participant = require('../models/Participant.js');

    // Find participant and the matching training entry
    const email = req.user.email.toLowerCase();
    const participant = await Participant.findOne({
      email,
      'trainings.trainingId': req.params.id,
      'trainings.status': 'registered',
    });

    if (!participant) {
      return res.status(404).json({ message: 'Registration not found or already cancelled' });
    }

    // Update the nested training entry to cancelled
    await Participant.updateOne(
      { email, 'trainings.trainingId': req.params.id, 'trainings.status': 'registered' },
      { $set: { 'trainings.$.status': 'cancelled' } },
    );

    // Remove from training's registered participants
    const training = await TrainingEvent.findById(req.params.id);
    if (training) {
      training.registeredParticipants = training.registeredParticipants.filter(
        (rp) => rp.participantId.toString() !== participant._id.toString(),
      );
      await training.save();
    }

    // Create notification
    const Notification = require("../models/Notification.js");
    const notification = new Notification({
      recipientEmail: req.user.email,
      type: "training_cancelled",
      title: "Registration Cancelled",
      message: `Your registration for ${participant.trainingTitle} has been cancelled`,
      trainingId: req.params.id,
      data: {
        trainingTitle: participant.trainingTitle,
      },
    });

    await notification.save();

    res.json({
      message: "Registration cancelled successfully",
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to cancel registration", error: error.message });
  }
});

// Get training by ID with registration status
router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const training = await TrainingEvent.findById(req.params.id);
    if (!training) {
      return res.status(404).json({ message: "Training not found" });
    }

    let isRegistered = false;
      if (req.user && req.user.role === "participant") {
        const Participant = require("../models/Participant.js");
        const reg = await Participant.findOne({
          email: req.user.email.toLowerCase(),
          "trainings.trainingId": req.params.id,
          "trainings.status": "registered",
        });
        isRegistered = !!reg;
    }

    res.json({
      ...training.toObject(),
      isRegistered,
      registrationCount: training.registeredParticipants?.length || 0,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch training", error: error.message });
  }
});

module.exports = router;
