const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, restrictTo } = require('../middleware/auth');

// All routes require staff/admin authentication
router.use(protect);
router.use(restrictTo('admin', 'staff'));

// Check-in / Check-out
router.post('/check-in', adminController.checkIn);
router.post('/check-out', adminController.checkOut);
router.get('/active-rentals', adminController.getActiveRentals);

// Dashboard
router.get('/dashboard/stats', adminController.getDashboardStats);

module.exports = router;