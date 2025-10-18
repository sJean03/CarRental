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
        payment_type,
        gcash_number,
        gcash_reference,
        gcash_screenshot_url,
        payment_status: payment_method === 'cash' ? 'completed' : 'pending',
        payment_date: new Date(),
        notes
      });

      // If cash payment, mark as completed immediately
      if (payment_method === 'cash') {
        // Check if fully paid and update booking status
        const isFullyPaid = await paymentModel.isFullyPaid(reservation_id);
        if (isFullyPaid && booking.status === 'pending_payment') {
          await bookingModel.updateStatus(reservation_id, 'confirmed');
        }
      }

      res.status(201).json({
        success: true,
        message: payment_method === 'cash' 
          ? 'Cash payment recorded successfully' 
          : 'GCash payment submitted. Awaiting verification.',
        payment,
        remaining_balance: remainingBalance - parseFloat(amount)
      });
    } catch (error) {
      console.error('Submit payment error:', error);
      res.status(500).json({ error: 'Failed to submit payment', details: error.message });
    }
  },

  // Get payment history for a booking
  async getPaymentHistory(req, res) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const { reservation_id } = req.params;

      // Get booking
      const booking = await bookingModel.findById(reservation_id);
      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      // Check authorization
      if (userRole !== 'admin' && userRole !== 'staff' && booking.user_id !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Get payments
      const payments = await paymentModel.findByReservationId(reservation_id);
      const totalPaid = await paymentModel.getTotalPaid(reservation_id);
      const remainingBalance = parseFloat(booking.total_amount) - totalPaid;

      res.json({
        success: true,
        booking_reference: booking.booking_reference,
        total_amount: booking.total_amount,
        total_paid: totalPaid,
        remaining_balance: remainingBalance,
        is_fully_paid: remainingBalance <= 0,
        payments
      });
    } catch (error) {
      console.error('Get payment history error:', error);
      res.status(500).json({ error: 'Failed to fetch payment history', details: error.message });
    }
  },

  // Verify GCash payment (admin/staff only)
  async verifyPayment(req, res) {
    try {
      const staffId = req.user.id;
      const { id } = req.params;
      const { status, notes } = req.body;

      // Validate status
      if (!['verified', 'completed', 'refunded'].includes(status)) {
        return res.status(400).json({ error: 'Invalid payment status' });
      }

      // Get payment
      const payment = await paymentModel.findById(id);
      if (!payment) {
        return res.status(404).json({ error: 'Payment not found' });
      }

      // Update payment status
      const updatedPayment = await paymentModel.updateStatus(id, status, staffId, notes);

      // If payment verified/completed, check if booking is fully paid
      if (status === 'verified' || status === 'completed') {
        const isFullyPaid = await paymentModel.isFullyPaid(payment.reservation_id);
        
        const booking = await bookingModel.findById(payment.reservation_id);
        if (isFullyPaid && booking.status === 'pending_payment') {
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
      res.status(500).json({ error: 'Failed to verify payment', details: error.message });
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
      res.status(500).json({ error: 'Failed to fetch payments', details: error.message });
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
      res.status(500).json({ error: 'Failed to fetch pending verifications', details: error.message });
    }
  }
};

module.exports = paymentController;