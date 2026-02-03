const express = require("express");
const router = express.Router();

// Verify certificate by Aadhaar number
// This route searches the database for a participant with matching Aadhaar
router.get("/verify/:aadhaarNumber", async (req, res) => {
  try {
    const { aadhaarNumber } = req.params;

    // Validate Aadhaar format (12 digits)
    if (!/^\d{12}$/.test(aadhaarNumber)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Aadhaar number format. Must be 12 digits.",
      });
    }

    // Access MongoDB directly through the connection
    const db = require("mongoose").connection;
    
    // Search for participant with matching Aadhaar in the participants collection
    const participant = await db.collection("participants").findOne({
      aadhaarNumber: aadhaarNumber,
    });

    console.log("Searching for Aadhaar:", aadhaarNumber);
    console.log("Found participant:", participant);

    if (!participant) {
      return res.status(404).json({
        success: false,
        verified: false,
        message: "Certificate not found. Please check the Aadhaar number.",
      });
    }

    // Fetch training details if trainingId exists
    let trainingDetails = null;
    if (participant.trainingId) {
      const TrainingEvent = require("../models/TrainingEvent");
      trainingDetails = await TrainingEvent.findById(participant.trainingId);
    }

    // Format the response - participant found is considered verified
    const response = {
      success: true,
      verified: true, // If participant exists, certificate is verified
      aadhaarNumber: participant.aadhaarNumber,
      fullName: participant.fullName,
      email: participant.email,
      phone: participant.phone,
      trainingTitle: participant.trainingTitle || "N/A",
      trainingTheme: participant.trainingTheme || "N/A",
      trainingDates: participant.trainingDates || "N/A",
      organization: participant.organization || "N/A",
      certificateIssuedAt: participant.certificateIssuedAt || new Date(),
    };

    // Add training details if available
    if (trainingDetails) {
      response.trainingLocation = trainingDetails.location || {};
      response.startDate = trainingDetails.startDate;
      response.endDate = trainingDetails.endDate;
    }

    res.json(response);
  } catch (error) {
    console.error("Certificate verification error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify certificate",
      error: error.message,
    });
  }
});

module.exports = router;
