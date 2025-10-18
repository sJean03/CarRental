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

  // Get payment by ID
  async findById(id) {
    const query = `
      SELECT 
        p.*,
        r.booking_reference,
        r.total_amount as booking_total,
        r.deposit_amount as booking_deposit,
        u.first_name as staff_first_name,
        u.last_name as staff_last_name
      FROM payments p
      LEFT JOIN reservations r ON p.reservation_id = r.id
      LEFT JOIN users u ON p.received_by = u.id
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
        u.first_name as staff_first_name,
        u.last_name as staff_last_name
      FROM payments p
      LEFT JOIN users u ON p.received_by = u.id
      WHERE p.reservation_id = $1
      ORDER BY p.created_at DESC
    `;
    const result = await db.query(query, [reservationId]);
    return result.rows;
  },

  // Get all payments (admin only)
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
      LEFT JOIN reservations r ON p.reservation_id = r.id
      LEFT JOIN users cu ON r.user_id = cu.id
      LEFT JOIN users su ON p.received_by = su.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;

    // Filter by status
    if (filters.payment_status) {
      query += ` AND p.payment_status = $${paramIndex}`;
      params.push(filters.payment_status);
      paramIndex++;
    }

    // Filter by payment method
    if (filters.payment_method) {
      query += ` AND p.payment_method = $${paramIndex}`;
      params.push(filters.payment_method);
      paramIndex++;
    }

    // Filter by date range
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

    query += ` ORDER BY p.created_at DESC`;

    const result = await db.query(query, params);
    return result.rows;
  },

  // Update payment status
  async updateStatus(id, status, staffId, notes = null) {
    const query = `
      UPDATE payments 
      SET 
        payment_status = $1,
        received_by = $2,
        notes = COALESCE($3, notes),
        updated_at = CURRENT_TIMESTAMP
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
  }
};

module.exports = paymentModel;