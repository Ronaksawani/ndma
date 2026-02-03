const express = require("express");
const TrainingEvent = require("../models/TrainingEvent.js");
const Partner = require("../models/Partner.js");
const auth = require("../middleware/auth.js");

const router = express.Router();

// Dashboard analytics (admin only)
router.get("/dashboard", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Only admins can access dashboard" });
    }

    const totalTrainings = await TrainingEvent.countDocuments({
      status: "approved",
    });
    const activePartners = await Partner.countDocuments({ status: "approved" });
    const statesCount = await TrainingEvent.distinct("location.state", {
      status: "approved",
    });
    const totalParticipants = await TrainingEvent.aggregate([
      { $match: { status: "approved" } },
      { $group: { _id: null, total: { $sum: "$participantsCount" } } },
    ]);

    // Recent activities
    const recentTrainings = await TrainingEvent.find({ status: "approved" })
      .populate("partnerId", "organizationName")
      .sort({ approvedAt: -1 })
      .limit(5);

    res.json({
      stats: {
        totalTrainings,
        activePartners,
        statesCovered: statesCount.length,
        totalParticipants: totalParticipants[0]?.total || 0,
      },
      recentActivities: recentTrainings,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch dashboard", error: error.message });
  }
});

// Coverage report
router.get("/coverage", auth, async (req, res) => {
  try {
    const trainingsByTheme = await TrainingEvent.aggregate([
      { $match: { status: "approved" } },
      { $group: { _id: "$theme", count: { $sum: 1 } } },
    ]);

    const trainingsByState = await TrainingEvent.aggregate([
      { $match: { status: "approved" } },
      {
        $group: {
          _id: "$location.state",
          count: { $sum: 1 },
          participants: { $sum: "$participantsCount" },
        },
      },
    ]);

    const participantBreakdown = await TrainingEvent.aggregate([
      { $match: { status: "approved" } },
      {
        $group: {
          _id: null,
          govt: { $sum: "$participantBreakdown.government" },
          ngo: { $sum: "$participantBreakdown.ngo" },
          volunteers: { $sum: "$participantBreakdown.volunteers" },
        },
      },
    ]);

    res.json({
      trainingsByTheme,
      trainingsByState,
      participantBreakdown: participantBreakdown[0] || {
        govt: 0,
        ngo: 0,
        volunteers: 0,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Failed to fetch coverage report",
        error: error.message,
      });
  }
});

// Gap analysis
router.get("/gaps", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Only admins can access gap analysis" });
    }

    // All states vs states with trainings
    const statesWithTrainings = await TrainingEvent.distinct("location.state", {
      status: "approved",
    });

    const allStates = [
      "Andhra Pradesh",
      "Arunachal Pradesh",
      "Assam",
      "Bihar",
      "Chhattisgarh",
      "Delhi",
      "Goa",
      "Gujarat",
      "Haryana",
      "Himachal Pradesh",
      "Jharkhand",
      "Karnataka",
      "Kerala",
      "Madhya Pradesh",
      "Maharashtra",
      "Manipur",
      "Meghalaya",
      "Mizoram",
      "Nagaland",
      "Odisha",
      "Punjab",
      "Rajasthan",
      "Sikkim",
      "Tamil Nadu",
      "Telangana",
      "Tripura",
      "Uttar Pradesh",
      "Uttarakhand",
      "West Bengal",
    ];

    const uncoveredStates = allStates.filter(
      (state) => !statesWithTrainings.includes(state)
    );

    // Low coverage districts
    const districtCoverage = await TrainingEvent.aggregate([
      { $match: { status: "approved" } },
      {
        $group: {
          _id: "$location.district",
          count: { $sum: 1 },
          state: { $first: "$location.state" },
        },
      },
      { $sort: { count: 1 } },
      { $limit: 5 },
    ]);

    res.json({
      uncoveredStates,
      lowCoverageDistricts: districtCoverage,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch gap analysis", error: error.message });
  }
});

module.exports = router;
