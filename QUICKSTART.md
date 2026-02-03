# Quick Start Guide

## Prerequisites

- Node.js 16+ | MongoDB (local or Atlas) | Git

## Setup (5 minutes)

### 1. Backend

```bash
cd server
npm install
# Edit .env with MongoDB URI
npm run dev  # runs on http://localhost:4000
```

### 2. Frontend (new terminal)

```bash
cd frontend
npm install
npm run dev  # runs on http://localhost:3000
```

### 3. Seed Database (optional)

```bash
node server/seed.js
```

## Test Accounts

**Partner:** partner@example.com / password123  
**Admin:** admin@example.com / admin123

## Routes

| Route                        | Purpose       | Role    |
| ---------------------------- | ------------- | ------- |
| `/`                          | Home          | Public  |
| `/login`                     | Login         | Public  |
| `/register`                  | Registration  | Public  |
| `/partner/dashboard`         | Dashboard     | Partner |
| `/partner/add-training`      | Add Training  | Partner |
| `/partner/my-trainings`      | My Trainings  | Partner |
| `/partner/edit-training/:id` | Edit Training | Partner |
| `/partner/view-training/:id` | View Training | Partner |
| `/partner/profile`           | Profile       | Partner |

## Environment Variables (.env)

```
MONGODB_URI=mongodb://localhost:27017/disaster_training
JWT_SECRET=your_secret_key_123
PORT=4000
```

## Troubleshooting

**Cannot connect to MongoDB?**

- Ensure MongoDB is running: `mongod`
- Check connection string in .env

**CORS errors?**

- Normal - both run on different ports
- CORS middleware handles it

**Login fails?**

- Ensure user exists (run seed.js)
- Check password is correct

## Key Files

- `frontend/src/App.jsx` - Routes & auth
- `frontend/src/utils/api.js` - API client
- `frontend/src/context/AuthContext.jsx` - Auth state
- `server/index.js` - Server entry
- `server/seed.js` - Database seeder
- `.env` - Configuration

5. ✓ View on public map/dashboard
6. ✓ Run analytics queries
7. ✓ Export reports

## Production Deployment

### Environment Variables for Production

- Change `NODE_ENV=production`
- Use strong JWT_SECRET
- Use MongoDB Atlas connection
- Enable HTTPS
- Update FRONTEND_URL to production domain

### Deploy Backend

- Heroku: `git push heroku main`
- Railway/Render: Connect repo and deploy
- AWS/DigitalOcean: Use PM2 for process management

### Deploy Frontend

- Vercel: `npm run build` + push to GitHub
- Netlify: Connect GitHub repo
- AWS S3 + CloudFront: Upload dist/ files

## Support

For detailed documentation, see `README.md` in project root.

**Happy coding! 🚀**
