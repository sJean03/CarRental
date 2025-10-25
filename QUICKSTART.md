# RentEase - Quick Start Guide

## For Junior Developers

This guide will get you up and running in **under 2 minutes**.

## Prerequisites

- Docker Desktop installed and running
- That's it! (No Node.js, npm, or manual setup needed)

## Start the Application

### 1. Clone the Repository (if not already done)

```bash
git clone <repository-url>
cd CarRental
```

### 2. Start Everything with One Command

```bash
docker-compose up -d
```

**What this does:**
- Starts PostgreSQL database
- Starts Redis cache
- Builds and starts the backend API
- Builds and starts the frontend app

**Wait time:** 2-3 minutes for first build

### 3. Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **Health Check:** http://localhost:5000/health

## Test the Application

### Login as Admin

1. Go to http://localhost:3000/login
2. Email: `admin@rentease.ph`
3. Password: `admin123`

### Create a Test Account

1. Go to http://localhost:3000/register
2. Fill in the form
3. Select role: **Owner** (to list cars) or **Customer** (to rent cars)
4. Register and login

## View Logs

**All services:**
```bash
docker-compose logs -f
```

**Specific service:**
```bash
# Backend logs
docker-compose logs -f backend

# Frontend logs
docker-compose logs -f frontend

# Database logs
docker-compose logs -f postgres
```

## Stop the Application

```bash
docker-compose down
```

## Reset Everything (Clean Start)

If you want to reset the database and start fresh:

```bash
docker-compose down -v
docker-compose up -d
```

## Troubleshooting

### Port Already in Use

If you see an error like "port 5000 is already allocated":

```bash
# Stop all services
docker-compose down

# Check what's using the port
lsof -i :5000   # For backend
lsof -i :3000   # For frontend
lsof -i :5432   # For database

# Kill the process or change the port in docker-compose.yml
```

### Build Errors

```bash
# Rebuild from scratch
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Database Connection Error

```bash
# Check if database is running
docker-compose ps

# Restart database
docker-compose restart postgres

# View database logs
docker-compose logs postgres
```

## Development Workflow

### Option 1: Full Docker (Recommended for Testing)
```bash
docker-compose up -d
# Make changes to code
docker-compose restart backend  # Or frontend
```

### Option 2: Local Development (Faster for coding)

**1. Start database only:**
```bash
docker-compose -f docker-compose.db-only.yml up -d
```

**2. Run backend locally:**
```bash
cd backend
npm install
npm run dev
```

**3. Run frontend locally (in another terminal):**
```bash
cd frontend
npm install
npm run dev
```

## Default Credentials

**Admin Account:**
- Email: `admin@rentease.ph`
- Password: `admin123`

**Database:**
- Host: `localhost`
- Port: `5432`
- Database: `rentease_ph`
- User: `rentease`
- Password: `rentease123`

## Next Steps

1. Read [TESTING.md](./TESTING.md) for complete testing checklist
2. Read [README.md](./README.md) for full documentation
3. Check [backend/src/routes](./backend/src/routes) for API endpoints
4. Check [frontend/src/app](./frontend/src/app) for pages

## Quick Commands Reference

```bash
# Start everything
docker-compose up -d

# Stop everything
docker-compose down

# View logs
docker-compose logs -f

# Restart a service
docker-compose restart backend

# Rebuild and restart
docker-compose up -d --build

# Reset database
docker-compose down -v && docker-compose up -d

# Check service status
docker-compose ps
```

## Need Help?

- Check logs: `docker-compose logs -f`
- Check service health: `docker-compose ps`
- Check backend health: http://localhost:5000/health
- Review [TESTING.md](./TESTING.md) for detailed testing guide
- Review [README.md](./README.md) for API documentation

## Happy Coding! 🚗
