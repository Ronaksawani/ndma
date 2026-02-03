# Backend File Upload Setup Guide

## Overview

Files are now uploaded through your backend server to Cloudinary for enhanced security and control.

## Architecture

```
Frontend (Register.jsx / AddTraining.jsx)
    ↓ (POST file to backend)
Backend (/api/upload/single or /api/upload/multiple)
    ↓ (Stream to Cloudinary with credentials)
Cloudinary (Secure upload)
    ↓ (Return secure_url & public_id)
Backend (Response to frontend)
    ↓ (Frontend stores URLs in database)
```

## Backend Setup

### 1. Cloudinary Configuration in Backend

Your backend already has Cloudinary configured. The `.env` file should contain:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

These are used by the backend to securely upload files without exposing credentials to frontend.

### 2. Upload Endpoints

Two endpoints are available in `routes/upload.js`:

#### Single File Upload

```
POST /api/upload/single
Headers: Authorization: Bearer <token>
Body: FormData
  - file: File object
  - folder: "partner-documents" (optional)
```

Response:

```json
{
  "success": true,
  "data": {
    "url": "https://res.cloudinary.com/...",
    "publicId": "partner-documents/abc123",
    "format": "pdf",
    "size": 102400
  }
}
```

#### Multiple Files Upload

```
POST /api/upload/multiple
Headers: Authorization: Bearer <token>
Body: FormData
  - files: File[] (up to 10 files)
  - folder: "training-photos" (optional)
```

Response:

```json
{
  "success": true,
  "data": [
    {
      "url": "https://res.cloudinary.com/...",
      "publicId": "training-photos/photo1",
      "format": "jpg",
      "size": 512000
    },
    ...
  ]
}
```

## Frontend Integration

### API Utility (src/utils/api.js)

```javascript
export const uploadAPI = {
  uploadSingle: (file, folder = "training-management") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);
    return api.post("/upload/single", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  uploadMultiple: (files, folder = "training-management") => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });
    formData.append("folder", folder);
    return api.post("/upload/multiple", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};
```

### Partner Registration (Register.jsx)

```javascript
import { uploadAPI } from "../utils/api";

// In handleSubmit():
const uploadResponse = await uploadAPI.uploadSingle(file, "partner-documents");

const { url, publicId } = uploadResponse.data.data;
```

### Training Event (AddTraining.jsx)

```javascript
import { uploadAPI } from "../utils/api";

// In handleSubmit():
const uploadResponse = await uploadAPI.uploadMultiple(
  photos,
  "training-photos"
);

const photoUrls = uploadResponse.data.data.map((file) => ({
  url: file.url,
  publicId: file.publicId,
}));
```

## Folder Structure in Cloudinary

Files are organized by type:

```
partner-documents/    - Partner authorization documents
training-photos/      - Training event photos and videos
```

## Security Features

✅ **Credentials Hidden** - API key and secret only on backend
✅ **Authentication Required** - All uploads require valid JWT token
✅ **File Validation** - Backend validates file type and size
✅ **Audit Trail** - Uploads logged with user information
✅ **CDN Delivery** - Cloudinary serves files from nearest edge location

## Error Handling

### Common Errors

| Error                 | Cause                          | Solution                |
| --------------------- | ------------------------------ | ----------------------- |
| 401 Unauthorized      | Missing/invalid JWT token      | Login first             |
| 400 Bad Request       | No file in request             | Ensure file is attached |
| 413 Payload Too Large | File exceeds 100MB             | Reduce file size        |
| 500 Server Error      | Cloudinary credentials missing | Check .env file         |

## Testing

### Test Partner Registration Upload

1. Navigate to Partner Registration
2. Fill in all fields
3. Upload a PDF document
4. Submit form
5. Check Cloudinary Dashboard → Media Library → partner-documents

### Test Training Event Upload

1. Login as partner
2. Create new training event
3. Upload photos
4. Submit form
5. Check Cloudinary Dashboard → Media Library → training-photos

## Performance Tips

1. **Compress images before upload** - Reduces file size
2. **Show progress indicators** - Improves UX during upload
3. **Batch uploads** - Multiple files in one request
4. **Use CDN URLs** - Cloudinary serves optimized files globally

## Troubleshooting

### Files not appearing in Cloudinary Dashboard

- Check .env credentials are correct
- Verify upload endpoint is being called
- Check server logs for errors: `npm run dev` in server directory

### Upload timeout errors

- Increase server timeout settings
- Check file size isn't too large
- Verify network connection

### 401 Unauthorized errors

- Ensure JWT token is stored in localStorage
- Token may have expired - re-login
- Check API interceptor is adding Authorization header

## Next Steps

1. **Verify Cloudinary Credentials:**

   ```bash
   echo $CLOUDINARY_CLOUD_NAME  # Should return your cloud name
   ```

2. **Start the server:**

   ```bash
   cd server
   npm run dev
   ```

3. **Test file uploads** using the applications

4. **Monitor uploads** in Cloudinary Dashboard

## Related Files

- [Backend Upload Route](../../server/routes/upload.js)
- [Frontend API Utility](../../frontend/src/utils/api.js)
- [Partner Registration](../../frontend/src/pages/Register.jsx)
- [Training Event Form](../../frontend/src/pages/AddTraining.jsx)
