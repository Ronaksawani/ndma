const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const auth = require("../middleware/auth.js");

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer for memory storage (will be streamed to Cloudinary)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 30 * 1024 * 1024 }, // 30MB limit
});

/**
 * Upload single file to Cloudinary
 * POST /api/upload/single
 */
router.post("/single", auth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file provided" });
    }

    const { folder = "training-management" } = req.body;

    // Extract filename with extension preserved for Cloudinary
    const originalName = req.file.originalname;
    // Extract extension
    const extension = originalName.split(".").pop();
    const filename = originalName.replace(/\.[^/.]+$/, ""); // Filename without extension

    // Upload to Cloudinary - keep filename with extension for proper format detection
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          public_id: filename, // Use filename without extension as ID
          resource_type: "auto",
          format: extension, // Explicitly set the format/extension
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      uploadStream.end(req.file.buffer);
    });

    res.json({
      success: true,
      message: "File uploaded successfully",
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        size: result.bytes,
        resourceType: result.resource_type,
        filename: originalName,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      success: false,
      message: "Upload failed",
      error: error.message,
    });
  }
});

/**
 * Upload multiple files to Cloudinary
 * POST /api/upload/multiple
 */
router.post("/multiple", auth, upload.array("files", 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files provided" });
    }

    const { folder = "training-management" } = req.body;

    // Upload all files to Cloudinary
    const uploadPromises = req.files.map(
      (file, index) =>
        new Promise((resolve, reject) => {
          // Extract filename and extension
          const originalName = file.originalname;
          const extension = originalName.split(".").pop();
          const filename = originalName.replace(/\.[^/.]+$/, "");

          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: folder,
              public_id: filename, // Use filename without extension as ID
              resource_type: "auto",
              format: extension, // Explicitly set the format/extension
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );

          uploadStream.end(file.buffer);
        })
    );

    const results = await Promise.all(uploadPromises);

    res.json({
      success: true,
      message: `${results.length} file(s) uploaded successfully`,
      data: results.map((result, index) => ({
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        size: result.bytes,
        resourceType: result.resource_type,
        filename: req.files[index].originalname,
      })),
    });
  } catch (error) {
    console.error("Multiple upload error:", error);
    res.status(500).json({
      success: false,
      message: "Upload failed",
      error: error.message,
    });
  }
});

module.exports = router;
