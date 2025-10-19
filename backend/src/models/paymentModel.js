const db = require('../config/database');

const paymentModel = {
  // Create payment record
  async create(paymentData) {
    const query = `
      INSERT INTO payments (
        reservation_id,
        amount,
        payment_method,
        payment_type,
        gcash_number,
        gcash_reference,
        gcash_screenshot_url,
        received_by,
        payment_status,
        payment_date,
        notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    
    const values = [
      paymentData.reservation_id,
      paymentData.amount,
      paymentData.payment_method,
      paymentData.payment_type || 'deposit',
      paymentData.gcash_number || null,
      paymentData.gcash_reference || null,
      paymentData.gcash_screenshot_url || null,
      paymentData.received_by || null,
      paymentData.payment_status || 'pending',
      paymentData.payment_date || new Date(),
      paymentData.notes || null
    ];
    
    const result = await db.query(query, values);
    return result.rows[0];
  },

  // Create refund record (negative payment)
  async createRefund(refundData) {
    const query = `
      INSERT INTO payments (
        reservation_id,
        amount,
        payment_method,
        payment_type,
        payment_status,
        received_by,
        payment_date,
        notes
      )
      VALUES ($1, -$2, $3, 'refund', 'completed', $4, CURRENT_TIMESTAMP, $5)
      RETURNING *
    `;
    
    const values = [
      refundData.reservation_id,
      refundData.amount,
      refundData.payment_method,
      refundData.received_by,
      refundData.notes || 'Refund processed'
    ];
    
    const result = await db.query(query, values);
    return result.rows[0];
  },

  // Get payment by ID
  async findById(id) {
    const query = `
      SELECT 
        p.*,
        r.booking_reference,
        u.first_name as received_by_first_name,
        u.last_name as received_by_last_name
      FROM payments p
      LEFT JOIN reservations r ON r.id = p.reservation_id
      LEFT JOIN users u ON u.id = p.received_by
      WHERE p.id = $1
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  },

  // Get payments by reservation ID
  async findByReservationId(reservationId) {
    const query = `
      SELECT 
        p.*,
        u.first_name as received_by_first_name,
        u.last_name as received_by_last_name
      FROM payments p
      LEFT JOIN users u ON u.id = p.received_by
      WHERE p.reservation_id = $1
      ORDER BY p.created_at DESC
    `;
    const result = await db.query(query, [reservationId]);
    return result.rows;
  },

  // Get all payments with filters
  async findAll(filters = {}) {
    let query = `
      SELECT 
        p.*,
        r.booking_reference,
        r.user_id,
        cu.first_name as customer_first_name,
        cu.last_name as customer_last_name,
        cu.email as customer_email,
        su.first_name as staff_first_name,
        su.last_name as staff_last_name
      FROM payments p
      LEFT JOIN reservations r ON r.id = p.reservation_id
      LEFT JOIN users cu ON cu.id = r.user_id
      LEFT JOIN users su ON su.id = p.received_by
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (filters.payment_status) {
      query += ` AND p.payment_status = $${paramIndex}`;
      params.push(filters.payment_status);
      paramIndex++;
    }

    if (filters.payment_method) {
      query += ` AND p.payment_method = $${paramIndex}`;
      params.push(filters.payment_method);
      paramIndex++;
    }

    if (filters.start_date) {
      query += ` AND p.payment_date >= $${paramIndex}`;
      params.push(filters.start_date);
      paramIndex++;
    }

    if (filters.end_date) {
      query += ` AND p.payment_date <= $${paramIndex}`;
      params.push(filters.end_date);
      paramIndex++;
    }

    query += ' ORDER BY p.created_at DESC';

    const result = await db.query(query, params);
    return result.rows;
  },

  // Update payment status
  async updateStatus(id, status, staffId, notes) {
    const query = `
      UPDATE payments 
      SET payment_status = $1, 
          received_by = $2, 
          notes = $3,
          payment_date = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `;
    const result = await db.query(query, [status, staffId, notes, id]);
    return result.rows[0];
  },

  // Calculate total paid for a reservation
  async getTotalPaid(reservationId) {
    const query = `
      SELECT COALESCE(SUM(amount), 0) as total_paid
      FROM payments
      WHERE reservation_id = $1 
        AND payment_status IN ('verified', 'completed')
    `;
    const result = await db.query(query, [reservationId]);
    return parseFloat(result.rows[0].total_paid);
  },

  // Check if reservation is fully paid
  async isFullyPaid(reservationId) {
    const query = `
      SELECT 
        r.total_amount,
        COALESCE(SUM(p.amount), 0) as total_paid
      FROM reservations r
      LEFT JOIN payments p ON r.id = p.reservation_id 
        AND p.payment_status IN ('verified', 'completed')
      WHERE r.id = $1
      GROUP BY r.id, r.total_amount
    `;
    const result = await db.query(query, [reservationId]);
    
    if (result.rows.length === 0) return false;
    
    const { total_amount, total_paid } = result.rows[0];
    return parseFloat(total_paid) >= parseFloat(total_amount);
  },

  // Get payment statistics
  async getStatistics(filters = {}) {
    let query = `
      SELECT 
        COUNT(*) as total_payments,
        COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN payment_status = 'verified' THEN 1 END) as verified_count,
        COUNT(CASE WHEN payment_status = 'completed' THEN 1 END) as completed_count,
        COUNT(CASE WHEN payment_method = 'cash' THEN 1 END) as cash_count,
        COUNT(CASE WHEN payment_method = 'gcash' THEN 1 END) as gcash_count,
        COALESCE(SUM(CASE WHEN payment_status IN ('verified', 'completed') THEN amount ELSE 0 END), 0) as total_revenue,
        COALESCE(AVG(CASE WHEN payment_status IN ('verified', 'completed') THEN amount END), 0) as avg_payment
      FROM payments
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (filters.start_date) {
      query += ` AND payment_date >= ${paramIndex}`;
      params.push(filters.start_date);
      paramIndex++;
    }

    if (filters.end_date) {
      query += ` AND payment_date <= ${paramIndex}`;
      params.push(filters.end_date);
      paramIndex++;
    }

    const result = await db.query(query, params);
    return result.rows[0];
  }
};

module.exports = paymentModel;