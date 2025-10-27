# Customer → Owner Dual Role Implementation

## 📋 Overview

This implementation allows **customers to become owners** without losing customer capabilities. Users can:
- ✅ Rent cars (customer features)
- ✅ List their own cars (owner features)
- ✅ Switch seamlessly between both roles

**Architecture:** ONE unified frontend with conditional feature rendering based on `vehicle_owners` profile existence.

---

## 🔧 Backend Changes

### 1. New Middleware: `ownerMiddleware.js`

**Location:** `backend/src/middleware/ownerMiddleware.js`

```javascript
// Checks if user has vehicle_owners profile (not just role)
const ownerMiddleware = async (req, res, next) => {
  const ownerProfile = await VehicleOwner.findByUserId(req.user.id);
  if (!ownerProfile) {
    return res.status(403).json({
      message: 'Owner profile required',
      code: 'OWNER_PROFILE_REQUIRED'
    });
  }
  req.ownerProfile = ownerProfile;
  next();
};
```

**Purpose:** Profile-based access control instead of role-based

### 2. New API Endpoints

#### POST `/api/owner/register`
- **Access:** Any authenticated user
- **Purpose:** Create `vehicle_owners` profile for customers
- **Required:** `bank_account_number`, `bank_name`
- **Optional:** `business_name`, `tax_id`, `preferred_payout_method`

```json
// Example request
POST /api/owner/register
{
  "bank_account_number": "1234567890",
  "bank_name": "BDO",
  "business_name": "My Car Rentals",  // optional
  "tax_id": "TIN-123-456-789"          // optional
}
```

#### GET `/api/owner/check`
- **Access:** Any authenticated user
- **Purpose:** Check if user has owner profile
- **Response:**
```json
{
  "success": true,
  "data": {
    "isOwner": true,
    "profile": { /* owner profile data */ }
  }
}
```

### 3. Updated Routes

All owner routes now use `ownerMiddleware` instead of `roleMiddleware(USER_ROLES.OWNER)`:

**Files Updated:**
- `backend/src/routes/owner.js` ✅
- `backend/src/routes/cars.js` ✅

**Routes Affected:**
- `/api/owner/profile` (GET, PUT)
- `/api/owner/stats`
- `/api/owner/payouts`
- `/api/cars` (POST)
- `/api/cars/my-cars`
- `/api/cars/:id` (PUT, DELETE)
- `/api/cars/:id/block-dates`

---

## 🎨 Frontend Changes

### 1. Owner API Helper

**Location:** `frontend/src/lib/api/owner.ts`

```typescript
export const ownerApi = {
  checkOwnerStatus(),    // Check if user is owner
  register(data),        // Register as owner
  getProfile(),          // Get owner profile
  updateProfile(data),   // Update profile
  getStats(),            // Dashboard stats
  getPayouts(),          // Earnings history
};
```

### 2. Auth Store Enhanced

**Location:** `frontend/src/lib/store/authStore.ts`

**New State:**
```typescript
interface AuthState {
  // Existing
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;

  // NEW
  isOwner: boolean;              // Has vehicle_owner profile?
  ownerProfile: any | null;      // Owner profile data
  checkOwnerStatus(): Promise<void>;  // Refresh owner status
}
```

**Usage:**
```typescript
const { isOwner, checkOwnerStatus } = useAuthStore();

// Check owner status after login
await checkOwnerStatus();

// Conditionally show owner features
{isOwner && <OwnerDashboardLink />}
```

### 3. "Become an Owner" Registration Page

**Location:** `frontend/src/app/become-owner/page.tsx`

**Features:**
- ✅ Benefits showcase (Earn Money, Protection, Easy Management)
- ✅ Registration form (bank details, business info)
- ✅ FAQ section
- ✅ Form validation with Zod
- ✅ Redirects to "List Your Car" after registration

**Access:** `/become-owner`

---

## 🚀 User Flow

### Scenario 1: Customer Becomes Owner

```
1. User signs up → Creates `users` record (role='customer')
2. User browses & rents cars → Customer features work ✅
3. User clicks "Become an Owner" → Goes to /become-owner
4. User fills registration form → Creates `vehicle_owners` record
5. Redirected to /owner/cars/new → Can now list cars ✅
6. User can STILL rent cars → Both features available! ✅
```

### Scenario 2: Checking Access

**Backend Protection:**
```javascript
// Old way (restrictive)
roleMiddleware(USER_ROLES.OWNER)  // ❌ Blocks customers

// New way (flexible)
ownerMiddleware  // ✅ Checks vehicle_owners table
```

**Frontend Rendering:**
```typescript
// Navigation component
const { isAuthenticated, isOwner } = useAuthStore();

{isAuthenticated && (
  <>
    <Link href="/cars">Browse Cars</Link>
    <Link href="/bookings">My Rentals</Link>

    {/* Owner features - only if registered */}
    {isOwner ? (
      <>
        <Link href="/owner/dashboard">Owner Dashboard</Link>
        <Link href="/owner/cars/new">List a Car</Link>
      </>
    ) : (
      <Link href="/become-owner">Become an Owner</Link>
    )}
  </>
)}
```

---

## 📊 Database Schema (No Changes Required!)

Your existing schema is already perfect:

```sql
-- users table
-- role is just a label, doesn't restrict features anymore

-- vehicle_owners table (acts as opt-in extension)
CREATE TABLE vehicle_owners (
    id UUID PRIMARY KEY,
    user_id UUID UNIQUE REFERENCES users(id),  -- Any user can have this!
    bank_account_number VARCHAR(100),
    bank_name VARCHAR(100),
    ...
);
```

**Key Insight:** The `vehicle_owners` table is the "unlock key" for owner features!

---

## 🔄 Migration Guide

### Step 1: Restart Backend
```bash
# Backend picks up new middleware automatically
podman compose restart backend
```

### Step 2: Rebuild Frontend
```bash
# Frontend gets new API helpers and pages
podman compose restart frontend
```

### Step 3: Test the Flow

1. **Login as customer** (e.g., `peter.tan@gmail.com`)
2. **Check navigation** → Should see "Become an Owner" button
3. **Click it** → Goes to `/become-owner`
4. **Fill form** → Bank account + details
5. **Submit** → Redirected to `/owner/cars/new`
6. **Navigation updates** → Now shows owner options!
7. **Can still rent** → Customer features still work!

---

## 🎯 Key Benefits

### For Users
✅ **No separate accounts** - One login for both roles
✅ **Seamless switching** - Navigation adapts automatically
✅ **Earn while renting** - List your car AND rent others

### For Development
✅ **No breaking changes** - Existing users unaffected
✅ **Minimal code changes** - Mostly middleware swaps
✅ **Clean separation** - `vehicle_owners` table handles owner data
✅ **Scalable** - Follows P2P marketplace best practices (Turo, Airbnb)

---

## 🧪 Testing Checklist

### Backend Tests
- [ ] `/api/owner/register` - Customer can become owner
- [ ] `/api/owner/check` - Returns correct isOwner status
- [ ] `/api/cars` (POST) - Works after owner registration
- [ ] `/api/cars` (POST) - Blocked before owner registration

### Frontend Tests
- [ ] `/become-owner` page loads
- [ ] Form validation works
- [ ] Registration creates owner profile
- [ ] Navigation shows owner links after registration
- [ ] Customer features still work after becoming owner
- [ ] Owner profile page displays correctly

### Integration Tests
- [ ] Customer rents car → Works
- [ ] Same user becomes owner → Works
- [ ] Same user lists car → Works
- [ ] Same user rents another car → Still works!

---

## 🔮 Future Enhancements

### Suggested Features
1. **Owner verification badge** - Show verified owners in UI
2. **Role switching toggle** - "Switch to Owner Mode" button
3. **Combined dashboard** - Show both rental history and earnings
4. **Owner analytics** - Track earnings, bookings, ratings
5. **Progressive disclosure** - Gradually introduce owner features

### Example: Role Switcher Component
```typescript
<Select value={currentView} onValueChange={setCurrentView}>
  <SelectItem value="customer">Customer View</SelectItem>
  {isOwner && <SelectItem value="owner">Owner View</SelectItem>}
</Select>
```

---

## 📞 Support

**Backend API Issue?**
- Check `backend/src/middleware/ownerMiddleware.js`
- Verify `vehicle_owners` record exists in database

**Frontend Not Showing Owner Features?**
- Call `checkOwnerStatus()` after login
- Check `useAuthStore().isOwner` value

**Still Stuck?**
- Check browser console for API errors
- Verify `/api/owner/check` returns correct data
- Restart Docker containers

---

## 📝 Summary

### What Changed
- ✅ Added `ownerMiddleware.js` (profile-based access)
- ✅ Added `/api/owner/register` endpoint
- ✅ Added `/api/owner/check` endpoint
- ✅ Updated owner routes to use new middleware
- ✅ Updated car routes to use new middleware
- ✅ Added `owner.ts` API helper
- ✅ Enhanced auth store with owner status
- ✅ Created `/become-owner` registration page

### What Stayed the Same
- ✅ Database schema (no migration needed!)
- ✅ Existing user data (no changes)
- ✅ Customer features (still work)
- ✅ Admin features (unchanged)

### Result
**Customers can now become owners while keeping customer features!** 🎉

---

**Implementation Date:** October 27, 2025
**Status:** ✅ Complete and Ready for Testing
