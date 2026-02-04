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

    // Fetch participants for this training
    const db = require("mongoose").connection;
    const participants = await db
      .collection("participants")
      .find({ trainingId: training._id })
      .toArray();

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
      return res
        .status(403)
        .json({ message: "Only admins can create trainings via this endpoint" });
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
      trainerName,
      trainerEmail,
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
        address: `${city}, ${state}`,
      },
      trainerName,
      trainerEmail,
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
      },
      trainerName,
      trainerEmail,
      participantsCount: parseInt(participantsCount),
      partnerId: req.user.userId,
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

    // Save participants to the participants collection if provided
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

        // Add training info to each participant and save to participants collection
        const participantDocs = participantsArray.map((participant) => ({
          ...participant,
          trainingId: training._id,
          trainingTitle: title,
          trainingTheme: theme,
          trainingDates: { start: startDate, end: endDate },
          organization: organizationName,
          certificateIssued: true,
          certificateIssuedAt: new Date(),
          createdAt: new Date(),
        }));

        console.log("Saving participants:", participantDocs);

        if (participantDocs.length > 0) {
          await db.collection("participants").insertMany(participantDocs);
          console.log(
            `Successfully saved ${participantDocs.length} participants`,
          );
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

// Update training (partner owner or admin)
router.put("/:id", auth, async (req, res) => {
  try {
    const training = await TrainingEvent.findById(req.params.id);
    if (!training) {
      return res.status(404).json({ message: "Training not found" });
    }

    // Check authorization
    if (
      req.user.role !== "admin" &&
      training.partnerId.toString() !== req.user.userId.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this training" });
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

        // Delete old participants for this training
        await db
          .collection("participants")
          .deleteMany({ trainingId: training._id });

        // Add updated participants
        const participantDocs = participantsArray.map((participant) => ({
          ...participant,
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
        }));

        if (participantDocs.length > 0) {
          await db.collection("participants").insertMany(participantDocs);
          console.log(
            `Successfully updated ${participantDocs.length} participants`,
          );
        }
      } catch (e) {
        console.log("Participants update error:", e.message);
        // Don't fail the training update if participants update fails
      }
    }

    // Fetch updated participants and return
    const db = require("mongoose").connection;
    const updatedParticipants = await db
      .collection("participants")
      .find({ trainingId: training._id })
      .toArray();

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

module.exports = router;
