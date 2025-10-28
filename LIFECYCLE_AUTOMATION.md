# Booking Lifecycle Automation

## Overview

The RentEase car rental platform now includes automated booking lifecycle management that automatically transitions bookings through their lifecycle stages based on pickup and return dates.

## Features

### 1. Automatic Status Transitions
- **Confirmed → Active**: Bookings automatically transition to "active" when their pickup date arrives
- **Active → Returned**: Bookings automatically transition to "returned" when their return date arrives
- Late fee calculation for overdue returns

### 2. Overdue Detection & Notifications
- Automatic detection of overdue bookings
- Configurable notification intervals (1hr, 6hrs, 24hrs, 48hrs after due time)
- Late fee calculation with configurable rates and caps

### 3. Admin Dashboard
- Real-time lifecycle statistics
- Overdue bookings monitoring
- Upcoming transitions preview
- Manual job triggering for testing
- Scheduler status monitoring

## Architecture

### Backend Components

#### 1. Scheduler Service
**Location**: `backend/src/services/schedulerService.js`

Central manager for all cron jobs. Handles:
- Starting/stopping scheduled jobs
- Job status monitoring
- Manual job execution

#### 2. Booking Lifecycle Job
**Location**: `backend/src/jobs/bookingLifecycleJob.js`

Runs every 15 minutes (configurable). Executes:
- `transitionToActive()`: Moves confirmed bookings to active status
- `transitionToReturned()`: Moves active bookings to returned status
- Applies late fees for overdue returns

#### 3. Overdue Bookings Job
**Location**: `backend/src/jobs/overdueBookingsJob.js`

Runs every hour (configurable). Executes:
- Detects overdue bookings (active status past return date)
- Sends notifications based on configured intervals
- Updates late fee calculations

#### 4. Database Enhancements
**Location**: `backend/src/models/Booking.js`

New methods added:
- `getBookingsReadyForActive(bufferMinutes)`: Find bookings ready to become active
- `getBookingsReadyForReturn(bufferMinutes)`: Find bookings ready to be returned
- `calculateLateFee(bookingId, ratePerDay, maxPercentage)`: Calculate late fees
- `getLifecycleStats()`: Get statistics for admin dashboard

#### 5. Admin API Endpoints
**Location**: `backend/src/routes/admin.js`

New endpoints:
- `GET /api/admin/lifecycle/stats`: Dashboard statistics
- `GET /api/admin/bookings/overdue`: List overdue bookings
- `GET /api/admin/lifecycle/upcoming`: Upcoming transitions
- `POST /api/admin/jobs/:jobName/trigger`: Manually trigger jobs
- `GET /api/admin/scheduler/status`: Scheduler status
- `POST /api/admin/bookings/:id/force-transition`: Force status change

### Frontend Components

#### Admin Lifecycle Dashboard
**Location**: `frontend/src/app/admin/lifecycle/page.tsx`

Features:
- Real-time lifecycle statistics
- Scheduler status monitoring
- Overdue bookings table with late fees
- Manual job triggering
- Auto-refresh every 60 seconds

## Configuration

### Scheduler Settings
**Location**: `backend/src/config/scheduler.config.js`

```javascript
{
  schedules: {
    bookingLifecycle: '*/15 * * * *',  // Every 15 minutes
    overdueBookings: '0 * * * *'        // Every hour
  },

  lateFees: {
    ratePerDay: 0.20,           // 20% of daily rate per late day
    maxPercentage: 1.0,         // Max 100% of total rental cost
    gracePeriodHours: 2         // 2-hour grace period
  },

  transitions: {
    autoActive: true,
    autoReturn: true,
    bufferMinutes: 15           // Transition 15 minutes early
  },

  features: {
    schedulerEnabled: true,     // Master switch
    autoTransitions: true,
    overdueDetection: true,
    autoLateFees: true
  }
}
```

### Environment Variables

Optional environment variables to control features:

```bash
# Disable scheduler entirely
SCHEDULER_ENABLED=false

# Disable specific features
AUTO_TRANSITIONS=false
OVERDUE_DETECTION=false
AUTO_LATE_FEES=false

# Notification settings
EMAIL_FROM=noreply@rentease.com
EMAIL_REPLY_TO=support@rentease.com
```

## Testing

### Test Bookings in Database

The database includes 6 lifecycle test bookings (see `database/init.sql`):

1. **RE-LIFECYCLE-001**: Confirmed, pickup TODAY → should auto-transition to active
2. **RE-LIFECYCLE-002**: Confirmed, pickup YESTERDAY → should auto-transition immediately
3. **RE-LIFECYCLE-003**: Active, return TODAY → should auto-transition to returned
4. **RE-LIFECYCLE-004**: Active, 3 days OVERDUE → should calculate late fees
5. **RE-LIFECYCLE-005**: Active, 1 day OVERDUE → should calculate late fees
6. **RE-LIFECYCLE-006**: Pending owner confirmation → should remain unchanged

### Manual Testing Steps

#### 1. Start the Backend Server

```bash
cd backend
npm start
```

Watch the console for scheduler initialization:
```
[Scheduler] Starting automated job scheduler...
[Scheduler] Booking lifecycle job scheduled: */15 * * * *
[Scheduler] Overdue bookings job scheduled: 0 * * * *
[Scheduler] Started 2 scheduled jobs
```

#### 2. Trigger Jobs Manually

**Via API:**
```bash
# Trigger lifecycle job
curl -X POST http://localhost:5000/api/admin/jobs/lifecycle/trigger \
  -H "Authorization: Bearer YOUR_TOKEN"

# Trigger overdue job
curl -X POST http://localhost:5000/api/admin/jobs/overdue/trigger \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Via Admin Dashboard:**
1. Navigate to `http://localhost:3000/admin/lifecycle`
2. Click "Run Lifecycle Job" or "Process Overdue" buttons
3. View results in real-time

#### 3. Check Scheduler Status

```bash
curl http://localhost:5000/api/admin/scheduler/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected response:
```json
{
  "success": true,
  "data": {
    "isRunning": true,
    "jobCount": 2,
    "jobs": ["bookingLifecycle", "overdueBookings"],
    "config": {
      "autoTransitions": true,
      "overdueDetection": true,
      "autoLateFees": true
    }
  }
}
```

#### 4. View Lifecycle Statistics

```bash
curl http://localhost:5000/api/admin/lifecycle/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 5. Check Database Changes

After running the lifecycle job, verify transitions:

```sql
-- Check if test bookings transitioned correctly
SELECT booking_reference, status, pickup_date, return_date, days_late, late_fee
FROM bookings
WHERE booking_reference LIKE 'RE-LIFECYCLE-%'
ORDER BY booking_reference;
```

Expected results:
- LIFECYCLE-001 & 002: Should be "active"
- LIFECYCLE-003: Should be "returned"
- LIFECYCLE-004 & 005: Should have late_fee > 0

### Automated Testing

The jobs run automatically:
- **Lifecycle job**: Every 15 minutes
- **Overdue job**: Every hour

Monitor logs to see automatic execution:
```
[Lifecycle] Starting booking lifecycle job...
[Lifecycle] Found 2 bookings ready to transition to active
[Lifecycle] ✓ Booking RE-LIFECYCLE-001 transitioned to active
[Lifecycle] Job completed in 45ms - Transitioned: 2, Failed: 0
```

## Late Fee Calculation

### Formula

```
Daily Late Fee = Daily Rate × Rate Per Day (20%)
Total Late Fee = Daily Late Fee × Days Late
Capped at = Total Rental Amount × Max Percentage (100%)
```

### Example

Booking details:
- Daily rate: $2,000
- Total rental: $4,000 (2 days)
- 3 days late

Calculation:
```
Daily Late Fee = $2,000 × 0.20 = $400/day
Total Late Fee = $400 × 3 days = $1,200
Max Late Fee = $4,000 × 1.0 = $4,000
Final Late Fee = min($1,200, $4,000) = $1,200
```

## Monitoring & Logs

### Console Logs

The scheduler provides detailed logging:

```
[Scheduler] Starting automated job scheduler...
[Scheduler] Booking lifecycle job scheduled: */15 * * * *
[Lifecycle] Starting booking lifecycle job...
[Lifecycle] Found 2 bookings ready to transition to active
[Lifecycle] ✓ Booking RE-20251028-ABC123 transitioned to active
[Lifecycle] Job completed in 45ms - Transitioned: 2, Failed: 0
[Overdue] Found 3 overdue bookings
[Overdue] 📧 Notification would be sent to customer@email.com
```

### Admin Dashboard

Real-time monitoring available at:
- **URL**: `http://localhost:3000/admin/lifecycle`
- **Features**:
  - Live statistics by status
  - Overdue bookings count and late fees
  - Upcoming transitions preview
  - Scheduler health status
  - Manual job triggers

## Troubleshooting

### Scheduler Not Starting

**Problem**: No scheduler logs on server start

**Solutions**:
1. Check environment variable: `SCHEDULER_ENABLED` should not be "false"
2. Verify `schedulerService.start()` is called in `server.js`
3. Check for errors in scheduler service initialization

### Jobs Not Running

**Problem**: Jobs scheduled but not executing

**Solutions**:
1. Verify cron syntax in `scheduler.config.js`
2. Check feature toggles in config
3. Review console for job errors
4. Manually trigger job to test: `POST /api/admin/jobs/lifecycle/trigger`

### Bookings Not Transitioning

**Problem**: Test bookings remain in same status

**Solutions**:
1. Verify pickup/return dates in database
2. Check buffer minutes setting (default: 15 minutes)
3. Run job manually to see detailed error messages
4. Verify booking status is correct for transition (e.g., must be "confirmed" to go "active")

### Late Fees Not Calculating

**Problem**: Overdue bookings show $0 late fees

**Solutions**:
1. Check `AUTO_LATE_FEES` feature toggle
2. Verify booking is truly overdue (return_date < CURRENT_DATE)
3. Run overdue job manually and check logs
4. Verify late fee configuration in `scheduler.config.js`

## Production Deployment

### Checklist

- [ ] Review and adjust cron schedules for production load
- [ ] Configure email service for notifications (currently placeholder)
- [ ] Set appropriate late fee rates and caps
- [ ] Enable database audit logging for all automated transitions
- [ ] Set up monitoring alerts for failed transitions
- [ ] Configure backup/fallback for scheduler downtime
- [ ] Test notification delivery
- [ ] Document admin procedures for manual overrides

### Recommended Settings

```javascript
// Production config
{
  schedules: {
    bookingLifecycle: '*/10 * * * *',  // Every 10 minutes
    overdueBookings: '*/30 * * * *'    // Every 30 minutes
  },

  notifications: {
    enabled: true,
    overdueReminders: [1, 12, 24, 48, 72]  // Hours after overdue
  },

  logging: {
    verbose: false,                   // Disable verbose logs
    auditDatabase: true               // Enable audit trail
  }
}
```

## Future Enhancements

### Planned Features

1. **Email/SMS Notifications**
   - Integrate with SendGrid/Twilio
   - Customizable notification templates
   - Multi-language support

2. **Advanced Scheduling**
   - Priority queue for high-value bookings
   - Retry logic for failed transitions
   - Distributed job processing for scale

3. **Analytics & Reporting**
   - Lifecycle performance metrics
   - Late return trends
   - Revenue impact analysis

4. **Automation Rules**
   - Custom workflow automation
   - Conditional transitions
   - Integration with external systems

5. **Customer Self-Service**
   - Extend rental requests
   - Early return processing
   - Automated refunds

## Support

For issues or questions:
- Check logs in console output
- Review admin dashboard for status
- Consult this documentation
- Contact development team

---

**Last Updated**: 2025-10-28
**Version**: 1.0.0
