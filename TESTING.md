# Testing Guide for RentEase

## Prerequisites
- Database (PostgreSQL + Redis) running via podman
- Backend environment variables configured
- Frontend environment variables configured

## Environment Setup

### Backend .env File
The `backend/.env` file is already configured with these values:

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

### Frontend .env.local File
The `frontend/.env.local` file is already configured with:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

**Note:** Both `.env` files are already in place - no need to create them manually!

## Step-by-Step Testing Plan

### Quick Start (Recommended)

**Option 1: Complete Docker Setup (Everything in one command)**

```bash
# From project root
docker-compose up -d
```

This starts:
- PostgreSQL (port 5432)
- Redis (port 6379)
- Backend API (port 5000)
- Frontend (port 3000)

**Access:** http://localhost:3000

**View logs:**
```bash
docker-compose logs -f
```

**Stop everything:**
```bash
docker-compose down
```

---

**Option 2: Database Only + Manual Backend/Frontend**

### 1. Start the Database

```bash
# From project root
docker-compose -f docker-compose.db-only.yml up -d
```

This will start:
- PostgreSQL on port 5432
- Redis on port 6379

### 2. Start the Backend
```bash
cd backend
npm install  # if not already done
npm run dev
```

**Expected Output:**
```
🚗 RentEase API Server
📍 Server: http://localhost:5000
🌍 Environment: development
📊 Database: rentease_ph
```

**Quick Backend Test:**
Open browser to http://localhost:5000 - should see welcome message

### 3. Start the Frontend
```bash
cd frontend
npm install  # if not already done
npm run dev
```

**Expected Output:**
```
✓ Ready in Xms
○ Local: http://localhost:3000
```

---

## Testing Checklist

### Phase 1: Basic Functionality

**Homepage** (http://localhost:3000)
- [ ] Page loads without errors
- [ ] Navbar displays with "RentEase" logo
- [ ] "Browse Cars" and "List Your Car" buttons visible
- [ ] Features section displays correctly

**Authentication**
- [ ] Navigate to /register
- [ ] Create customer account (email: customer@test.com, password: password123)
- [ ] Should redirect to /dashboard after registration
- [ ] Logout works (from navbar dropdown)
- [ ] Login with created account works
- [ ] Navigate to /login and login with admin (admin@rentease.ph / admin123)
- [ ] Admin should redirect to /admin/dashboard

### Phase 2: Customer Flow

**Browse Cars** (http://localhost:3000/cars)
- [ ] Cars page loads (may be empty initially)
- [ ] Search bar displays
- [ ] Filters (transmission, fuel type, seats, sort) work
- [ ] "Clear Filters" button works

**Create Test Data as Owner**
1. Logout from admin
2. Register as owner (email: owner@test.com, password: password123, role: owner)
3. Navigate to /owner/dashboard
4. Click "List a Car"
5. Fill form:
   - Make: Toyota
   - Model: Vios
   - Year: 2023
   - Color: White
   - License Plate: ABC 1234
   - Transmission: Automatic
   - Fuel Type: Petrol
   - Seats: 5
   - Daily Rate: 1500
   - Description: Clean and well-maintained
6. [ ] Submit - should show success toast
7. [ ] Redirects to owner dashboard
8. [ ] Car shows with "pending approval" badge

**Admin Approval**
1. Logout, login as admin
2. Go to /admin/dashboard
3. [ ] See the car in "Pending Approvals" tab
4. [ ] Click "Approve"
5. [ ] Car disappears from pending list

**Customer Booking**
1. Logout, login as customer (customer@test.com)
2. Go to /cars
3. [ ] See the approved Toyota Vios
4. [ ] Click "View Details"
5. [ ] Car detail page loads with all info
6. [ ] Select dates on calendar (today + 3 days)
7. [ ] Price calculation updates automatically
8. [ ] Click "Book Now"
9. [ ] Redirects to payment page (/bookings/[id]/payment)

**Payment Processing**
1. On payment page:
   - [ ] Booking summary displays correctly
   - [ ] Total amount is correct
   - [ ] Fill in mock card details:
     - Payment Method: Credit Card
     - Card Number: 1234567890123456
     - Name: JUAN DELA CRUZ
     - Expiry: 12/25
     - CVV: 123
2. [ ] Click "Pay" button
3. [ ] Success toast appears
4. [ ] Redirects to /dashboard
5. [ ] Booking shows in "All Bookings" tab

### Phase 3: Owner Flow

**Owner Dashboard**
1. Logout, login as owner (owner@test.com)
2. Go to /owner/dashboard
3. [ ] Stats show: 1 car, 1 active listing
4. [ ] Toyota Vios appears in "My Cars" tab with "listed" badge
5. [ ] Switch to "Bookings" tab
6. [ ] See the customer's booking
7. [ ] Earnings calculation shows (98% of total)

**List Another Car**
1. [ ] Click "List a Car"
2. Create another car (Honda Civic, etc.)
3. [ ] Submit successfully
4. [ ] See 2 cars in dashboard

### Phase 4: Admin Flow

**Admin Dashboard**
1. Login as admin
2. Go to /admin/dashboard
3. [ ] Stats show total revenue, payments, etc.
4. [ ] "Pending Approvals" tab shows Honda Civic
5. [ ] Approve the second car
6. [ ] "Recent Payments" tab shows customer's payment

### Phase 5: Edge Cases

**Navigation**
- [ ] Logo click returns to homepage
- [ ] All navbar links work
- [ ] Dashboard links work for each role
- [ ] Back button doesn't break app

**Authentication**
- [ ] Accessing /owner/dashboard as customer redirects
- [ ] Accessing /admin/dashboard as customer redirects
- [ ] Logout clears token and redirects

**Validation**
- [ ] Register with existing email shows error
- [ ] Login with wrong password shows error
- [ ] Empty form fields show validation errors
- [ ] Car creation with missing fields shows errors

**Booking**
- [ ] Cannot book without login (redirects to login)
- [ ] Cannot book without selecting dates
- [ ] Booking past dates is disabled

---

## Common Issues & Fixes

### Backend Issues

**Database Connection Error**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Fix:** Make sure PostgreSQL is running via podman on port 5432

**JWT Error**
```
Error: JWT_SECRET not defined
```
**Fix:** Check backend/.env file has JWT_SECRET

### Frontend Issues

**API Connection Error**
```
Network Error / 404 Not Found
```
**Fix:**
1. Check backend is running on port 5000
2. Check .env.local has NEXT_PUBLIC_API_URL=http://localhost:5000/api

**Build Errors**
```
Module not found
```
**Fix:** Run `npm install` in frontend directory

**Hydration Errors**
**Fix:** Clear .next folder: `rm -rf .next` and restart

---

## Success Criteria

✅ All phases completed without errors
✅ Customer can browse, book, and pay for cars
✅ Owner can list cars and see bookings
✅ Admin can approve cars and view payments
✅ Role-based access control works
✅ Navigation flows correctly
✅ No console errors in browser
✅ No server errors in backend logs

---

## Quick Test Commands

**Check Backend Health:**
```bash
curl http://localhost:5000/health
```

**Check Database Connection:**
```bash
# From backend directory
node -e "const db = require('./src/config/database'); db.query('SELECT NOW()').then(r => console.log('DB OK:', r.rows[0])).catch(console.error)"
```

**Test Admin Login API:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@rentease.ph","password":"admin123"}'
```

Should return user object with token.

---

## Notes

- Mock payment system - any card number works
- Platform fee is automatically 2% of subtotal
- Owner earnings are 98% (platform keeps 2%)
- Car approval is required before listing becomes visible
- Booking status progresses automatically through payment
