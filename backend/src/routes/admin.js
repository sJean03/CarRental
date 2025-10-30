const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { USER_ROLES } = require('../config/constants');
const delistController = require('../controllers/delistController');

// TODO: Add admin-only middleware to restrict these routes
// For now, just requiring authentication

/**
 * Admin Routes for Lifecycle Management
 */

// Get lifecycle statistics for dashboard
router.get(
  '/lifecycle/stats',
  authMiddleware,
  adminController.getLifecycleStats
);

// Get all overdue bookings
router.get(
  '/bookings/overdue',
  authMiddleware,
  adminController.getOverdueBookings
);

// Get bookings by status
router.get(
  '/bookings/by-status',
  authMiddleware,
  adminController.getBookingsByStatus
);

// Get upcoming transitions
router.get(
  '/lifecycle/upcoming',
  authMiddleware,
  adminController.getUpcomingTransitions
);

// Get scheduler status
router.get(
  '/scheduler/status',
  authMiddleware,
  adminController.getSchedulerStatus
);

// Manually trigger a job
router.post(
  '/jobs/:jobName/trigger',
  authMiddleware,
  adminController.triggerJob
);

// Force transition a booking
router.post(
  '/bookings/:id/force-transition',
  authMiddleware,
  adminController.forceTransition
);

// Delist requests management
router.get('/delist-requests', authMiddleware, roleMiddleware(USER_ROLES.ADMIN), delistController.getPendingRequests);
router.put('/delist-requests/:id/approve', authMiddleware, roleMiddleware(USER_ROLES.ADMIN), delistController.approveRequest);
router.put('/delist-requests/:id/reject', authMiddleware, roleMiddleware(USER_ROLES.ADMIN), delistController.rejectRequest);

// Admin: Force delist car directly
router.put('/cars/:id/delist', authMiddleware, roleMiddleware(USER_ROLES.ADMIN), delistController.forceDelistCar);

module.exports = router;
