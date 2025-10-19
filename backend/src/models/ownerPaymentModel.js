const db = require('../config/database');

const ownerPaymentModel = {
  // Create owner payment record
  async create(paymentData) {
    const query = `
      INSERT INTO owner_payments (
        owner_id,
        payment_period_start,
        payment_period_end,
        total_rentals,
        total_rental_income,
        owner_share,
        rentease_share,
        deductions,
        deduction_notes,
        net_payment,
        payment_method,
        gcash_number,
        gcash_reference,
        payment_status,
        paid_by,
        payment_date,
        notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *
    `;
    
    const values = [
      paymentData.owner_id,
      paymentData.payment_period_start,
      paymentData.payment_period_end,
      paymentData.total_rentals || 0,
      paymentData.total_rental_income || 0,
      paymentData.owner_share,
      paymentData.rentease_share,
      paymentData.deductions || 0,
      paymentData.deduction_notes || null,
      paymentData.net_payment,
      paymentData.payment_method,
      paymentData.gcash_number || null,
      paymentData.gcash_reference || null,
      paymentData.payment_status || 'pending',
      paymentData.paid_by || null,
      paymentData.payment_date || null,
      paymentData.notes || null
    ];
    
    const result = await db.query(query, values);
    return result.rows[0];
  },

  // Find payment by ID
  async findById(id) {
    const query = `
      SELECT 
        op.*,
        vo.first_name || ' ' || vo.last_name as owner_name,
        vo.email as owner_email,
        vo.payment_type,
        u.first_name || ' ' || u.last_name as paid_by_name
      FROM owner_payments op
      JOIN vehicle_owners vo ON vo.id = op.owner_id
      LEFT JOIN users u ON u.id = op.paid_by
      WHERE op.id = $1
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  },

  // Find payments by owner ID
  async findByOwnerId(ownerId, filters = {}) {
    let query = `
      SELECT 
        op.*,
        u.first_name || ' ' || u.last_name as paid_by_name
      FROM owner_payments op
      LEFT JOIN users u ON u.id = op.paid_by
      WHERE op.owner_id = $1
    `;
    
    const params = [ownerId];
    let paramIndex = 2;

    if (filters.payment_status) {
      query += ` AND op.payment_status = $${paramIndex}`;
      params.push(filters.payment_status);
      paramIndex++;
    }

    if (filters.start_date) {
      query += ` AND op.payment_period_start >= $${paramIndex}`;
      params.push(filters.start_date);
      paramIndex++;
    }

    if (filters.end_date) {
      query += ` AND op.payment_period_end <= $${paramIndex}`;
      params.push(filters.end_date);
      paramIndex++;
    }

    query += ` ORDER BY op.created_at DESC`;

    const result = await db.query(query, params);
    return result.rows;
  },

  // Get all payments (admin)
  async findAll(filters = {}) {
    let query = `
      SELECT 
        op.*,
        vo.first_name || ' ' || vo.last_name as owner_name,
        vo.email as owner_email,
        u.first_name || ' ' || u.last_name as paid_by_name
      FROM owner_payments op
      JOIN vehicle_owners vo ON vo.id = op.owner_id
      LEFT JOIN users u ON u.id = op.paid_by
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;

    if (filters.owner_id) {
      query += ` AND op.owner_id = $${paramIndex}`;
      params.push(filters.owner_id);
      paramIndex++;
    }

    if (filters.payment_status) {
      query += ` AND op.payment_status = $${paramIndex}`;
      params.push(filters.payment_status);
      paramIndex++;
    }

    if (filters.start_date) {
      query += ` AND op.payment_period_start >= $${paramIndex}`;
      params.push(filters.start_date);
      paramIndex++;
    }

    if (filters.end_date) {
      query += ` AND op.payment_period_end <= $${paramIndex}`;
      params.push(filters.end_date);
      paramIndex++;
    }

    query += ` ORDER BY op.created_at DESC`;

    const result = await db.query(query, params);
    return result.rows;
  },

  // Update payment status
  async updateStatus(id, status, paidBy = null, notes = null) {
    const query = `
      UPDATE owner_payments 
      SET 
        payment_status = $1,
        paid_by = COALESCE($2, paid_by),
        payment_date = CASE WHEN $1 = 'paid' THEN CURRENT_DATE ELSE payment_date END,
        notes = COALESCE($3, notes)
      WHERE id = $4
      RETURNING *
    `;
    const result = await db.query(query, [status, paidBy, notes, id]);
    return result.rows[0];
  },

  // Calculate payment for period
  async calculateForPeriod(ownerId, startDate, endDate) {
    const query = `
      SELECT 
        vo.payment_type,
        vo.percentage_share,
        vo.fixed_monthly_amount,
        COUNT(DISTINCT res.id) as total_rentals,
        COALESCE(SUM(res.total_amount), 0) as total_rental_income,
        COALESCE(SUM(r.additional_charges), 0) as total_additional_charges
      FROM vehicle_owners vo
      LEFT JOIN vehicles v ON v.owner_id = vo.id
      LEFT JOIN reservations res ON res.vehicle_id = v.id 
        AND res.status = 'completed'
        AND res.pickup_date >= $2
        AND res.dropoff_date <= $3
      LEFT JOIN rentals r ON r.reservation_id = res.id
      WHERE vo.id = $1
      GROUP BY vo.id
    `;
    
    const result = await db.query(query, [ownerId, startDate, endDate]);
    const data = result.rows[0];
    
    if (!data) {
      return null;
    }

    let ownerShare = 0;
    let renteaseShare = 0;

    if (data.payment_type === 'percentage_based') {
      const totalIncome = parseFloat(data.total_rental_income) + parseFloat(data.total_additional_charges);
      ownerShare = totalIncome * (parseFloat(data.percentage_share) / 100);
      renteaseShare = totalIncome - ownerShare;
    } else if (data.payment_type === 'fixed_monthly') {
      ownerShare = parseFloat(data.fixed_monthly_amount || 0);
      renteaseShare = parseFloat(data.total_rental_income) - ownerShare;
    }

    return {
      total_rentals: parseInt(data.total_rentals),
      total_rental_income: parseFloat(data.total_rental_income),
      owner_share: Math.round(ownerShare * 100) / 100,
      rentease_share: Math.round(renteaseShare * 100) / 100,
      payment_type: data.payment_type
    };
  },

  // Get pending payments
  async getPending() {
    const query = `
      SELECT 
        op.*,
        vo.first_name || ' ' || vo.last_name as owner_name,
        vo.email as owner_email,
        vo.gcash_number
      FROM owner_payments op
      JOIN vehicle_owners vo ON vo.id = op.owner_id
      WHERE op.payment_status = 'pending'
      ORDER BY op.payment_period_end ASC
    `;
    const result = await db.query(query);
    return result.rows;
  },

  // Get payment statistics
  async getStatistics(ownerId = null, startDate = null, endDate = null) {
    let query = `
      SELECT 
        COUNT(*) as total_payments,
        COALESCE(SUM(total_rental_income), 0) as total_income,
        COALESCE(SUM(owner_share), 0) as total_owner_share,
        COALESCE(SUM(rentease_share), 0) as total_rentease_share,
        COALESCE(SUM(deductions), 0) as total_deductions,
        COALESCE(AVG(owner_share), 0) as avg_payment,
        COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_count,
        COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending_count
      FROM owner_payments
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;

    if (ownerId) {
      query += ` AND owner_id = $${paramIndex}`;
      params.push(ownerId);
      paramIndex++;
    }

    if (startDate) {
      query += ` AND payment_period_start >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND payment_period_end <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    const result = await db.query(query, params);
    return result.rows[0];
  }
};

module.exports = ownerPaymentModel;