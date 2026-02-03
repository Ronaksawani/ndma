# Cloudinary File Upload Integration Guide

## Setup Instructions

### 1. Create a Cloudinary Account

- Go to [Cloudinary.com](https://cloudinary.com) and sign up for a free account
- Verify your email

### 2. Get Your Cloud Credentials

- Navigate to your Dashboard
- Copy your **Cloud Name**
- Create an **Upload Preset**:
  - Go to Settings → Upload
  - Create a new unsigned upload preset (allows client-side uploads without API key)
  - Save the preset name

### 3. Update Configuration File

Edit [src/utils/cloudinary.js](src/utils/cloudinary.js) and replace:

```javascript
const CLOUDINARY_CLOUD_NAME = "your_cloud_name"; // Replace with your actual cloud name
const UPLOAD_PRESET = "your_upload_preset"; // Replace with your actual upload preset
```

Example:

```javascript
const CLOUDINARY_CLOUD_NAME = "dxyz1234";
const UPLOAD_PRESET = "training_uploads";
```

### 4. Optional: Server-Side Configuration

For production with API key protection, set environment variables in your backend `.env`:

```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Implementation Details

### File Upload Functions

#### `uploadToCloudinary(file, folder)`

Uploads a single file to Cloudinary

- **Parameters:**
  - `file`: File object to upload
  - `folder`: Optional folder path in Cloudinary (default: "training-management")
- **Returns:** Promise with upload result containing `url`, `publicId`, etc.

#### `uploadMultipleToCloudinary(files, folder)`

Uploads multiple files to Cloudinary

- **Parameters:**
  - `files`: Array of File objects
  - `folder`: Optional folder path
- **Returns:** Promise with array of upload results

### Integration Points

#### Partner Registration ([src/pages/Register.jsx](src/pages/Register.jsx))

- Uploads authorization PDF documents to `partner-documents` folder
- Stores `documentUrl` and `documentPublicId` in database
- Shows upload progress feedback

#### Training Event ([src/pages/AddTraining.jsx](src/pages/AddTraining.jsx))

- Uploads event photos/videos to `training-photos` folder
- Stores photo URLs as JSON array in database
- Handles multiple file uploads with progress tracking

## Folder Structure in Cloudinary

Files are organized in the following structure:

```
/partner-documents/     - Partner authorization documents
/training-photos/       - Training event photos and videos
```

## Error Handling

Both files include try-catch blocks that:

- Validate file uploads
- Provide user-friendly error messages
- Prevent form submission if uploads fail
- Show upload status feedback

## Testing the Integration

1. **Test Partner Registration:**

   - Navigate to Partner Registration page
   - Select a PDF file
   - Submit form
   - Verify document appears in Cloudinary dashboard

2. **Test Training Event Upload:**
   - Login as partner
   - Create new training event
   - Add multiple photos
   - Submit form
   - Verify photos in Cloudinary dashboard

## Security Considerations

### Current Setup (Development)

- Uses unsigned uploads (suitable for frontend-only uploads)
- No API key exposure required

### Production Recommendation

- Implement server-side validation
- Use signed uploads for additional security
- Store file deletion logs
- Implement rate limiting

## Troubleshooting

### "Upload failed" Error

- Verify Cloud Name is correct
- Check Upload Preset name matches exactly
- Ensure upload preset is in "Unsigned" mode
- Check browser console for CORS errors

### Missing Files in Dashboard

- Verify folder parameter in upload function
- Check Cloudinary dashboard for files in specific folders
- Ensure upload preset has correct settings

### Slow Upload Performance

- Consider compressing images before upload
- Implement progressive upload status
- Use CDN URL for faster delivery

## Additional Resources

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Upload API Guide](https://cloudinary.com/documentation/upload_widget)
- [React Integration Examples](https://cloudinary.com/documentation/react_integration)
