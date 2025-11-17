# Docker Setup Complete ✅

This document summarizes the Docker configuration created for RentEase.

## What Was Created

### 1. Docker Compose Files

#### `docker-compose.yml` (Complete Setup)
- **Purpose:** One-command setup for everything
- **Services:** PostgreSQL, Redis, Backend API, Frontend
- **Usage:** `docker-compose up -d`
- **Best for:** Testing, demos, junior developers

#### `docker-compose.db-only.yml` (Database Only)
- **Purpose:** Database services only for local development
- **Services:** PostgreSQL, Redis
- **Usage:** `docker-compose -f docker-compose.db-only.yml up -d`
- **Best for:** Active development with hot reloading

### 2. Dockerfiles

#### `backend/Dockerfile`
- Base: Node.js 18 Alpine
- Features:
  - Production dependencies only (`npm ci --only=production`)
  - Health check on `/health` endpoint
  - Wget installed for health checks
  - Optimized for small image size

#### `frontend/Dockerfile`
- Base: Node.js 18 Alpine
- Features:
  - Multi-stage build (deps → builder → runner)
  - Next.js standalone output
  - Non-root user (nextjs:nodejs)
  - Optimized production build

### 3. Docker Ignore Files

#### `backend/.dockerignore`
Excludes:
- node_modules
- .env
- .git
- Development files

#### `frontend/.dockerignore`
Excludes:
- node_modules
- .next
- .env*.local
- Development files

### 4. Configuration Updates

#### `backend/package.json`
- ✅ Fixed start script: `node src/server.js`
- ✅ Fixed dev script: `nodemon src/server.js`

#### `frontend/next.config.ts`
- ✅ Added `output: 'standalone'` for Docker optimization

### 5. Documentation

#### `QUICKSTART.md` (NEW)
- Quick 2-minute setup guide for junior developers
- One-command deployment
- Basic troubleshooting
- Default credentials

#### `README.md` (UPDATED)
- Added Quick Start section at the top
- Documented both docker-compose options
- Added Docker Files section
- Updated Project Structure

#### `TESTING.md` (UPDATED)
- Added Docker setup instructions
- Two testing approaches documented

## How to Use

### For Your Junior Developer

**Simplest approach:**
```bash
docker-compose up -d
```

Then access:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- Admin login: admin@rentease.ph / admin123

### For You (Development)

**Option A: Full Docker**
```bash
docker-compose up -d
# Make code changes
docker-compose restart backend  # or frontend
```

**Option B: Database only + Local dev**
```bash
# Terminal 1: Database
docker-compose -f docker-compose.db-only.yml up -d

# Terminal 2: Backend
cd backend
npm run dev

# Terminal 3: Frontend
cd frontend
npm run dev
```

## Environment Variables

All environment variables are configured in `docker-compose.yml`:

**Backend Environment:**
- Database connection (uses service name `postgres` instead of `localhost`)
- JWT secret
- Platform settings (2% fee, warehouse costs, etc.)
- Mock payment enabled

**Frontend Environment:**
- API URL: `http://localhost:5000/api`

## Service Dependencies

The docker-compose.yml includes health checks and dependencies:

```
postgres (healthcheck) → backend (healthcheck) → frontend
redis (healthcheck) ↗
```

- Backend waits for database to be healthy
- Frontend waits for backend to be healthy
- Ensures services start in correct order

## Ports

| Service  | Port | Access |
|----------|------|--------|
| Frontend | 3000 | http://localhost:3000 |
| Backend  | 5000 | http://localhost:5000 |
| PostgreSQL | 5432 | localhost:5432 |
| Redis    | 6379 | localhost:6379 |

## Volumes

**Persistent data volumes:**
- `postgres_data` - Database data persists between restarts
- `redis_data` - Cache data persists between restarts

**To reset database:**
```bash
docker-compose down -v
```

## Build Process

**First time:**
```bash
docker-compose up -d
# Takes 2-3 minutes to build both images
```

**Rebuild after code changes:**
```bash
docker-compose up -d --build
```

**Rebuild from scratch (no cache):**
```bash
docker-compose build --no-cache
docker-compose up -d
```

## Useful Commands

```bash
# Start all services
docker-compose up -d

# View logs (all services)
docker-compose logs -f

# View logs (specific service)
docker-compose logs -f backend
docker-compose logs -f frontend

# Check service status
docker-compose ps

# Restart a service
docker-compose restart backend

# Stop all services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v

# Rebuild and restart
docker-compose up -d --build
```

## Troubleshooting

### Port conflicts
If ports 3000, 5000, or 5432 are already in use:
```bash
# Find what's using the port
lsof -i :5000

# Or kill all and restart
docker-compose down
docker-compose up -d
```

### Build errors
```bash
# Clean rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Database connection errors
```bash
# Check if PostgreSQL is healthy
docker-compose ps

# View database logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

### Backend not starting
```bash
# Check backend logs
docker-compose logs backend

# Common issue: database not ready
# Solution: wait 10 seconds and check again
```

## Development Workflow

### Making Changes

**Backend code changes:**
```bash
# Edit code
docker-compose restart backend
# Or for live reload, use local dev mode
```

**Frontend code changes:**
```bash
# Edit code
docker-compose restart frontend
# Or for live reload, use local dev mode
```

**Database schema changes:**
```bash
# Edit database/init.sql
docker-compose down -v
docker-compose up -d
```

## Production Notes

⚠️ **Before deploying to production:**

1. Change JWT_SECRET in docker-compose.yml
2. Change database passwords
3. Set NODE_ENV=production
4. Use environment-specific .env files
5. Set up SSL/TLS
6. Configure proper CORS settings
7. Set up database backups

## Testing the Setup

**Quick health check:**
```bash
# Backend health
curl http://localhost:5000/health

# Should return:
# {"success":true,"message":"RentEase API is running",...}
```

**Full test:**
1. `docker-compose up -d`
2. Wait 1 minute
3. Open http://localhost:3000
4. Login as admin (admin@rentease.ph / admin123)
5. Navigate through the app

## Summary

✅ Complete Docker setup ready
✅ One-command deployment (`docker-compose up -d`)
✅ All services containerized
✅ Health checks configured
✅ Persistent data volumes
✅ Documentation updated
✅ Junior-friendly setup

Your junior developer can now start the entire application with a single command and start testing immediately!
