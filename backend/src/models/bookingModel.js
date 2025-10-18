const db = require('../config/database');

const bookingModel = {
  // Create new reservation
  async create(bookingData) {
    const query = `
      INSERT INTO reservations (
        user_id, 
        vehicle_id, 
        pickup_location_id, 
        dropoff_location_id, 
        pickup_date, 
        dropoff_date, 
        insurance_plan_id,
        base_amount,
        insurance_amount,
        total_amount,
        deposit_amount,
        booking_comments,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;
    
    const values = [
      bookingData.user_id,
      bookingData.vehicle_id,
      bookingData.pickup_location_id,
      bookingData.dropoff_location_id,
      bookingData.pickup_date,
      bookingData.dropoff_date,
      bookingData.insurance_plan_id || null,
      bookingData.base_amount,
      bookingData.insurance_amount || 0,
      bookingData.total_amount,
      bookingData.deposit_amount, // 20% auto-calculated by trigger
      bookingData.booking_comments || null,
      'pending_payment'
    ];
    
    const result = await db.query(query, values);
    return result.rows[0];
  },

  // Get booking by ID with details
  async findById(id) {
    const query = `
      SELECT 
        r.*,
        u.email as customer_email,
        u.first_name as customer_first_name,
        u.last_name as customer_last_name,
        u.phone_number as customer_phone,
        v.make, v.model, v.year, v.license_plate, v.daily_rate, v.hourly_late_fee,
        pl.name as pickup_location_name,
        pl.address as pickup_location_address,
        dl.name as dropoff_location_name,
        dl.address as dropoff_location_address,
        ip.name as insurance_plan_name,
        ip.daily_rate as insurance_daily_rate
      FROM reservations r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN vehicles v ON r.vehicle_id = v.id
      LEFT JOIN locations pl ON r.pickup_location_id = pl.id
      LEFT JOIN locations dl ON r.dropoff_location_id = dl.id
      LEFT JOIN insurance_plans ip ON r.insurance_plan_id = ip.id
      WHERE r.id = $1
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  },

  // Get user's bookings
  async findByUserId(userId, filters = {}) {
    let query = `
      SELECT 
        r.*,
        v.make, v.model, v.year, v.license_plate, v.daily_rate,
        pl.name as pickup_location_name,
        dl.name as dropoff_location_name
      FROM reservations r
      LEFT JOIN vehicles v ON r.vehicle_id = v.id
      LEFT JOIN locations pl ON r.pickup_location_id = pl.id
      LEFT JOIN locations dl ON r.dropoff_location_id = dl.id
      WHERE r.user_id = $1
    `;
    
    const params = [userId];
    let paramIndex = 2;

    // Filter by status
    if (filters.status) {
      query += ` AND r.status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    query += ` ORDER BY r.created_at DESC`;

    const result = await db.query(query, params);
    return result.rows;
  },

  // Get all bookings (admin only)
  async findAll(filters = {}) {
    let query = `
      SELECT 
        r.*,
        u.email as customer_email,
        u.first_name as customer_first_name,
        u.last_name as customer_last_name,
        v.make, v.model, v.license_plate,
        pl.name as pickup_location_name,
        dl.name as dropoff_location_name
      FROM reservations r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN vehicles v ON r.vehicle_id = v.id
      LEFT JOIN locations pl ON r.pickup_location_id = pl.id
      LEFT JOIN locations dl ON r.dropoff_location_id = dl.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;

    if (filters.status) {
      query += ` AND r.status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters.vehicle_id) {
      query += ` AND r.vehicle_id = $${paramIndex}`;
      params.push(filters.vehicle_id);
      paramIndex++;
    }

    query += ` ORDER BY r.created_at DESC`;

    const result = await db.query(query, params);
    return result.rows;
  },

  // Update booking status
  async updateStatus(id, status) {
    const query = `
      UPDATE reservations 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    const result = await db.query(query, [status, id]);
    return result.rows[0];
  },

  // Cancel booking
  async cancel(id, userId) {
    const query = `
      UPDATE reservations 
      SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $2 AND status IN ('pending_payment', 'confirmed')
      RETURNING *
    `;
    const result = await db.query(query, [id, userId]);
    return result.rows[0];
  },

  // Calculate rental details
  calculateRentalCost(dailyRate, insuranceRate, numDays) {
    const baseAmount = dailyRate * numDays;
    const insuranceAmount = insuranceRate * numDays;
    const totalAmount = baseAmount + insuranceAmount;
    const depositAmount = Math.round(totalAmount * 0.20 * 100) / 100; // 20% deposit
    
    return {
      num_days: numDays,
      base_amount: baseAmount,
      insurance_amount: insuranceAmount,
      total_amount: totalAmount,
      deposit_amount: depositAmount,
      balance_due: totalAmount - depositAmount
    };
  }
};

module.exports = bookingModel;