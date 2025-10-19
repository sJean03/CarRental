const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const {
  getOwnerDashboard,
  getOwnerVehicles,
  getOwnerPayments,
  getVehicleAnalytics,
  getEarningsSummary
} = require('../controllers/ownerController');

// All routes require authentication and owner role
router.use(protect);
router.use(restrictTo('owner'));

// Dashboard
router.get('/dashboard', getOwnerDashboard);

// Vehicles
router.get('/vehicles', getOwnerVehicles);
router.get('/vehicles/:vehicleId/analytics', getVehicleAnalytics);

// Payments
router.get('/payments', getOwnerPayments);
router.get('/earnings/summary', getEarningsSummary);

module.exports = router;