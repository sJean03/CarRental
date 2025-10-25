const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { validatePayment, validateUUID } = require('../middleware/validation');
const { USER_ROLES } = require('../config/constants');

/**
 * @route   POST /api/payments/process
 * @desc    Process payment for booking
 * @access  Private
 */
router.post('/process', authMiddleware, validatePayment, paymentController.processPayment);

/**
 * @route   GET /api/payments/stats
 * @desc    Get payment statistics
 * @access  Private (Admin)
 */
router.get('/stats', authMiddleware, roleMiddleware(USER_ROLES.ADMIN), paymentController.getPaymentStats);

/**
 * @route   GET /api/payments/recent
 * @desc    Get recent payments
 * @access  Private (Admin)
 */
router.get('/recent', authMiddleware, roleMiddleware(USER_ROLES.ADMIN), paymentController.getRecentPayments);

/**
 * @route   GET /api/payments/booking/:booking_id
 * @desc    Get payments for a booking
 * @access  Private
 */
router.get('/booking/:booking_id', authMiddleware, validateUUID('booking_id'), paymentController.getBookingPayments);

/**
 * @route   GET /api/payments/booking/:booking_id/installments
 * @desc    Get pending installments for booking
 * @access  Private
 */
router.get('/booking/:booking_id/installments', authMiddleware, validateUUID('booking_id'), paymentController.getPendingInstallments);

/**
 * @route   GET /api/payments/:id
 * @desc    Get payment by ID
 * @access  Private
 */
router.get('/:id', authMiddleware, validateUUID('id'), paymentController.getPaymentById);

/**
 * @route   POST /api/payments/:id/refund
 * @desc    Process refund
 * @access  Private (Admin)
 */
router.post('/:id/refund', authMiddleware, roleMiddleware(USER_ROLES.ADMIN), validateUUID('id'), paymentController.processRefund);

module.exports = router;