const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const {
  getRevenueReport,
  getFleetUtilizationReport,
  getCustomerAnalytics,
  getPaymentAnalytics,
  getOwnerEarningsReport
} = require('../controllers/reportingController');

// All routes require admin access
router.use(protect);
router.use(restrictTo('admin'));

router.get('/revenue', getRevenueReport);
router.get('/fleet-utilization', getFleetUtilizationReport);
router.get('/customer-analytics', getCustomerAnalytics);
router.get('/payment-analytics', getPaymentAnalytics);
router.get('/owner-earnings', getOwnerEarningsReport);

module.exports = router;