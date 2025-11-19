# Manual Booking Lifecycle Testing Guide

## Overview

This guide explains how to test the manual owner controls for booking lifecycle progression. These controls allow car owners to manually move bookings through different stages.

## Bug Fixes Applied

### 1. **Owner Verification Fix**
- **Previous Bug**: The system only checked if user had role = 'owner', allowing ANY owner to control ANY booking
- **Fixed**: Now verifies that the logged-in user is the actual owner of the specific car in the booking
- **File**: `frontend/src/app/bookings/[id]/page.tsx` line 136
- **Logic**: `const isOwner = booking.owner_user_id === user?.id;`

### 2. **Backend Enhancement**
- Added `owner_user_id` to booking responses for proper ownership verification
- **File**: `backend/src/models/Booking.js` line 58

### 3. **TypeScript Type Update**
- Added `owner_user_id?: string` to Booking interface
- **File**: `frontend/src/lib/api/types.ts` line 137

## Test Data Added

Three manual testing bookings have been added to the database:

| Booking Reference | Status | Owner | Description |
|------------------|--------|-------|-------------|
| **RE-MANUAL-001** | confirmed | John Doe (ID: 10000000-0000-0000-0000-000000000001) | Test "Mark as Picked Up" button |
| **RE-MANUAL-002** | active | John Doe (ID: 10000000-0000-0000-0000-000000000001) | Test "Mark as Returned" button |
| **RE-MANUAL-003** | returned | Sarah Lee (ID: 10000000-0000-0000-0000-000000000002) | Test "Complete Booking" button |

## Test Accounts

### Owner Account 1: John Doe
- **Email**: `john.doe@example.com`
- **Password**: `password123` (or check your database)
- **User ID**: `10000000-0000-0000-0000-000000000001`
- **Owner ID**: `50000000-0000-0000-0000-000000000001`
- **Owns**: Toyota Vios 2020, Honda Civic 2021
- **Test Bookings**: RE-MANUAL-001, RE-MANUAL-002

### Owner Account 2: Sarah Lee
- **Email**: `sarah.lee@example.com`
- **Password**: `password123`
- **User ID**: `10000000-0000-0000-0000-000000000002`
- **Owner ID**: `50000000-0000-0000-0000-000000000002`
- **Owns**: Toyota Fortuner 2022
- **Test Bookings**: RE-MANUAL-003

## Step-by-Step Testing

### Prerequisites
1. **Reinitialize Database** (to get test data):
   ```bash
   cd database
   psql -U postgres -d rentease < init.sql
   ```

2. **Restart Backend** (to apply code fixes):
   ```bash
   cd backend
   npm start
   ```

3. **Start Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

### Test 1: Mark as Picked Up (Confirmed → Active)

1. **Login** as John Doe (`john.doe@example.com`)

2. **Navigate** to your bookings:
   - Click "Dashboard" in navigation
   - Click "Bookings" tab
   - Find booking **RE-MANUAL-001** (status: confirmed)

3. **View Details**:
   - Click "View Details" or navigate to `/bookings/[booking-id]`
   - Status badge should show "confirmed" in green

4. **Test the Button**:
   - Scroll down to the actions section
   - You should see button: **"Mark as Picked Up"**
   - Click the button
   - Status should change to "active" (purple badge)
   - Toast notification: "Status updated successfully"

5. **Verify**:
   - Booking progress bar should show step 4 "Active" as highlighted
   - Button should now say **"Mark as Returned"**

---

### Test 2: Mark as Returned (Active → Returned)

1. **Stay logged in** as John Doe

2. **View** booking **RE-MANUAL-002**:
   - Should already be in "active" status

3. **Test the Button**:
   - You should see button: **"Mark as Returned"**
   - Click the button
   - Status should change to "returned" (blue badge)

4. **Verify**:
   - Booking progress bar shows step 5 "Returned" as highlighted
   - Button should now say **"Complete Booking"**

---

### Test 3: Complete Booking (Returned → Completed)

1. **Logout** from John Doe account

2. **Login** as Sarah Lee (`sarah.lee@example.com`)
   - **Important**: Different owner to test ownership verification!

3. **View** booking **RE-MANUAL-003**:
   - Should be in "returned" status

4. **Test the Button**:
   - You should see button: **"Complete Booking"**
   - Click the button
   - Status should change to "completed" (gray badge)

5. **Verify**:
   - Booking progress bar shows step 6 "Completed" as highlighted
   - No more action buttons (lifecycle complete)

---

### Test 4: Ownership Verification (Negative Test)

1. **Stay logged in** as Sarah Lee

2. **Try to view** John Doe's booking **RE-MANUAL-001**:
   - Navigate to `/bookings/[re-manual-001-id]`
   - You should see the booking details
   - But **NO** action buttons should appear
   - This confirms only the actual owner can control the booking

---

## Expected Button Visibility

| Booking Status | Owner Sees | Customer Sees | Other Owners See |
|---------------|------------|---------------|------------------|
| pending_payment | - | "Cancel Booking" | - |
| pending_owner_confirmation | "Confirm Booking" | "Cancel Booking" | - |
| **confirmed** | **"Mark as Picked Up"** | "Cancel Booking" | - |
| **active** | **"Mark as Returned"** | - | - |
| **returned** | **"Complete Booking"** | - | - |
| completed | - | - | - |
| cancelled | - | - | - |

## Troubleshooting

### Issue: Buttons Don't Appear

**Check:**
1. Are you logged in as the correct owner?
2. Is the booking status correct for the button?
3. Clear browser cache and refresh
4. Check browser console for errors

**Verify ownership**:
```bash
# In database
SELECT
  b.booking_reference,
  b.status,
  vo.user_id as owner_user_id,
  u.email as owner_email
FROM bookings b
JOIN vehicle_owners vo ON b.owner_id = vo.id
JOIN users u ON vo.user_id = u.id
WHERE b.booking_reference = 'RE-MANUAL-001';
```

### Issue: "Failed to update status"

**Check:**
1. Backend is running
2. Database connection is active
3. Booking exists and status is valid
4. Check backend logs for errors

### Issue: Wrong User Can Control Booking

**This should NOT happen** - if it does:
1. Verify the fix was applied: `isOwner = booking.owner_user_id === user?.id`
2. Check that backend returns `owner_user_id`
3. Clear all caches and restart both frontend and backend

## Automated Testing Alternative

If manual testing is cumbersome, you can also trigger automated transitions using the Admin Lifecycle Dashboard:

1. Navigate to: `http://localhost:3000/admin/lifecycle`
2. Click "Run Lifecycle Job" button
3. Bookings with pickup/return dates that have arrived will auto-transition

## Database Queries for Verification

### Check Test Bookings Status
```sql
SELECT booking_reference, status, pickup_date, return_date, customer_notes
FROM bookings
WHERE booking_reference LIKE 'RE-MANUAL-%'
ORDER BY booking_reference;
```

### Check Owner Assignments
```sql
SELECT
  b.booking_reference,
  b.status,
  u.email as owner_email,
  vo.user_id as owner_user_id,
  c.make || ' ' || c.model as car
FROM bookings b
JOIN vehicle_owners vo ON b.owner_id = vo.id
JOIN users u ON vo.user_id = u.id
JOIN cars c ON b.car_id = c.id
WHERE b.booking_reference LIKE 'RE-MANUAL-%';
```

### Reset Test Bookings (if needed)
```sql
-- Reset to confirmed
UPDATE bookings SET status = 'confirmed' WHERE booking_reference = 'RE-MANUAL-001';

-- Reset to active
UPDATE bookings SET status = 'active' WHERE booking_reference = 'RE-MANUAL-002';

-- Reset to returned
UPDATE bookings SET status = 'returned' WHERE booking_reference = 'RE-MANUAL-003';
```

## Summary

After applying these fixes:

✅ **Security Improvement**: Only actual car owners can control their bookings
✅ **Proper Verification**: System checks `owner_user_id` matches logged-in user
✅ **Test Data Available**: 3 bookings ready for testing all lifecycle stages
✅ **Multiple Owner Accounts**: Can test cross-owner scenarios

The manual lifecycle controls now work correctly with proper ownership verification!

---

**Last Updated**: 2025-10-28
**Version**: 1.1.0
