# Disaster Management Training Portal

Real-Time Monitoring System for Disaster Management Training Programs across India

## Project Overview

This is a comprehensive digital platform for the National Disaster Management Authority (NDMA) to track, monitor, and analyze disaster management training programs in real-time. The system enables:

- **Real-time data entry** by training partners (SDMAs, NGOs, Training Institutes)
- **GIS-based visualization** of training locations across India
- **Analytics and reports** for impact assessment
- **Role-based access control** for different stakeholders
- **Certificate verification** for training credentials
- **Admin dashboard** for comprehensive monitoring and gap analysis

## Tech Stack

### Frontend

- **React 19** - UI framework with Vite bundler
- **React Router v6** - Client-side routing
- **Axios** - HTTP client for API calls
- **Leaflet** - Interactive GIS maps
- **Recharts** - Data visualization and charts
- **CSS Modules** - Scoped styling

### Backend

- **Node.js + Express** - REST API server
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication tokens
- **Bcryptjs** - Password hashing
- **Cloudinary** - File/image hosting (optional integration)

## Project Structure

```
v1/
├── frontend/                    # React + Vite application
│   ├── src/
│   │   ├── pages/              # Page components
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── PartnerDashboard.jsx
│   │   │   ├── AddTraining.jsx
│   │   │   └── ...
│   │   ├── components/         # Reusable components
│   │   │   └── Sidebar.jsx
│   │   ├── context/            # React Context
│   │   │   └── AuthContext.jsx
│   │   ├── utils/              # Utilities
│   │   │   └── api.js          # Axios API client
│   │   ├── styles/             # CSS Modules
│   │   │   ├── common.css
│   │   │   ├── Login.module.css
│   │   │   ├── Dashboard.module.css
│   │   │   └── ...
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── public/                 # Static assets
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
│
└── server/                      # Express API server
    ├── models/                 # Database schemas
    │   ├── User.js
    │   ├── Partner.js
    │   ├── TrainingEvent.js
    │   └── Certificate.js
    ├── routes/                 # API endpoints
    │   ├── auth.js
    │   ├── trainings.js
    │   ├── partners.js
    │   ├── analytics.js
    │   └── upload.js
    ├── middleware/             # Custom middleware
    │   └── auth.js
    ├── controllers/            # Business logic (optional)
    ├── index.js               # Main server file
    ├── package.json
    └── .env                   # Environment variables
```

## Installation & Setup

### Prerequisites

- Node.js 16+ and npm/yarn
- MongoDB (local or Atlas cloud)
- Git

### Backend Setup

```bash
cd server

# Install dependencies
npm install

# Create .env file and configure
# Update MongoDB URI, JWT_SECRET, CLOUDINARY credentials

# Start development server
npm run dev

# Or production server
npm start
```

**Backend runs on:** `http://localhost:4000`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Or build for production
npm run build
```

**Frontend runs on:** `http://localhost:3000`

## API Endpoints

### Authentication

- `POST /api/auth/register` - Partner registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token

### Training Events

- `GET /api/trainings` - List approved trainings (public)
- `GET /api/trainings/:id` - Get training details
- `POST /api/trainings` - Create new training (partner only)
- `PATCH /api/trainings/:id/status` - Update status (admin only)
- `DELETE /api/trainings/:id` - Delete training

### Partners

- `GET /api/partners` - List partners (admin only)
- `PATCH /api/partners/:id/approve` - Approve partner
- `PATCH /api/partners/:id/reject` - Reject partner

### Analytics

- `GET /api/analytics/dashboard` - Dashboard stats
- `GET /api/analytics/coverage` - Coverage report
- `GET /api/analytics/gaps` - Gap analysis

## Features

### Public Module

- **Home Page**: Landing page with impact counters and features overview
- **Map View**: Interactive map showing approved training locations
- **Certificate Verification**: Verify training certificates with certificate ID

### Partner Module

- **Dashboard**: Overview of partner's trainings and statistics
- **Add Training**: Submit new training events with location picker and file uploads
- **My Trainings**: View all submitted trainings with status tracking
- **Profile**: Manage organization details and credentials

### Admin Module

- **Dashboard**: National-level overview with heatmaps and activity feed
- **All Trainings**: Review and approve/reject training submissions
- **Partner Management**: Approve new partner registrations
- **Reports**: Generate comprehensive analytics and gap analysis reports

## Database Models

### User

- Email, password, role, organization reference, status

### Partner

- Organization details, contact info, documents, approval status

### TrainingEvent

- Title, theme, dates, location (with GIS coordinates), participants, status

### Certificate

- Certificate ID, trainee name, training reference, verification status

## Environment Variables

### Backend (.env)

```
PORT=4000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/disaster_training
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your_secure_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Frontend (.env)

```
VITE_API_BASE_URL=http://localhost:4000/api
```

## Authentication Flow

1. User registers/logs in with role (partner/admin)
2. Server validates credentials and returns JWT token
3. Frontend stores token in localStorage
4. Axios interceptor adds token to all API requests
5. Server validates token and authorizes requests based on role
6. Token refreshed automatically on expiry

## Data Flow

```
Partner submits training → Pending status → Admin review → Approved/Rejected
                                                              ↓
                                                    Visible on public map
                                                    Included in analytics
                                                    Available for cert generation
```

## Styling

- **Common CSS**: Global styles in `common.css` (variables, layout, components)
- **Page Styles**: Individual CSS modules for each page (scoped styling)
- **Design System**: Color variables, responsive grid system, reusable components

## Future Enhancements

- [ ] Mobile app using React Native
- [ ] Real-time notifications via Socket.IO
- [ ] Advanced map features (clustering, filters, heatmap)
- [ ] Export reports to PDF/Excel
- [ ] Integration with NDMA's existing systems
- [ ] Multi-language support
- [ ] Video training modules
- [ ] Mobile app for field data collection

## Development Tips

- Use `npm run dev` for both frontend and backend during development
- Check browser console and server logs for errors
- API calls are centralized in `frontend/src/utils/api.js`
- Authentication state is managed via React Context
- Protected routes enforce role-based access control

## Deployment

### Backend (Heroku/Render/Railway)

```bash
# Push code to git
# Connect to deployment platform
# Set environment variables
# Deploy
```

### Frontend (Vercel/Netlify)

```bash
# npm run build creates optimized dist/
# Deploy dist/ folder to Vercel/Netlify
```

## Support & Documentation

For issues or questions:

1. Check logs in browser console (frontend) or terminal (backend)
2. Verify environment variables are set correctly
3. Ensure MongoDB is running and accessible
4. Check network tab in browser dev tools for API errors

## License

Government of India - National Disaster Management Authority (NDMA)

---

**Created for Capacity Building & Training Division, NDMA**
Real-Time Monitoring System for Disaster Management Training Programs
