require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

console.log("🚀 Server initialization started...");

// =====================
// ENV DEBUG
// =====================
console.log("📦 ENV CHECK:");
console.log("MONGODB_URI:", process.env.MONGODB_URI ? "✅ Loaded" : "❌ Missing");
console.log("FRONTEND_URL:", process.env.FRONTEND_URL || "Not set");
console.log("NODE_ENV:", process.env.NODE_ENV);

// =====================
// MIDDLEWARE
// =====================
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger (VERY IMPORTANT)
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.url}`);
  next();
});

// =====================
// MONGODB CONNECTION
// =====================
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/DTM";

console.log("🔌 Attempting MongoDB connection...");

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB connected successfully");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:");
    console.error(err.message);
  });

// =====================
// ROUTES
// =====================
app.get("/", (req, res) => {
  console.log("🏠 Root endpoint hit");
  res.send("Welcome to the Disaster Training Management API");
});

app.use("/api/auth", require("./routes/auth.js"));
app.use("/api/trainings", require("./routes/trainings.js"));
app.use("/api/partners", require("./routes/partners.js"));
app.use("/api/analytics", require("./routes/analytics.js"));
app.use("/api/upload", require("./routes/upload.js"));
app.use("/api/certificates", require("./routes/certificates.js"));

// =====================
// HEALTH CHECK
// =====================
app.get("/api/health", (req, res) => {
  console.log("💚 Health check endpoint hit");
  res.json({ message: "Server is running" });
});

// =====================
// ERROR HANDLER
// =====================
app.use((err, req, res, next) => {
  console.error("🔥 ERROR OCCURRED:");
  console.error("Message:", err.message);
  console.error("Stack:", err.stack);

  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err : {},
  });
});

// =====================
// SERVER START
// =====================
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;
