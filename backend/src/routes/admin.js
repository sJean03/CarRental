const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');

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

module.exports = router;
