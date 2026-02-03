# NDMA Disaster Management Training Portal - Complete Project Details

**Version:** v1.0 | **Status:** ✅ Production Ready | **Last Updated:** Feb 2026

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [System Architecture](#system-architecture)
4. [Features & Modules](#features--modules)
5. [User Roles & Workflows](#user-roles--workflows)
6. [Database Schema](#database-schema)
7. [API Endpoints](#api-endpoints)
8. [Setup & Installation](#setup--installation)
9. [Project Statistics](#project-statistics)
10. [Security Implementation](#security-implementation)

---

## Project Overview

A comprehensive digital platform for the **National Disaster Management Authority (NDMA)** to track, monitor, and analyze disaster management training programs in real-time across India.

### Core Objectives

✅ Real-time data entry by training partners (SDMAs, NGOs, Training Institutes)  
✅ GIS-based visualization of training locations across India  
✅ Analytics and reports for impact assessment  
✅ Role-based access control for different stakeholders  
✅ Certificate verification for training credentials  
✅ Admin dashboard for comprehensive monitoring and gap analysis

---

## Technology Stack

### Frontend

| Technology       | Purpose              | Version   |
| ---------------- | -------------------- | --------- |
| **React**        | UI Framework         | 19.x      |
| **Vite**         | Build Tool           | 7.x       |
| **React Router** | Client-side Routing  | v6        |
| **Axios**        | HTTP Client          | 1.6.2     |
| **Leaflet**      | Interactive GIS Maps | 1.9.4     |
| **Recharts**     | Data Visualization   | Latest    |
| **react-icons**  | Icon Library         | 20+ icons |
| **CSS Modules**  | Scoped Styling       | Native    |

**UI/UX Features:**

- Responsive design (mobile, tablet, desktop)
- Interactive charts and maps
- Form validation
- Drag-and-drop file uploads
- Real-time notifications

### Backend

| Technology     | Purpose              | Version      |
| -------------- | -------------------- | ------------ |
| **Node.js**    | Runtime Environment  | 16+          |
| **Express**    | Web Framework        | 5.2.1        |
| **MongoDB**    | NoSQL Database       | 5.x+         |
| **Mongoose**   | ODM                  | Latest       |
| **JWT**        | Authentication       | jsonwebtoken |
| **bcryptjs**   | Password Hashing     | 2.4.3+       |
| **Cloudinary** | File Hosting         | CDN-based    |
| **Multer**     | File Upload Handling | 1.4.5+       |

**Backend Features:**

- RESTful API architecture
- JWT authentication (7-day expiry)
- Password hashing with salt rounds
- Role-based access control
- Error handling middleware
- CORS enabled
- Pagination support
- Database indexing

### Infrastructure

- **Frontend Hosting:** Vercel / Netlify / AWS S3 + CloudFront
- **Backend Hosting:** Heroku / Railway / AWS EC2
- **Database:** MongoDB Atlas (cloud)
- **File Storage:** Cloudinary CDN
- **Version Control:** Git / GitHub

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Public     │  │   Partner    │  │    Admin     │       │
│  │   Module     │  │   Module     │  │   Module     │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│         │                 │                 │                │
│         └────────────────┬────────────────┘                │
│                          │                                   │
│         ┌────────────────v────────────────┐                 │
│         │    React Router + Auth Context  │                 │
│         │    State Management             │                 │
│         └────────────────┬────────────────┘                 │
└────────────────────────┬─────────────────────────────────────┘
                         │
                 ┌───────v────────┐
                 │   Axios Client  │
                 │   (API Layer)   │
                 └───────┬────────┘
                         │
┌────────────────────────v─────────────────────────────────────┐
│              Backend (Express + Node.js)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  Auth Route  │  │ Training API │  │ Partner API  │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│         │                 │                 │                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  Analytics   │  │   Upload     │  │ Certificate  │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│         │                 │                 │                │
│         └────────────────┬────────────────┘                │
│                          │                                   │
│         ┌────────────────v────────────────┐                 │
│         │  Middleware (Auth, Error)       │                 │
│         └────────────────┬────────────────┘                 │
└────────────────────────┬─────────────────────────────────────┘
                         │
        ┌────────────────┴────────────────┐
        │                                 │
  ┌─────v────────┐            ┌──────────v──────┐
  │  MongoDB     │            │   Cloudinary    │
  │   Database   │            │    File Storage │
  └──────────────┘            └─────────────────┘
```

---

## Features & Modules

### 1. **Public Module** (Unauthenticated Users)

#### Home Page (`Home.jsx`)

- **Hero Section:** Landing introduction with CTAs
- **Live Impact Counters:** Animated statistics
  - 50K+ Volunteers trained
  - 1,250+ Trainings conducted
  - 28 States covered
- **Features Showcase:** 6 highlight cards
  - GIS-Based Visualization
  - Advanced Analytics
  - Secure & Verified
  - Real-Time Data Entry
  - Certificate Management
  - Instant Notifications
- **Latest News:** Recent training announcements
- **Footer:** Government links and resources

#### Map View (`Calendar.jsx` / Map Integration)

- Interactive Leaflet map showing training locations
- Color-coded markers by training status
- Location search and filters
- Training details popup
- Coverage heatmap

#### Certificate Verification (`VerifyCertificate.jsx`)

- Search by Certificate ID
- Display verified certificate details
- Trainee information
- Training confirmation
- Timestamp verification

#### Resources Page

- Training materials library
- Download guides and documents
- FAQs
- Contact information

---

### 2. **Partner Module** (Authenticated Partners)

#### Partner Dashboard (`PartnerDashboard.jsx`)

- **Overview Statistics:**
  - Total trainings conducted
  - Participants trained
  - Trainings pending approval
  - Recent activities
- **Interactive Map:**
  - View all partner trainings on map
  - Filter by training theme/status
  - Color-coded location markers
- **Recent Trainings Table:**
  - Status indicators
  - Quick actions (view, edit, delete)
- **Performance Metrics:**
  - Training completion rate
  - Participant engagement

#### Add Training (`AddTraining.jsx`)

- Comprehensive form with sections:
  - **Event Details:** Title, theme, dates
  - **Location Information:** State, district, city, pincode, coordinates
  - **Interactive Map Picker:** Click to set coordinates
  - **Resource Person Details:** Name, email (up to 3)
  - **Uploads:**
    - Event photos/videos (multiple)
    - Participant list (CSV/Excel)
  - **Trainee/Participant Details:**
    - Manual entry in tabular format
    - Add/Edit/Remove participants
    - Aadhaar validation (12 digits)
    - Email & phone validation
- **File Upload:**
  - Drag-and-drop support
  - Cloudinary integration
  - Real-time progress

#### Edit Training (`EditTraining.jsx`)

- Full edit capabilities
- Load existing data
- Modify all fields
- Update participants
- Re-upload files
- Delete individual files with Cloudinary cleanup

#### My Trainings (`MyTrainings.jsx`)

- Table view of all partner trainings
- **Columns:**
  - Training title & theme
  - Dates
  - Location (state/district)
  - Participants count
  - Status badge (Pending, Approved, Rejected)
- **Features:**
  - Search functionality
  - Pagination (10 items/page)
  - Status-based filtering
  - Quick actions (view, edit, delete)
  - Rejection reason display

#### View Training (`ViewTraining.jsx`)

- Read-only training details
- Display all information
- View uploaded files/photos
- Participant list
- Training status with approval/rejection reason

#### Profile (`Profile.jsx`)

- **Organization Details:**
  - Name, type, registration details
  - Contact person
  - Phone/email
  - Address
- **Credentials:**
  - Documents
  - Certifications
- **Account Management:**
  - Change password
  - Edit profile
  - Account settings

#### Reports (`PartnerReports.jsx`)

- **Multiple Report Types:**
  - Training summary statistics
  - Participant demographics
  - Location coverage analysis
  - Timeline charts
  - Performance metrics
- **Data Visualization:**
  - Line charts (training trends)
  - Bar charts (participant breakdown)
  - Pie charts (theme distribution)
  - Geographic heatmaps
- **Export Functionality:**
  - CSV export
  - PDF reports
  - Date range filtering

---

### 3. **Admin Module** (Administrators)

#### Admin Dashboard

- **National Overview:**
  - Total trainings, participants, states covered
  - Pending approvals count
  - Recent activity feed
- **Interactive Heatmap:**
  - Training density by region
  - State-wise analysis
  - Gap identification
- **Approval Queue:**
  - Pending trainings
  - Partner verification requests
  - Quick approve/reject actions

#### All Trainings

- View all trainings (all partners)
- **Admin Actions:**
  - Approve/Reject trainings
  - Add rejection reason
  - View detailed information
- **Filters:**
  - By status (pending, approved, rejected)
  - By partner
  - By date range
  - By location

#### Partner Management

- **Partner Listing:**
  - Organization details
  - Registration status
  - Contact information
- **Admin Actions:**
  - Approve new partners
  - Reject with reason
  - View partner statistics
  - Suspend/Deactivate

#### Analytics & Reports

- **Comprehensive Analytics:**
  - Training trends over time
  - Geographic coverage analysis
  - Participant demographics
  - Theme-wise breakdown
  - Performance metrics
- **Gap Analysis:**
  - Identify under-trained states
  - Theme coverage gaps
  - Capacity planning insights
- **Export & Reporting:**
  - Generate PDF reports
  - CSV data export
  - Scheduled reports

---

## User Roles & Workflows

### User Roles

```
┌─────────────────────────────────────────────────────┐
│            USER ROLES & PERMISSIONS                 │
├─────────────────────────────────────────────────────┤
│                                                      │
│  PUBLIC (Unauthenticated)                           │
│  └─ View Home, Map, Verify Certificates             │
│     Browse Resources                                │
│                                                      │
│  PARTNER (Authenticated Training Organization)      │
│  └─ Dashboard, Add/Edit/View Trainings             │
│     Upload Files, Manage Participants               │
│     View Reports                                    │
│                                                      │
│  ADMIN (System Administrator)                       │
│  └─ View All Trainings                              │
│     Approve/Reject Trainings                        │
│     Manage Partners                                 │
│     View Analytics & Reports                        │
│     System Configuration                            │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### User Workflows

#### Partner Workflow

```
1. Register Organization
   ↓
2. Await Admin Approval
   ↓
3. Login to Dashboard
   ↓
4. Add Training Event
   ├─ Fill details
   ├─ Select location on map
   ├─ Upload files
   └─ Add participants
   ↓
5. Submit for Approval
   ↓
6. Wait for Admin Review
   ├─ Approved → Listed on Public Map
   └─ Rejected → Show reason, allow resubmission
   ↓
7. View Reports & Analytics
```

#### Admin Workflow

```
1. Login to Admin Dashboard
   ↓
2. Review Pending Trainings
   ├─ Approve → Add to public listings
   └─ Reject → Send feedback to partner
   ↓
3. Manage Partner Approvals
   ├─ Review applications
   ├─ Approve organizations
   └─ Reject with feedback
   ↓
4. Monitor Analytics
   ├─ Track coverage
   ├─ Identify gaps
   └─ Generate reports
   ↓
5. Manage System
   ├─ User management
   ├─ Configure settings
   └─ Monitor performance
```

#### Public User Workflow

```
1. Visit Portal Home
   ↓
2. View Live Impact Stats
   ↓
3. Browse Training Map
   ├─ Zoom to region
   ├─ Click location
   └─ View details
   ↓
4. Verify Certificate (Optional)
   ├─ Enter certificate ID
   └─ View details
   ↓
5. Register as Partner (Optional)
   └─ Start training organization
```

---

## Database Schema

### User Model

```javascript
{
  _id: ObjectId,
  email: String (unique),
  password: String (hashed),
  role: String (enum: "admin", "partner", "public"),
  organizationName: String,
  phone: String,
  status: String (enum: "active", "inactive"),
  partnerId: ObjectId (ref: Partner),
  createdAt: Date,
  approvedAt: Date,
  approvedBy: ObjectId
}
```

### Partner Model

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  organizationName: String,
  organizationType: String (SDMA, NGO, Training Institute, etc.),
  contactPerson: String,
  phone: String,
  email: String,
  address: String,
  district: String,
  state: String,
  registrationNumber: String,
  documents: [{
    filename: String,
    url: String
  }],
  status: String (enum: "pending", "approved", "rejected"),
  rejectionReason: String,
  createdAt: Date,
  approvedAt: Date,
  approvedBy: ObjectId
}
```

### TrainingEvent Model

```javascript
{
  _id: ObjectId,
  title: String,
  theme: String (enum: Flood, Earthquake, Cyclone, etc.),
  startDate: Date,
  endDate: Date,
  location: {
    state: String,
    district: String,
    city: String,
    pincode: String,
    latitude: Number,
    longitude: Number
  },
  trainerName: String,
  trainerEmail: String,
  resourcePersons: [{
    name: String,
    email: String
  }],
  participants: [{
    fullName: String,
    aadhaarNumber: String,
    email: String,
    phone: String
  }],
  participantsCount: Number,
  photos: [{
    filename: String,
    url: String
  }],
  attendanceSheet: {
    filename: String,
    url: String
  },
  status: String (enum: "pending", "approved", "rejected"),
  rejectionReason: String,
  partnerId: ObjectId (ref: Partner),
  createdAt: Date,
  approvedAt: Date,
  approvedBy: ObjectId
}
```

### Certificate Model

```javascript
{
  _id: ObjectId,
  certificateId: String (unique),
  traineeName: String,
  aadhaarNumber: String,
  trainingId: ObjectId (ref: TrainingEvent),
  trainingTitle: String,
  trainingTheme: String,
  trainingDate: {
    start: Date,
    end: Date
  },
  organization: String,
  issued: Boolean (default: true),
  verifiedAt: Date,
  createdAt: Date
}
```

---

## API Endpoints

### Authentication Routes (`/api/auth`)

| Method | Endpoint         | Description       | Auth |
| ------ | ---------------- | ----------------- | ---- |
| POST   | `/auth/register` | Register partner  | No   |
| POST   | `/auth/login`    | Login user        | No   |
| POST   | `/auth/refresh`  | Refresh JWT token | Yes  |

### Training Routes (`/api/trainings`)

| Method | Endpoint                | Description          | Auth | Role                 |
| ------ | ----------------------- | -------------------- | ---- | -------------------- |
| GET    | `/trainings`            | List trainings       | No   | Public/Partner/Admin |
| GET    | `/trainings/:id`        | Get training details | No   | Public/Partner/Admin |
| POST   | `/trainings`            | Create training      | Yes  | Partner              |
| PUT    | `/trainings/:id`        | Update training      | Yes  | Partner (owner)      |
| DELETE | `/trainings/:id`        | Delete training      | Yes  | Partner (owner)      |
| PATCH  | `/trainings/:id/status` | Update status        | Yes  | Admin                |

### Partner Routes (`/api/partners`)

| Method | Endpoint                | Description         | Auth | Role                 |
| ------ | ----------------------- | ------------------- | ---- | -------------------- |
| GET    | `/partners`             | List partners       | Yes  | Admin                |
| GET    | `/partners/:id`         | Get partner details | Yes  | Admin/Partner (self) |
| POST   | `/partners`             | Create partner      | Yes  | Partner              |
| PUT    | `/partners/:id`         | Update partner      | Yes  | Partner (self)       |
| PATCH  | `/partners/:id/approve` | Approve partner     | Yes  | Admin                |
| PATCH  | `/partners/:id/reject`  | Reject partner      | Yes  | Admin                |

### Analytics Routes (`/api/analytics`)

| Method | Endpoint               | Description     | Auth | Role          |
| ------ | ---------------------- | --------------- | ---- | ------------- |
| GET    | `/analytics/dashboard` | Dashboard stats | Yes  | Admin/Partner |
| GET    | `/analytics/coverage`  | Coverage report | Yes  | Admin         |
| GET    | `/analytics/gaps`      | Gap analysis    | Yes  | Admin         |

### Upload Routes (`/api/upload`)

| Method | Endpoint                  | Description                 | Auth |
| ------ | ------------------------- | --------------------------- | ---- |
| POST   | `/upload/single`          | Upload single file          | Yes  |
| POST   | `/upload/multiple`        | Upload multiple files       | Yes  |
| DELETE | `/upload/delete`          | Delete file from Cloudinary | Yes  |
| DELETE | `/upload/delete-multiple` | Delete multiple files       | Yes  |

### Certificate Routes (`/api/certificates`)

| Method | Endpoint                        | Description        | Auth |
| ------ | ------------------------------- | ------------------ | ---- |
| GET    | `/certificates/verify/:aadhaar` | Verify certificate | No   |

---

## Setup & Installation

### Prerequisites

- Node.js 16+
- MongoDB (local or Atlas)
- Git
- NPM or Yarn

### Backend Setup

```bash
# Clone repository
git clone <repo-url>
cd ndma/server

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
MONGODB_URI=mongodb://localhost:27017/disaster_training
JWT_SECRET=your_secret_key_here_min_32_chars
PORT=4000
NODE_ENV=development
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
EOF

# Start development server
npm run dev

# Or start production server
npm start
```

**Backend runs on:** `http://localhost:4000`

### Frontend Setup

```bash
cd ndma/frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Or build for production
npm run build
npm run preview
```

**Frontend runs on:** `http://localhost:3000`

### Database Seeding (Optional)

```bash
# Seed with dummy data
node server/seed.js

# Creates:
# - 2 partners
# - 3 trainings
# - Test accounts
```

### Test Accounts

| Role      | Email                | Password    |
| --------- | -------------------- | ----------- |
| Admin     | admin@example.com    | admin123    |
| Partner   | partner@example.com  | password123 |
| Partner 2 | partner2@example.com | password123 |

---

## Project Statistics

### Code Metrics

| Metric              | Value |
| ------------------- | ----- |
| Total Files         | 100+  |
| Lines of Code       | 5000+ |
| Frontend Components | 15+   |
| Backend Routes      | 15+   |
| CSS Files           | 10+   |
| Database Models     | 4     |
| API Endpoints       | 20+   |
| Pages/Views         | 12    |

### Frontend Breakdown

| Category      | Count |
| ------------- | ----- |
| Pages         | 8     |
| Components    | 4     |
| Context/Hooks | 1     |
| CSS Modules   | 10    |
| Utils         | 2     |

### Backend Breakdown

| Category    | Count |
| ----------- | ----- |
| Routes      | 6     |
| Models      | 4     |
| Middleware  | 2     |
| Controllers | 5+    |
| Utilities   | 3     |

---

## Security Implementation

### Authentication & Authorization

✅ **JWT Tokens**

- 7-day expiry
- Refresh token support
- Secure header transmission

✅ **Password Security**

- bcryptjs hashing (10 salt rounds)
- No plaintext storage
- Minimum complexity requirements

✅ **Role-Based Access Control**

- Endpoint-level authorization
- Role validation middleware
- Resource ownership verification

### Data Protection

✅ **Input Validation**

- Email format validation
- Aadhaar number validation (12 digits)
- Phone number validation (10 digits)
- File type restrictions

✅ **Database Security**

- Indexed queries for performance
- Parameterized queries (Mongoose)
- User data encryption ready

✅ **File Security**

- Cloudinary CDN storage
- File type validation
- Size limits (30MB max)
- Automatic cleanup on deletion

### API Security

✅ **CORS Configuration**

- Restricted origins (development)
- Production domain whitelist

✅ **Error Handling**

- Generic error messages
- No stack trace exposure
- Proper HTTP status codes

✅ **Rate Limiting** (Recommended)

- Implement request throttling
- DDoS protection

---

## Performance Optimizations

✅ Database indexing on frequently queried fields  
✅ Pagination for large datasets  
✅ Lazy loading for frontend components  
✅ CSS Modules for scoped styling  
✅ Cloudinary CDN for file delivery  
✅ React Router code splitting

---

## Production Deployment

### Backend Deployment

**Option 1: Heroku**

```bash
heroku login
git push heroku main
```

**Option 2: Railway**

- Connect GitHub repo
- Set environment variables
- Deploy with one click

**Option 3: AWS EC2**

- Use PM2 for process management
- Configure reverse proxy (Nginx)
- SSL certificate (Let's Encrypt)

### Frontend Deployment

**Vercel (Recommended)**

```bash
npm install -g vercel
vercel
```

**Netlify**

- Connect GitHub repo
- Build command: `npm run build`
- Publish directory: `dist`

**AWS S3 + CloudFront**

```bash
npm run build
aws s3 sync dist/ s3://your-bucket
```

### Environment Variables (Production)

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
JWT_SECRET=strong_secret_key_min_32_chars
PORT=4000
CLOUDINARY_CLOUD_NAME=your_cloud
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
FRONTEND_URL=https://yourdomain.com
```

---

## Troubleshooting

### Common Issues

**MongoDB Connection Failed**

- Ensure MongoDB is running: `mongod`
- Check connection string in .env
- Verify network access (Atlas)

**CORS Errors**

- Normal in development (different ports)
- Configure CORS_ORIGIN in .env
- Add frontend URL to whitelist

**File Upload Issues**

- Check Cloudinary credentials
- Verify file size < 30MB
- Check file type restrictions

**JWT Token Expired**

- Clear localStorage
- Refresh page to get new token
- Check server time sync

---

## Future Enhancements

📋 Mobile app (React Native)  
📊 Advanced analytics dashboard  
🔔 Real-time notifications (WebSockets)  
📧 Email notifications  
🎓 Certificate generation (PDF)  
🗺️ Advanced GIS features  
🔍 Full-text search  
📱 SMS notifications  
🤖 AI-powered gap analysis

---

## Support & Documentation

- **Full Documentation:** See `README.md`
- **Quick Start:** See `QUICKSTART.md`
- **API Reference:** See `API_DOCS.md` (if available)
- **Architecture:** See diagrams above

---

## Status: ✅ Production Ready

**Version:** 1.0  
**Last Updated:** February 2026  
**Maintained By:** Development Team  
**License:** Government of India (NDMA)

---

**Happy Coding! 🚀**
