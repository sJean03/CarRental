const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { validateBookingCreate, validateUUID } = require('../middleware/validation');
const { USER_ROLES } = require('../config/constants');

/**
 * @route   GET /api/bookings/my-bookings
 * @desc    Get current user's bookings
 * @access  Private
 */
router.get('/my-bookings', authMiddleware, bookingController.getMyBookings);

/**
 * @route   GET /api/bookings/owner-bookings
 * @desc    Get bookings for owner's cars
 * @access  Private (Owner)
 */
router.get('/owner-bookings', authMiddleware, roleMiddleware(USER_ROLES.OWNER), bookingController.getOwnerBookings);

/**
 * @route   GET /api/bookings/stats
 * @desc    Get booking statistics
 * @access  Private
 */
router.get('/stats', authMiddleware, bookingController.getBookingStats);

/**
 * @route   GET /api/bookings/reference/:reference
 * @desc    Get booking by reference number
 * @access  Private
 */
router.get('/reference/:reference', authMiddleware, bookingController.getBookingByReference);

/**
 * @route   GET /api/bookings/:id
 * @desc    Get booking by ID
 * @access  Private
 */
router.get('/:id', authMiddleware, validateUUID('id'), bookingController.getBookingById);

/**
 * @route   POST /api/bookings
 * @desc    Create new booking
 * @access  Private
 */
router.post('/', authMiddleware, validateBookingCreate, bookingController.createBooking);

/**
 * @route   PUT /api/bookings/:id/cancel
 * @desc    Cancel booking
 * @access  Private (Customer)
 */
router.put('/:id/cancel', authMiddleware, validateUUID('id'), bookingController.cancelBooking);

/**
 * @route   PUT /api/bookings/:id/confirm
 * @desc    Confirm booking (owner)
 * @access  Private (Owner)
 */
router.put('/:id/confirm', authMiddleware, roleMiddleware(USER_ROLES.OWNER), validateUUID('id'), bookingController.confirmBooking);

/**
 * @route   PUT /api/bookings/:id/status
 * @desc    Update booking status
 * @access  Private
 */
router.put('/:id/status', authMiddleware, validateUUID('id'), bookingController.updateBookingStatus);

module.exports = router;