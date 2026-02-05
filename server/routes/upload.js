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
 * Note: This endpoint is public to allow unauthenticated file uploads during registration
 */
router.post("/single", upload.single("file"), async (req, res) => {
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
        },
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
            },
          );

          uploadStream.end(file.buffer);
        }),
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

/**
 * Delete file from Cloudinary
 * DELETE /api/upload/delete
 */
router.delete("/delete", auth, async (req, res) => {
  try {
    const { publicId, resourceType = "image" } = req.body;

    if (!publicId) {
      return res.status(400).json({ message: "Public ID is required" });
    }

    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    if (result.result === "ok" || result.result === "not found") {
      res.json({
        success: true,
        message: "File deleted successfully",
        data: result,
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Failed to delete file",
        data: result,
      });
    }
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({
      success: false,
      message: "Delete failed",
      error: error.message,
    });
  }
});

/**
 * Delete multiple files from Cloudinary
 * DELETE /api/upload/delete-multiple
 */
router.delete("/delete-multiple", auth, async (req, res) => {
  try {
    const { publicIds, resourceType = "image" } = req.body;

    if (!publicIds || !Array.isArray(publicIds) || publicIds.length === 0) {
      return res.status(400).json({ message: "Public IDs array is required" });
    }

    // Delete all files from Cloudinary
    const deletePromises = publicIds.map((publicId) =>
      cloudinary.uploader.destroy(publicId, { resource_type: resourceType }),
    );

    const results = await Promise.all(deletePromises);

    const successCount = results.filter(
      (r) => r.result === "ok" || r.result === "not found",
    ).length;

    res.json({
      success: true,
      message: `${successCount}/${publicIds.length} file(s) deleted successfully`,
      data: results,
    });
  } catch (error) {
    console.error("Multiple delete error:", error);
    res.status(500).json({
      success: false,
      message: "Delete failed",
      error: error.message,
    });
  }
});

module.exports = router;
