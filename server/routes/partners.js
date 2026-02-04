const express = require("express");
const Partner = require("../models/Partner.js");
const User = require("../models/User.js");
const auth = require("../middleware/auth.js");

const router = express.Router();

// Get all partners (admin only)
router.get("/", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Only admins can view all partners" });
    }

    const { status, limit = 50, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    let filter = {};
    
    // If status is specified, use it; otherwise get all partners (admin view)
    if (status && status !== "all") {
      filter.status = status;
    }

    const partners = await Partner.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Partner.countDocuments(filter);

    res.json({
      partners,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page),
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch partners", error: error.message });
  }
});

// Get partner by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id);
    if (!partner) {
      return res.status(404).json({ message: "Partner not found" });
    }
    res.json(partner);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch partner", error: error.message });
  }
});

// Approve partner (admin only)
router.patch("/:id/approve", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Only admins can approve partners" });
    }

    const partner = await Partner.findByIdAndUpdate(
      req.params.id,
      {
        status: "approved",
        approvedAt: new Date(),
        approvedBy: req.user.userId,
      },
      { new: true }
    );

    if (!partner) {
      return res.status(404).json({ message: "Partner not found" });
    }

    // Activate associated user
    if (partner.userId) {
      await User.findByIdAndUpdate(partner.userId, { status: "active" });
    }

    res.json({
      message: "Partner approved successfully",
      partner,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to approve partner", error: error.message });
  }
});

// Update partner status (admin only)
router.patch("/:id/status", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Only admins can update partner status" });
    }

    const { status } = req.body;

    if (!["active", "blocked", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const partner = await Partner.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!partner) {
      return res.status(404).json({ message: "Partner not found" });
    }

    res.json({
      message: `Partner status updated to ${status}`,
      partner,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update partner status", error: error.message });
  }
});

// Reject partner (admin only)
router.patch("/:id/reject", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Only admins can reject partners" });
    }

    const { reason } = req.body;

    const partner = await Partner.findByIdAndUpdate(
      req.params.id,
      {
        status: "rejected",
        rejectionReason: reason,
      },
      { new: true }
    );

    if (!partner) {
      return res.status(404).json({ message: "Partner not found" });
    }

    res.json({
      message: "Partner rejected",
      partner,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to reject partner", error: error.message });
  }
});

module.exports = router;
