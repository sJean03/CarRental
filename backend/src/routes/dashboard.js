const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const {
  getAdminDashboard,
  getCustomerDashboard,
  getSystemHealth
} = require('../controllers/dashboardController');

router.use(protect);

router.get('/admin', restrictTo('admin'), getAdminDashboard);
router.get('/customer', restrictTo('customer'), getCustomerDashboard);
router.get('/health', restrictTo('admin'), getSystemHealth);

module.exports = router;
