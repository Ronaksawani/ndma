const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User.js");
const Partner = require("../models/Partner.js");
const auth = require("../middleware/auth.js");

const router = express.Router();

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
      { expiresIn: "7d" }
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

// Refresh token
router.post("/refresh", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "your_jwt_secret_key_change_this_in_production",
      { expiresIn: "7d" }
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
    const user = await User.findById(req.user.userId).select(
      "-password -__v"
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch profile", error: error.message });
  }
});

module.exports = router;
