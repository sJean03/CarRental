# RentEase - P2P Car Rental Marketplace

A **complete** Turo-style peer-to-peer car rental platform built for the Philippines with **full database schema implementation**.

## ⚡ Quick Start

**For first-time setup, see [QUICKSTART.md](./QUICKSTART.md)**

```bash
# Start everything with one command
docker-compose up -d

# Access the app at http://localhost:3000
# Admin login: admin@rentease.ph / admin123
```

## 🚀 Complete Feature Set

### Authentication & User Management
- ✅ Multi-role authentication (Customer, Owner, Admin)
- ✅ JWT-based secure authentication
- ✅ Profile management with driver's license info
- ✅ Profile photo URL support
- ✅ Address management (multiple saved addresses)
- ✅ Email/password login

### Car Management (Owners)
- ✅ List cars with full details (make, model, year, category, specs)
- ✅ Image URLs support (multiple photos per car)
- ✅ Rental rules and descriptions
- ✅ Daily rate pricing
- ✅ Car availability calendar blocking
- ✅ Admin approval workflow (pending → approved → listed)
- ✅ Owner dashboard with car statistics
- ✅ Storage options (warehouse/owner delivers)

### Booking System
- ✅ Date range selection with calendar
- ✅ Automatic price calculation (2% platform fee)
- ✅ Payment plans (full payment or 12-month installment)
- ✅ Complete booking workflow with status tracking:
  - pending_payment → payment_confirmed → confirmed → active → returned → completed
- ✅ Owner confirmation required
- ✅ Cancellation with refund support
- ✅ Late return fee tracking
- ✅ Booking reference numbers (RE-YYYYMMDD-XXXXXX)
- ✅ Customer and owner booking views

### Payment System
- ✅ Mock payment processing (credit/debit card)
- ✅ Payment history tracking
- ✅ Installment payment support
- ✅ Refund processing (admin)
- ✅ Payment statistics for admin

### Owner Features
- ✅ **Owner payouts tracking** - View earnings breakdown
- ✅ **Business profile management** - Tax ID, business name
- ✅ **Banking information** - Bank account, payout preferences
- ✅ **Earnings dashboard** - Total/pending/paid earnings
- ✅ **Performance metrics** - Rating, response rate, total rentals
- ✅ **Car approval notifications**
- ✅ **Booking management** for owner's cars

### Customer Features
- ✅ Browse and search cars with advanced filters
- ✅ Car detail pages with full information
- ✅ Booking creation and management
- ✅ Payment processing
- ✅ Booking history and status tracking
- ✅ Damage reporting

### Admin Features
- ✅ Car listing approval/rejection
- ✅ Platform statistics (revenue, payments, bookings)
- ✅ Payment monitoring and refund processing
- ✅ Recent payments view
- ✅ Pending approvals management

### Notification System
- ✅ **Real-time notifications** (bell icon in navbar)
- ✅ Unread count badge
- ✅ Mark as read/unread
- ✅ Click to navigate to related items
- ✅ Auto-polling for new notifications
- ✅ Notification types: car_approved, booking_confirmed, payment_received, etc.

### Damage Reporting
- ✅ **Report damage** on bookings
- ✅ Photo URLs support for damage evidence
- ✅ Estimated cost tracking
- ✅ Damage status (reported → under_review → resolved)
- ✅ Resolution notes from admin/owner
- ✅ Damage deductions from payouts

### Location Management
- ✅ 3 default branches (Manila, Makati, Quezon City)
- ✅ Warehouse storage fees per location
- ✅ Branch contact information
- ✅ Operating hours

### Additional Features
- ✅ **Comprehensive profile pages** with all user fields
- ✅ **Address book** - Save multiple addresses
- ✅ **Status progression buttons** - Update booking status
- ✅ **Booking detail page** - Full timeline and information
- ✅ **Payment installments tracking**
- ✅ **Late fee calculations**
- ✅ **Platform fee (2%)** automatic calculation
- ✅ **Owner earnings (98%)** after platform fee

## Tech Stack

### Backend
- Node.js + Express
- PostgreSQL 15
- Redis (for sessions)
- JWT Authentication
- bcrypt for password hashing

### Frontend
- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- Shadcn/ui Components
- Zustand (State Management)
- React Hook Form + Zod (Form Validation)
- Axios (API Client)

## Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (only for manual setup)
- npm or yarn (only for manual setup)

## Deployment Options

### Option 1: Complete Docker Setup (Recommended for Testing)

**One-command setup** - Starts everything (Database + Backend + Frontend):

```bash
docker-compose up -d
```

This will start:
- PostgreSQL on port 5432
- Redis on port 6379
- Backend API on port 5000
- Frontend on port 3000

**Access the application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Database: localhost:5432

**View logs:**
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

**Stop all services:**
```bash
docker-compose down
```

**Stop and remove volumes (reset database):**
```bash
docker-compose down -v
```

---

### Option 2: Database Only (For Local Development)

If you want to run the backend and frontend locally (not in Docker):

**1. Start database services only:**

```bash
docker-compose -f docker-compose.db-only.yml up -d
```

This will start:
- PostgreSQL on port 5432
- Redis on port 6379

**2. Set Up Backend**

```bash
cd backend
npm install
```

The `.env` file is already configured in the backend directory with these values:

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/rentease_ph
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rentease_ph
DB_USER=rentease
DB_PASSWORD=rentease123

# Server
PORT=5000
NODE_ENV=development

# Auth
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-rentease-2025
JWT_EXPIRE=7d
BCRYPT_ROUNDS=10

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Platform Settings
PLATFORM_FEE_PERCENTAGE=10
LATE_FEE_MULTIPLIER=1.0
WAREHOUSE_BASE_FEE=2000
CANCELLATION_HOURS_THRESHOLD=24

# Mock Payment
MOCK_PAYMENT_ENABLED=true
```

**Note:** The `.env` file is already in place - no need to create it manually!

Start the backend:
```bash
npm run dev
```

Backend will run on http://localhost:5000

**3. Set Up Frontend**

```bash
cd frontend
npm install
```

The `.env.local` file is already configured in the frontend directory with:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

**Note:** The `.env.local` file is already in place - no need to create it manually!

Start the frontend:
```bash
npm run dev
```

Frontend will run on http://localhost:3000

## Default Credentials

**Admin Account:**
- Email: admin@rentease.ph
- Password: admin123

**Test Database:**
- Database: rentease_ph
- User: rentease
- Password: rentease123

## Docker Files

The project includes two docker-compose configurations:

### 1. `docker-compose.yml` (Complete Setup)
**Recommended for testing and demos**

Includes all services:
- PostgreSQL database
- Redis cache
- Backend API (built from Dockerfile)
- Frontend app (built from Dockerfile)

**Usage:**
```bash
docker-compose up -d              # Start all services
docker-compose logs -f            # View logs
docker-compose down               # Stop all services
docker-compose down -v            # Stop and remove volumes
```

### 2. `docker-compose.db-only.yml` (Database Only)
**Recommended for local development**

Includes only:
- PostgreSQL database
- Redis cache

Run backend and frontend manually for faster development iteration.

**Usage:**
```bash
docker-compose -f docker-compose.db-only.yml up -d
```

### Dockerfiles

**Backend:** `backend/Dockerfile`
- Node.js 18 Alpine
- Production dependencies only
- Health check on `/health` endpoint

**Frontend:** `frontend/Dockerfile`
- Multi-stage build
- Next.js standalone output
- Optimized production image

## Project Structure

```
CarRental/
├── backend/
│   ├── src/
│   │   ├── config/         # Database & constants
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/     # Auth, validation, errors
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── utils/          # Helper functions
│   │   └── server.js       # Entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/                    # Next.js pages
│   │   │   ├── admin/              # Admin dashboard
│   │   │   ├── owner/              # Owner dashboard
│   │   │   ├── cars/               # Car browsing & details
│   │   │   ├── bookings/           # Booking management
│   │   │   ├── dashboard/          # Customer dashboard
│   │   │   ├── login/              # Login page
│   │   │   └── register/           # Registration page
│   │   ├── components/
│   │   │   ├── auth/               # Login/Register forms
│   │   │   ├── cars/               # Car components
│   │   │   ├── layout/             # Navbar, Footer
│   │   │   └── ui/                 # Shadcn components
│   │   └── lib/
│   │       ├── api/                # API client & services
│   │       ├── store/              # Zustand stores
│   │       └── utils/              # Utilities
│   ├── Dockerfile          # Frontend Docker image
│   ├── .dockerignore       # Docker ignore file
│   └── package.json
├── database/
│   └── init.sql            # Database schema
├── backend/
│   ├── Dockerfile          # Backend Docker image
│   └── .dockerignore       # Docker ignore file
├── docker-compose.yml      # Complete setup (all services)
├── docker-compose.db-only.yml  # Database only
├── QUICKSTART.md           # Quick start guide
├── TESTING.md              # Testing guide
└── README.md
```

## 📡 Complete API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Register new user (with profile photo)
- `POST /login` - Login with JWT
- `GET /profile` - Get current user profile
- `PUT /profile` - Update user profile
- `PUT /change-password` - Change password
- `POST /logout` - Logout

### Cars (`/api/cars`)
- `GET /` - Get all cars with filters
- `GET /my-cars` - Get owner's cars
- `GET /:id` - Get car details
- `GET /:id/availability` - Check availability
- `GET /:id/blocked-dates` - Get blocked dates
- `POST /` - Create car listing
- `POST /:id/block-dates` - Block dates (owner)
- `PUT /:id` - Update car
- `PUT /:id/approve` - Approve car (admin)
- `PUT /:id/reject` - Reject car (admin)
- `DELETE /:id` - Delete car

### Bookings (`/api/bookings`)
- `GET /my-bookings` - Get customer bookings
- `GET /owner-bookings` - Get owner bookings
- `GET /stats` - Get booking statistics
- `GET /reference/:reference` - Get by reference number
- `GET /:id` - Get booking details
- `POST /` - Create booking
- `PUT /:id/cancel` - Cancel booking
- `PUT /:id/confirm` - Confirm booking (owner)
- `PUT /:id/status` - Update booking status

### Payments (`/api/payments`)
- `POST /process` - Process payment
- `GET /stats` - Payment statistics (admin)
- `GET /recent` - Recent payments (admin)
- `GET /booking/:booking_id` - Get booking payments
- `GET /booking/:booking_id/installments` - Get pending installments
- `GET /:id` - Get payment details
- `POST /:id/refund` - Process refund (admin)

### Notifications (`/api/notifications`)
- `GET /` - Get user notifications
- `GET /unread-count` - Get unread count
- `PUT /:id/read` - Mark as read
- `PUT /mark-all-read` - Mark all as read
- `DELETE /:id` - Delete notification

### Addresses (`/api/addresses`)
- `GET /` - Get user addresses
- `POST /` - Create address
- `PUT /:id` - Update address
- `DELETE /:id` - Delete address

### Damages (`/api/damages`)
- `POST /` - Report damage
- `GET /booking/:booking_id` - Get booking damages
- `PUT /:id/resolve` - Resolve damage

### Owner (`/api/owner`)
- `GET /profile` - Get owner profile
- `PUT /profile` - Update owner profile (business, banking)
- `GET /payouts` - Get payouts
- `GET /stats` - Get owner statistics

### Locations (`/api/locations`)
- `GET /` - Get all active locations/branches
- `GET /:id` - Get location details

## Database Schema

Key tables:
- `users` - User accounts (customer, owner, admin)
- `vehicle_owners` - Extended profile for car owners
- `cars` - Car listings
- `bookings` - Rental bookings
- `payments` - Payment transactions
- `locations` - Branch locations
- `notifications` - User notifications

See `database/init.sql` for complete schema.

## User Roles

**Customer:**
- Browse and rent cars
- View booking history
- Make payments

**Owner:**
- All customer features
- List cars for rent
- Manage car listings
- View bookings for their cars
- Track earnings

**Admin:**
- Approve/reject car listings
- View all payments
- View platform statistics
- Process refunds

## Development Notes

- The backend uses triggers to auto-calculate booking pricing and days
- JWT tokens are stored in localStorage
- Mock payment system (no real transactions)
- Car approval workflow: pending_approval → listed
- Booking status flow: pending_payment → confirmed → active → completed

## Troubleshooting

**Backend won't start:**
- Check if PostgreSQL is running: `docker ps`
- Verify database credentials in .env
- Check if port 5000 is available

**Frontend won't start:**
- Clear .next folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check if port 3000 is available

**Database connection failed:**
- Restart Docker services: `docker-compose restart`
- Check logs: `docker-compose logs postgres`

## License

MIT

## Contributors

RentEase Team
