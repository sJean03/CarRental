const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const authMiddleware = require('../middleware/auth');

// Public routes
router.get('/insurance-plans', bookingController.getInsurancePlans);
router.get('/locations', bookingController.getLocations);

// Protected routes (require authentication)
router.post('/calculate-cost', authMiddleware.verifyToken, bookingController.calculateCost);
router.post('/', authMiddleware.verifyToken, bookingController.createBooking);
router.get('/my-bookings', authMiddleware.verifyToken, bookingController.getMyBookings);
router.get('/:id', authMiddleware.verifyToken, bookingController.getBookingById);
router.patch('/:id/cancel', authMiddleware.verifyToken, bookingController.cancelBooking);

// Admin/Staff only routes
router.get('/', authMiddleware.verifyToken, authMiddleware.isStaff, bookingController.getAllBookings);

module.exports = router;