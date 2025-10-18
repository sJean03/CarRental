# RentEase PH - Car Rental System

A modern car rental fleet management system for the Philippines.

## 🎯 Project Overview

**RentEase PH** is a platform where:
- Vehicle owners lease their cars to RentEase
- RentEase manages all operations and bookings
- Customers can instantly book and rent vehicles
- Payments via Cash or GCash

## 💼 Business Model

- **Owner Payment:** Percentage share (60-65% to owner, 35-40% to RentEase)
- **Customer Deposits:** 20% required upfront
- **Late Fees:** Hourly rate (₱180-₱250/hour)
- **Branches:** Manila, Makati, Quezon City

## 🛠️ Tech Stack

- **Frontend:** Next.js 14+ (App Router), shadcn/ui, Tailwind CSS
- **Backend:** Node.js 20, Express.js
- **Database:** PostgreSQL 15
- **Cache:** Redis 7
- **Containerization:** Docker & Docker Compose

## 📂 Project Structure

```
rentease-ph/
├── backend/          # Node.js API
├── frontend/         # Next.js app
├── database/         # SQL schemas and migrations
│   └── init.sql      # Initial database setup
├── docs/             # Documentation
├── nginx/            # Reverse proxy (optional)
├── docker-compose.yml
├── .gitignore
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js v20.x
- Docker v28.x
- Docker Compose
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd rentease-ph
   ```

2. **Start the database**
   ```bash
   docker-compose up -d postgres redis
   ```

3. **Verify database is running**
   ```bash
   docker-compose ps
   docker-compose logs postgres
   ```

4. **Connect to database** (optional)
   ```bash
   docker exec -it rentease-db psql -U rentease -d rentease_ph
   ```

### Database Access

- **Host:** localhost
- **Port:** 5432
- **Database:** rentease_ph
- **User:** rentease
- **Password:** rentease123

### Redis Access

- **Host:** localhost
- **Port:** 6379

## 📊 Database Schema

The database includes:
- 15 tables covering all business operations
- Automated triggers for booking references, deposits, late fees
- Sample data for immediate testing
- Full documentation in `docs/database-schema.md`

### Sample Accounts

**Admin:**
- Email: admin@rentease.ph
- Password: admin123

**Staff:**
- Email: staff@rentease.ph
- Password: admin123

⚠️ **Change these passwords in production!**

## 🔧 Development

### Backend (Coming Soon)
```bash
cd backend
npm install
npm run dev
```

### Frontend (Coming Soon)
```bash
cd frontend
npm install
npm run dev
```

## 📝 Documentation

- [Database Schema](docs/database-schema.md) - Complete database structure
- API Documentation - Coming soon
- User Guide - Coming soon

## 🧪 Testing

### Test Database Connection
```bash
# Using psql
docker exec -it rentease-db psql -U rentease -d rentease_ph -c "SELECT * FROM locations;"

# Should show 3 branches: Manila, Makati, QC
```

### View Sample Data
```bash
# See sample vehicles
docker exec -it rentease-db psql -U rentease -d rentease_ph -c "SELECT make, model, license_plate, daily_rate FROM vehicles;"

# See vehicle owners
docker exec -it rentease-db psql -U rentease -d rentease_ph -c "SELECT first_name, last_name, percentage_share FROM vehicle_owners;"
```

## 🗂️ Database Management

### Backup Database
```bash
docker exec rentease-db pg_dump -U rentease rentease_ph > backup.sql
```

### Restore Database
```bash
cat backup.sql | docker exec -i rentease-db psql -U rentease rentease_ph
```

### Reset Database
```bash
docker-compose down -v
docker-compose up -d postgres redis
```

## 🚦 Project Status

- [x] Database schema designed
- [x] Docker setup complete
- [x] Sample data loaded
- [ ] Backend API (In Progress)
- [ ] Frontend UI (In Progress)
- [ ] Authentication
- [ ] Booking system
- [ ] Payment integration
- [ ] GPS tracking (Optional)

## 👥 Team

- Developers: //
- Project Type: Student Project

## 📄 License

This is a student project for educational purposes.

## 🤝 Contributing

This is a student project. Not accepting contributions at this time.

---

**Built with ❤️ in the Philippines 🇵🇭**