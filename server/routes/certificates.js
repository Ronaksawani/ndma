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

    // Use Participant model to find consolidated participant document
    const Participant = require("../models/Participant");
    const participant = await Participant.findOne({ aadhaarNumber }).lean();

    if (!participant) {
      return res.status(404).json({
        success: false,
        verified: false,
        message: "Certificate not found. Please check the Aadhaar number.",
      });
    }

    // Collect all trainings that have certificates
    const trainingsWithCert = (participant.trainings || []).filter(
      (t) => t.certificateIssued,
    );

    // Enrich with training event details where possible
    const TrainingEvent = require("../models/TrainingEvent");
    const looksLikeObjectId = (value) =>
      typeof value === "string" && /^[a-fA-F0-9]{24}$/.test(value);

    const enriched = await Promise.all(
      trainingsWithCert.map(async (t) => {
        let trainingDetails = null;
        if (t.trainingId) {
          trainingDetails = await TrainingEvent.findById(t.trainingId)
            .populate("partnerId", "organizationName name")
            .lean();
        }

        const organizationName =
          trainingDetails?.partnerId?.organizationName ||
          trainingDetails?.partnerId?.name ||
          (looksLikeObjectId(t.organization) ? null : t.organization) ||
          "N/A";

        return {
          trainingTitle:
            t.trainingTitle ||
            (trainingDetails ? trainingDetails.title : "N/A"),
          trainingTheme:
            t.trainingTheme ||
            (trainingDetails ? trainingDetails.theme : "N/A"),
          trainingDates:
            t.trainingDates ||
            (trainingDetails
              ? {
                  start: trainingDetails.startDate,
                  end: trainingDetails.endDate,
                }
              : {}),
          organization: organizationName,
          certificateIssuedAt: t.certificateIssuedAt,
          certificateUrl: t.certificateUrl,
          trainingLocation: trainingDetails ? trainingDetails.location : {},
        };
      }),
    );

    res.json({
      success: true,
      verified: enriched.length > 0,
      aadhaarNumber: participant.aadhaarNumber,
      fullName: participant.fullName,
      email: participant.email,
      phone: participant.phone,
      certificates: enriched,
    });
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
