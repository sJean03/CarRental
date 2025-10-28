const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const VehicleOwner = require('../models/VehicleOwner');
const { sendPaymentReceived, sendPaymentFailed, sendBookingConfirmation } = require('../utils/notificationService');
const { BOOKING_STATUS } = require('../config/constants');
const User = require('../models/User');

/**
 * Process payment for a booking
 */
const processPayment = async (req, res, next) => {
  try {
    const { booking_id, payment_method, card_last4, card_brand, installment_number } = req.body;

    // Get booking
    const booking = await Booking.findById(booking_id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user is the customer
    if (booking.customer_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to pay for this booking'
      });
    }

    // Check booking status
    const validStatuses = ['pending_payment', 'payment_confirmed'];
    if (!validStatuses.includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: 'Payment cannot be processed for this booking'
      });
    }

    // Determine payment amount
    let paymentAmount;
    let isInitialPayment = false;
    let currentInstallmentNumber = installment_number;

    if (booking.payment_plan === 'installment') {
      // Check if this is initial payment or subsequent installment
      const existingPayments = await Payment.findByBooking(booking_id);
      const completedPayments = existingPayments.filter(p => p.status === 'completed');

      if (completedPayments.length === 0) {
        // Initial payment
        isInitialPayment = true;
        currentInstallmentNumber = 1;
      } else {
        currentInstallmentNumber = completedPayments.length + 1;
      }

      paymentAmount = booking.monthly_payment;
    } else {
      // Full payment
      paymentAmount = booking.total_amount;
    }

    // Create payment record
    const paymentData = {
      booking_id,
      amount: paymentAmount,
      payment_method,
      payment_plan: booking.payment_plan,
      installment_number: booking.payment_plan === 'installment' ? currentInstallmentNumber : null,
      is_initial_payment: isInitialPayment,
      card_last4,
      card_brand
    };

    const payment = await Payment.create(paymentData);

    // Process payment (mock)
    const processedPayment = await Payment.process(payment.id);

    if (processedPayment.status === 'completed') {
      // Update booking status
      let newBookingStatus;

      if (booking.payment_plan === 'full') {
        // Full payment confirmed, now needs owner confirmation
        newBookingStatus = BOOKING_STATUS.PENDING_OWNER_CONFIRMATION;
      } else {
        // For installment, move to pending owner confirmation only after first payment
        if (isInitialPayment) {
          newBookingStatus = BOOKING_STATUS.PENDING_OWNER_CONFIRMATION;
        } else {
          newBookingStatus = booking.status; // Keep current status for subsequent payments
        }
      }

      await Booking.updateStatus(booking_id, newBookingStatus);

      // Get user info for notification
      const user = await User.findById(req.user.id);
      
      // Send payment confirmation
      await sendPaymentReceived(
        req.user.id,
        user.email,
        paymentAmount,
        booking.booking_reference
      );

      // If this was the first payment, send booking confirmation
      if (booking.status === 'pending_payment') {
        const carDetails = `${booking.make} ${booking.model} ${booking.year}`;
        await sendBookingConfirmation(
          req.user.id,
          user.email,
          booking.booking_reference,
          carDetails
        );
      }

      res.status(200).json({
        success: true,
        message: 'Payment processed successfully',
        data: {
          payment: processedPayment,
          booking_status: newBookingStatus
        }
      });
    } else {
      // Payment failed
      const user = await User.findById(req.user.id);
      await sendPaymentFailed(req.user.id, user.email, booking.booking_reference);

      res.status(400).json({
        success: false,
        message: 'Payment processing failed. Please try again.',
        data: { payment: processedPayment }
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Get payment by ID
 */
const getPaymentById = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Check authorization - only customer or admin can view
    if (payment.customer_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this payment'
      });
    }

    res.status(200).json({
      success: true,
      data: { payment }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get payments for a booking
 */
const getBookingPayments = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.booking_id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check authorization - customer, owner, or admin can view
    const owner = await VehicleOwner.findByUserId(req.user.id);
    const isOwner = owner && booking.owner_id === owner.id;
    const isCustomer = booking.customer_id === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view these payments'
      });
    }

    const payments = await Payment.findByBooking(req.params.booking_id);

    res.status(200).json({
      success: true,
      count: payments.length,
      data: { payments }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get pending installments for a booking
 */
const getPendingInstallments = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.booking_id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check authorization
    if (booking.customer_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this information'
      });
    }

    if (booking.payment_plan !== 'installment') {
      return res.status(400).json({
        success: false,
        message: 'This booking does not use installment payment plan'
      });
    }

    const installmentInfo = await Payment.getPendingInstallments(req.params.booking_id);

    res.status(200).json({
      success: true,
      data: installmentInfo
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Process refund (admin only)
 */
const processRefund = async (req, res, next) => {
  try {
    const { refund_amount, refund_reason } = req.body;

    if (!refund_amount || !refund_reason) {
      return res.status(400).json({
        success: false,
        message: 'Refund amount and reason are required'
      });
    }

    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Only completed payments can be refunded'
      });
    }

    if (refund_amount > payment.amount) {
      return res.status(400).json({
        success: false,
        message: 'Refund amount cannot exceed payment amount'
      });
    }

    const refundedPayment = await Payment.refund(req.params.id, refund_amount, refund_reason);

    res.status(200).json({
      success: true,
      message: 'Refund processed successfully',
      data: { payment: refundedPayment }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get payment statistics (admin only)
 */
const getPaymentStats = async (req, res, next) => {
  try {
    const filters = {
      start_date: req.query.start_date,
      end_date: req.query.end_date,
      status: req.query.status
    };

    const stats = await Payment.getStats(filters);

    res.status(200).json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get recent payments (admin only)
 */
const getRecentPayments = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const payments = await Payment.getRecent(limit);

    res.status(200).json({
      success: true,
      count: payments.length,
      data: { payments }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  processPayment,
  getPaymentById,
  getBookingPayments,
  getPendingInstallments,
  processRefund,
  getPaymentStats,
  getRecentPayments
};