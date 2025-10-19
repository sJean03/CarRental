const paymentModel = require('../models/paymentModel');
const bookingModel = require('../models/bookingModel');

const paymentController = {
  // Submit payment (customer)
  async submitPayment(req, res) {
    try {
      const userId = req.user.id;
      const {
        reservation_id,
        amount,
        payment_method,
        payment_type,
        gcash_number,
        gcash_reference,
        gcash_screenshot_url,
        notes
      } = req.body;

      // Validate required fields
      if (!reservation_id || !amount || !payment_method) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Validate payment method
      if (!['cash', 'gcash'].includes(payment_method)) {
        return res.status(400).json({ error: 'Invalid payment method. Must be cash or gcash' });
      }

      // Verify booking belongs to user
      const booking = await bookingModel.findById(reservation_id);
      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      if (booking.user_id !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Validate GCash fields if payment method is GCash
      if (payment_method === 'gcash' && (!gcash_number || !gcash_reference)) {
        return res.status(400).json({ 
          error: 'GCash number and reference are required for GCash payments' 
        });
      }

      // Check total paid so far
      const totalPaid = await paymentModel.getTotalPaid(reservation_id);
      const remainingBalance = parseFloat(booking.total_amount) - totalPaid;

      if (parseFloat(amount) > remainingBalance) {
        return res.status(400).json({ 
          error: 'Payment amount exceeds remaining balance',
          remaining_balance: remainingBalance
        });
      }

      // Create payment record
      const payment = await paymentModel.create({
        reservation_id,
        amount,
        payment_method,
        payment_type: payment_type || 'deposit',
        gcash_number,
        gcash_reference,
        gcash_screenshot_url,
        payment_status: payment_method === 'cash' ? 'pending' : 'pending',
        notes
      });

      res.status(201).json({
        success: true,
        message: 'Payment submitted successfully. Awaiting verification.',
        payment,
        remaining_balance: remainingBalance - parseFloat(amount)
      });
    } catch (error) {
      console.error('Submit payment error:', error);
      res.status(500).json({ 
        error: 'Failed to submit payment', 
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Get payment history for a booking
  async getPaymentHistory(req, res) {
    try {
      const userId = req.user.id;
      const { reservation_id } = req.params;

      // Verify booking belongs to user (unless admin/staff)
      if (req.user.role === 'customer') {
        const booking = await bookingModel.findById(reservation_id);
        if (!booking || booking.user_id !== userId) {
          return res.status(403).json({ error: 'Access denied' });
        }
      }

      const payments = await paymentModel.findByReservationId(reservation_id);
      const totalPaid = await paymentModel.getTotalPaid(reservation_id);

      res.json({
        success: true,
        reservation_id,
        total_paid: totalPaid,
        payments
      });
    } catch (error) {
      console.error('Get payment history error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch payment history', 
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Verify payment (admin/staff only)
  async verifyPayment(req, res) {
    try {
      const { id } = req.params;
      const staffId = req.user.id;
      const { status, notes } = req.body;

      // Validate status
      if (!status || !['verified', 'completed', 'refunded'].includes(status)) {
        return res.status(400).json({ error: 'Invalid payment status' });
      }

      // Get payment
      const payment = await paymentModel.findById(id);
      if (!payment) {
        return res.status(404).json({ error: 'Payment not found' });
      }

      // Update payment status
      const updatedPayment = await paymentModel.updateStatus(id, status, staffId, notes);

      // If payment verified/completed, check if booking should be confirmed
      if (status === 'verified' || status === 'completed') {
        const booking = await bookingModel.findById(payment.reservation_id);
        const totalPaid = await paymentModel.getTotalPaid(payment.reservation_id);
        const depositAmount = parseFloat(booking.deposit_amount);
        
        // Confirm booking if deposit is paid
        if (totalPaid >= depositAmount && booking.status === 'pending_payment') {
          await bookingModel.updateStatus(payment.reservation_id, 'confirmed');
        }
      }

      res.json({
        success: true,
        message: 'Payment status updated successfully',
        payment: updatedPayment
      });
    } catch (error) {
      console.error('Verify payment error:', error);
      res.status(500).json({ 
        error: 'Failed to verify payment', 
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Refund payment (admin/staff only)
  async refundPayment(req, res) {
    try {
      const { id } = req.params;
      const staffId = req.user.id;
      const { refund_amount, refund_reason } = req.body;

      // Get payment
      const payment = await paymentModel.findById(id);
      if (!payment) {
        return res.status(404).json({ error: 'Payment not found' });
      }

      // Validate refund amount
      if (!refund_amount || parseFloat(refund_amount) <= 0) {
        return res.status(400).json({ error: 'Invalid refund amount' });
      }

      if (parseFloat(refund_amount) > parseFloat(payment.amount)) {
        return res.status(400).json({ error: 'Refund amount cannot exceed payment amount' });
      }

      // Create refund record
      const refund = await paymentModel.createRefund({
        original_payment_id: id,
        reservation_id: payment.reservation_id,
        amount: refund_amount,
        payment_method: payment.payment_method,
        payment_type: 'refund',
        payment_status: 'completed',
        received_by: staffId,
        notes: refund_reason
      });

      res.json({
        success: true,
        message: 'Refund processed successfully',
        refund
      });
    } catch (error) {
      console.error('Refund payment error:', error);
      res.status(500).json({ 
        error: 'Failed to process refund', 
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Get all payments (admin/staff only)
  async getAllPayments(req, res) {
    try {
      const { payment_status, payment_method, start_date, end_date } = req.query;

      const payments = await paymentModel.findAll({
        payment_status,
        payment_method,
        start_date,
        end_date
      });

      res.json({
        success: true,
        count: payments.length,
        payments
      });
    } catch (error) {
      console.error('Get all payments error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch payments', 
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Get pending verifications (admin/staff only)
  async getPendingVerifications(req, res) {
    try {
      const payments = await paymentModel.findAll({ payment_status: 'pending' });

      res.json({
        success: true,
        count: payments.length,
        pending_payments: payments
      });
    } catch (error) {
      console.error('Get pending verifications error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch pending verifications', 
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

module.exports = paymentController;