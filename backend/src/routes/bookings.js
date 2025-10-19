const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { protect, restrictTo } = require('../middleware/auth');

// Public routes
router.get('/insurance-plans', bookingController.getInsurancePlans);
router.get('/locations', bookingController.getLocations);

// Protected routes (require authentication)
router.use(protect);

router.post('/calculate-cost', bookingController.calculateCost);
router.post('/', bookingController.createBooking);
router.get('/my-bookings', bookingController.getMyBookings);
router.get('/:id', bookingController.getBookingById);
router.patch('/:id/cancel', bookingController.cancelBooking);

// Admin/Staff only routes
router.get('/', restrictTo('admin', 'staff'), bookingController.getAllBookings);

module.exports = router;