const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middleware/auth');

// Protected routes (customer)
router.post('/', authMiddleware.verifyToken, paymentController.submitPayment);
router.get('/booking/:reservation_id', authMiddleware.verifyToken, paymentController.getPaymentHistory);

// Admin/Staff only routes
router.get('/', authMiddleware.verifyToken, authMiddleware.isStaff, paymentController.getAllPayments);
router.get('/pending', authMiddleware.verifyToken, authMiddleware.isStaff, paymentController.getPendingVerifications);
router.patch('/:id/verify', authMiddleware.verifyToken, authMiddleware.isStaff, paymentController.verifyPayment);

module.exports = router;