const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Payment {
  /**
   * Create a payment record
   */
  static async create(paymentData) {
    const {
      booking_id,
      amount,
      payment_method,
      payment_plan,
      installment_number = null,
      is_initial_payment = false,
      is_down_payment = false,
      is_remaining_balance = false,
      card_last4,
      card_brand
    } = paymentData;

    // Generate mock transaction ID
    const transaction_id = `TXN-${Date.now()}-${uuidv4().substring(0, 8).toUpperCase()}`;

    const query = `
      INSERT INTO payments (
        booking_id, amount, payment_method, payment_plan,
        installment_number, is_initial_payment,
        is_down_payment, is_remaining_balance,
        card_last4, card_brand, transaction_id, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending')
      RETURNING *
    `;

    const values = [
      booking_id, amount, payment_method, payment_plan,
      installment_number, is_initial_payment,
      is_down_payment, is_remaining_balance,
      card_last4, card_brand, transaction_id
    ];

    const result = await db.query(query, values);
    return result.rows[0];
  }

  /**
   * Process payment (mock implementation)
   */
  static async process(paymentId) {
    // Mock payment processing - in real app, would integrate with Stripe/PayMongo
    const mockSuccess = Math.random() > 0.1; // 90% success rate for testing

    const status = mockSuccess ? 'completed' : 'failed';
    
    const query = `
      UPDATE payments 
      SET 
        status = $1,
        processed_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;

    const result = await db.query(query, [status, paymentId]);
    return result.rows[0];
  }

  /**
   * Find payment by ID
   */
  static async findById(paymentId) {
    const query = `
      SELECT 
        p.*,
        b.booking_reference,
        b.customer_id,
        u.email as customer_email
      FROM payments p
      LEFT JOIN bookings b ON p.booking_id = b.id
      LEFT JOIN users u ON b.customer_id = u.id
      WHERE p.id = $1
    `;

    const result = await db.query(query, [paymentId]);
    return result.rows[0];
  }

  /**
   * Get payments for a booking
   */
  static async findByBooking(bookingId) {
    const query = `
      SELECT * FROM payments
      WHERE booking_id = $1
      ORDER BY created_at DESC
    `;

    const result = await db.query(query, [bookingId]);
    return result.rows;
  }

  /**
   * Get payment by transaction ID
   */
  static async findByTransactionId(transactionId) {
    const query = `
      SELECT 
        p.*,
        b.booking_reference
      FROM payments p
      LEFT JOIN bookings b ON p.booking_id = b.id
      WHERE p.transaction_id = $1
    `;

    const result = await db.query(query, [transactionId]);
    return result.rows[0];
  }

  /**
   * Update payment status
   */
  static async updateStatus(paymentId, status) {
    const query = `
      UPDATE payments 
      SET 
        status = $1,
        processed_at = CASE WHEN $1 IN ('completed', 'failed') THEN CURRENT_TIMESTAMP ELSE processed_at END
      WHERE id = $2
      RETURNING *
    `;

    const result = await db.query(query, [status, paymentId]);
    return result.rows[0];
  }

  /**
   * Process refund
   */
  static async refund(paymentId, refundAmount, refundReason) {
    const query = `
      UPDATE payments 
      SET 
        status = 'refunded',
        refunded_amount = $2,
        refunded_at = CURRENT_TIMESTAMP,
        refund_reason = $3
      WHERE id = $1 AND status = 'completed'
      RETURNING *
    `;

    const result = await db.query(query, [paymentId, refundAmount, refundReason]);
    return result.rows[0];
  }

  /**
   * Get pending installment payments for a booking
   */
  static async getPendingInstallments(bookingId) {
    const query = `
      SELECT 
        b.installment_months,
        b.monthly_payment,
        COUNT(p.id) FILTER (WHERE p.status = 'completed') as paid_installments
      FROM bookings b
      LEFT JOIN payments p ON b.id = p.booking_id AND p.payment_plan = 'installment'
      WHERE b.id = $1 AND b.payment_plan = 'installment'
      GROUP BY b.id, b.installment_months, b.monthly_payment
    `;

    const result = await db.query(query, [bookingId]);
    const data = result.rows[0];

    if (!data) return null;

    const remainingInstallments = data.installment_months - data.paid_installments;
    const nextInstallmentNumber = data.paid_installments + 1;

    return {
      totalInstallments: data.installment_months,
      paidInstallments: data.paid_installments,
      remainingInstallments,
      nextInstallmentNumber,
      installmentAmount: data.monthly_payment
    };
  }

  /**
   * Get payment statistics
   */
  static async getStats(filters = {}) {
    let whereClause = 'WHERE 1=1';
    const values = [];
    let paramCount = 1;

    if (filters.start_date) {
      whereClause += ` AND p.created_at >= $${paramCount}`;
      values.push(filters.start_date);
      paramCount++;
    }

    if (filters.end_date) {
      whereClause += ` AND p.created_at <= $${paramCount}`;
      values.push(filters.end_date);
      paramCount++;
    }

    if (filters.status) {
      whereClause += ` AND p.status = $${paramCount}`;
      values.push(filters.status);
      paramCount++;
    }

    const query = `
      SELECT 
        COUNT(*) as total_payments,
        COUNT(*) FILTER (WHERE status = 'completed') as successful_payments,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_payments,
        COUNT(*) FILTER (WHERE status = 'refunded') as refunded_payments,
        SUM(amount) FILTER (WHERE status = 'completed') as total_revenue,
        SUM(refunded_amount) as total_refunded,
        AVG(amount) FILTER (WHERE status = 'completed') as avg_payment_amount
      FROM payments p
      ${whereClause}
    `;

    const result = await db.query(query, values);
    return result.rows[0];
  }

  /**
   * Get recent payments
   */
  static async getRecent(limit = 10) {
    const query = `
      SELECT
        p.*,
        b.booking_reference,
        u.first_name, u.last_name
      FROM payments p
      LEFT JOIN bookings b ON p.booking_id = b.id
      LEFT JOIN users u ON b.customer_id = u.id
      ORDER BY p.created_at DESC
      LIMIT $1
    `;

    const result = await db.query(query, [limit]);
    return result.rows;
  }

  /**
   * Check if down payment has been made for a booking
   */
  static async hasDownPayment(bookingId) {
    const query = `
      SELECT EXISTS(
        SELECT 1 FROM payments
        WHERE booking_id = $1
        AND payment_plan = 'downpayment'
        AND is_down_payment = true
        AND status = 'completed'
      ) as has_payment
    `;

    const result = await db.query(query, [bookingId]);
    return result.rows[0].has_payment;
  }

  /**
   * Check if remaining balance has been paid for a booking
   */
  static async hasRemainingBalance(bookingId) {
    const query = `
      SELECT EXISTS(
        SELECT 1 FROM payments
        WHERE booking_id = $1
        AND payment_plan = 'downpayment'
        AND is_remaining_balance = true
        AND status = 'completed'
      ) as has_payment
    `;

    const result = await db.query(query, [bookingId]);
    return result.rows[0].has_payment;
  }
}

module.exports = Payment;