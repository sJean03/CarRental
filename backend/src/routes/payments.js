const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect, restrictTo } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Customer routes
router.post('/', paymentController.submitPayment);
router.get('/booking/:reservation_id', paymentController.getPaymentHistory);

// Admin/Staff only routes
router.get('/', restrictTo('admin', 'staff'), paymentController.getAllPayments);
router.get('/pending', restrictTo('admin', 'staff'), paymentController.getPendingVerifications);
router.patch('/:id/verify', restrictTo('admin', 'staff'), paymentController.verifyPayment);
router.patch('/:id/refund', restrictTo('admin', 'staff'), paymentController.refundPayment);

module.exports = router;