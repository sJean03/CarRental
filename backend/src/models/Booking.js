const db = require('../config/database');
const { calculateDaysBetween } = require('../utils/dateHelpers');
const { calculateBookingPricing } = require('../utils/calculations');

class Booking {
  /**
   * Create a new booking
   */
  static async create(customerId, bookingData) {
    try {
      const {
        car_id,
        owner_id,
        pickup_date,
        return_date,
        branch_id,
        daily_rate,
        payment_plan = 'downpayment',
        installment_months,
        customer_notes
      } = bookingData;

      // Calculate days and pricing
      const total_days = calculateDaysBetween(pickup_date, return_date);
      const pricing = calculateBookingPricing(daily_rate, total_days, payment_plan, installment_months);

      console.log('Booking pricing calculated:', pricing);

      const query = `
        INSERT INTO bookings (
          customer_id, car_id, owner_id, pickup_date, return_date,
          total_days, branch_id, daily_rate, subtotal, platform_fee,
          total_amount, downpayment, remaining_balance, payment_plan, 
          installment_months, monthly_payment, customer_notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING *
      `;

      const values = [
        customerId, car_id, owner_id, pickup_date, return_date,
        total_days, branch_id, daily_rate, pricing.subtotal, pricing.platformFee,
        pricing.totalAmount, pricing.downpayment, pricing.remainingBalance, 
        payment_plan, installment_months, pricing.monthlyPayment,
        customer_notes
      ];

      console.log('Executing booking insert with values:', values);
      const result = await db.query(query, values);
      console.log('Booking created successfully:', result.rows[0]);
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating booking:', error.message, error.code);
      throw error;
    }
  }

  /**
   * Find booking by ID
   */
  static async findById(bookingId) {
    const query = `
      SELECT
        b.*,
        c.make, c.model, c.year, c.license_plate, c.image_urls as car_images,
        u.first_name as customer_first_name, u.last_name as customer_last_name,
        u.email as customer_email, u.phone_number as customer_phone,
        vo.user_id as owner_user_id,
        ou.first_name as owner_first_name, ou.last_name as owner_last_name,
        ou.email as owner_email, ou.phone_number as owner_phone,
        l.name as branch_name, l.address as branch_address, l.city as branch_city
      FROM bookings b
      LEFT JOIN cars c ON b.car_id = c.id
      LEFT JOIN users u ON b.customer_id = u.id
      LEFT JOIN vehicle_owners vo ON b.owner_id = vo.id
      LEFT JOIN users ou ON vo.user_id = ou.id
      LEFT JOIN locations l ON b.branch_id = l.id
      WHERE b.id = $1
    `;

    const result = await db.query(query, [bookingId]);
    return result.rows[0];
  }

  /**
   * Find booking by reference
   */
  static async findByReference(bookingReference) {
    const query = `
      SELECT 
        b.*,
        c.make, c.model, c.year, c.license_plate,
        u.first_name as customer_first_name, u.last_name as customer_last_name
      FROM bookings b
      LEFT JOIN cars c ON b.car_id = c.id
      LEFT JOIN users u ON b.customer_id = u.id
      WHERE b.booking_reference = $1
    `;

    const result = await db.query(query, [bookingReference]);
    return result.rows[0];
  }

  /**
   * Get bookings for a customer
   */
  static async findByCustomer(customerId, filters = {}) {
    let query = `
      SELECT 
        b.*,
        c.make, c.model, c.year, c.image_urls as car_images
      FROM bookings b
      LEFT JOIN cars c ON b.car_id = c.id
      WHERE b.customer_id = $1
    `;

    const values = [customerId];
    let paramCount = 2;

    if (filters.status) {
      query += ` AND b.status = $${paramCount}`;
      values.push(filters.status);
      paramCount++;
    }

    query += ' ORDER BY b.created_at DESC';

    const result = await db.query(query, values);
    return result.rows;
  }

  /**
   * Get bookings for an owner
   */
  static async findByOwner(ownerId, filters = {}) {
    let query = `
      SELECT 
        b.*,
        c.make, c.model, c.year, c.license_plate,
        u.first_name as customer_first_name, u.last_name as customer_last_name,
        u.phone_number as customer_phone
      FROM bookings b
      LEFT JOIN cars c ON b.car_id = c.id
      LEFT JOIN users u ON b.customer_id = u.id
      WHERE b.owner_id = $1
    `;

    const values = [ownerId];
    let paramCount = 2;

    if (filters.status) {
      query += ` AND b.status = $${paramCount}`;
      values.push(filters.status);
      paramCount++;
    }

    query += ' ORDER BY b.pickup_date DESC';

    const result = await db.query(query, values);
    return result.rows;
  }

  /**
   * Update booking status
   */
  static async updateStatus(bookingId, newStatus, additionalData = {}) {
    const updates = ['status = $1::booking_status'];
    const values = [newStatus, bookingId];
    let paramCount = 3;

    const statusTimestamps = {
      'awaiting_vehicle_dropoff': 'owner_dropoff_at',
      'ready_for_pickup': 'customer_pickup_at',
      'returned': 'customer_return_at',
      'completed': 'owner_pickup_at'
    };

    if (statusTimestamps[newStatus]) {
      updates.push(`${statusTimestamps[newStatus]} = CURRENT_TIMESTAMP`);
    }

    Object.keys(additionalData).forEach(key => {
      updates.push(`${key} = $${paramCount}`);
      values.push(additionalData[key]);
      paramCount++;
    });

    const query = `
      UPDATE bookings 
      SET ${updates.join(', ')}
      WHERE id = $2
      RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows[0];
  }

  /**
   * Cancel booking
   */
  static async cancel(bookingId, cancellationReason, refundAmount = 0) {
    const query = `
      UPDATE bookings
      SET
        status = CASE
          WHEN $2 > 0 THEN 'cancelled_with_refund'::booking_status
          ELSE 'cancelled'::booking_status
        END,
        cancelled_at = CURRENT_TIMESTAMP,
        cancellation_reason = $3,
        refund_amount = $2
      WHERE id = $1
      RETURNING *
    `;

    const result = await db.query(query, [bookingId, refundAmount, cancellationReason]);
    return result.rows[0];
  }

  /**
   * Record late return
   */
  static async recordLateReturn(bookingId, actualReturnDate, daysLate, lateFee) {
    const query = `
      UPDATE bookings 
      SET 
        actual_return_date = $2,
        days_late = $3,
        late_fee = $4
      WHERE id = $1
      RETURNING *
    `;

    const result = await db.query(query, [bookingId, actualReturnDate, daysLate, lateFee]);
    return result.rows[0];
  }

  /**
   * Get upcoming bookings
   */
  static async getUpcomingBookings(daysAhead = 1) {
    const query = `
      SELECT 
        b.*,
        u.email as customer_email,
        c.make, c.model
      FROM bookings b
      JOIN users u ON b.customer_id = u.id
      JOIN cars c ON b.car_id = c.id
      WHERE b.status IN ('confirmed', 'ready_for_pickup')
      AND b.pickup_date = CURRENT_DATE + $1
    `;

    const result = await db.query(query, [daysAhead]);
    return result.rows;
  }

  /**
   * Get active bookings
   */
  static async getActiveBookings() {
    const query = `
      SELECT 
        b.*,
        c.make, c.model, c.license_plate
      FROM bookings b
      JOIN cars c ON b.car_id = c.id
      WHERE b.status = 'active'
      AND b.return_date >= CURRENT_DATE
    `;

    const result = await db.query(query);
    return result.rows;
  }

  /**
   * Get overdue bookings
   */
  static async getOverdueBookings() {
    const query = `
      SELECT 
        b.*,
        u.email as customer_email, u.phone_number as customer_phone,
        c.make, c.model, c.license_plate
      FROM bookings b
      JOIN users u ON b.customer_id = u.id
      JOIN cars c ON b.car_id = c.id
      WHERE b.status = 'active'
      AND b.return_date < CURRENT_DATE
    `;

    const result = await db.query(query);
    return result.rows;
  }

  /**
   * Get booking statistics
   */
  static async getStats(filters = {}) {
    let whereClause = 'WHERE 1=1';
    const values = [];
    let paramCount = 1;

    if (filters.customer_id) {
      whereClause += ` AND customer_id = $${paramCount}`;
      values.push(filters.customer_id);
      paramCount++;
    }

    if (filters.owner_id) {
      whereClause += ` AND owner_id = $${paramCount}`;
      values.push(filters.owner_id);
      paramCount++;
    }

    const query = `
      SELECT
        COUNT(*) as total_bookings,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_bookings,
        COUNT(*) FILTER (WHERE status IN ('cancelled', 'cancelled_with_refund')) as cancelled_bookings,
        COUNT(*) FILTER (WHERE status = 'active') as active_bookings,
        SUM(total_amount) as total_revenue,
        AVG(total_amount) as avg_booking_value
      FROM bookings
      ${whereClause}
    `;

    const result = await db.query(query, values);
    return result.rows[0];
  }

  /**
   * Get bookings ready for active
   */
  static async getBookingsReadyForActive(bufferMinutes = 15) {
    const query = `
      SELECT
        b.*,
        c.make, c.model, c.license_plate,
        u.email as customer_email, u.first_name as customer_first_name
      FROM bookings b
      JOIN cars c ON b.car_id = c.id
      JOIN users u ON b.customer_id = u.id
      WHERE b.status = 'confirmed'
      AND b.pickup_date <= (CURRENT_TIMESTAMP + INTERVAL '${bufferMinutes} minutes')::date
    `;

    const result = await db.query(query);
    return result.rows;
  }

  /**
   * Get bookings ready for return
   */
  static async getBookingsReadyForReturn(bufferMinutes = 15) {
    const query = `
      SELECT
        b.*,
        c.make, c.model, c.license_plate,
        u.email as customer_email, u.first_name as customer_first_name,
        ou.email as owner_email
      FROM bookings b
      JOIN cars c ON b.car_id = c.id
      JOIN users u ON b.customer_id = u.id
      JOIN vehicle_owners vo ON b.owner_id = vo.id
      JOIN users ou ON vo.user_id = ou.id
      WHERE b.status = 'active'
      AND b.return_date <= (CURRENT_TIMESTAMP + INTERVAL '${bufferMinutes} minutes')::date
    `;

    const result = await db.query(query);
    return result.rows;
  }

  /**
   * Calculate late fee
   */
  static async calculateLateFee(bookingId, ratePerDay = 0.20, maxPercentage = 1.0) {
    const booking = await this.findById(bookingId);

    if (!booking) {
      throw new Error('Booking not found');
    }

    const returnDate = new Date(booking.return_date);
    const currentDate = new Date();
    const msPerDay = 1000 * 60 * 60 * 24;
    const daysLate = Math.floor((currentDate - returnDate) / msPerDay);

    if (daysLate <= 0) {
      return { daysLate: 0, lateFee: 0 };
    }

    const dailyRate = parseFloat(booking.daily_rate);
    const lateFeePerDay = dailyRate * ratePerDay;
    let lateFee = lateFeePerDay * daysLate;
    const maxLateFee = parseFloat(booking.total_amount) * maxPercentage;
    lateFee = Math.min(lateFee, maxLateFee);

    return {
      daysLate,
      lateFee: Math.round(lateFee * 100) / 100,
      dailyRate,
      lateFeePerDay: Math.round(lateFeePerDay * 100) / 100
    };
  }

  /**
   * Get bookings by status
   */
  static async getBookingsByStatus(statuses = []) {
    const query = `
      SELECT
        b.*,
        c.make, c.model, c.license_plate,
        u.first_name as customer_first_name, u.last_name as customer_last_name,
        u.email as customer_email
      FROM bookings b
      JOIN cars c ON b.car_id = c.id
      JOIN users u ON b.customer_id = u.id
      WHERE b.status = ANY($1::booking_status[])
      ORDER BY b.pickup_date DESC
    `;

    const result = await db.query(query, [statuses]);
    return result.rows;
  }

  /**
   * Get lifecycle stats
   */
  static async getLifecycleStats() {
    const query = `
      SELECT
        status,
        COUNT(*) as count,
        SUM(total_amount) as total_value
      FROM bookings
      WHERE status NOT IN ('cancelled', 'cancelled_with_refund', 'completed')
      GROUP BY status
      ORDER BY
        CASE status
          WHEN 'pending_payment' THEN 1
          WHEN 'pending_owner_confirmation' THEN 2
          WHEN 'confirmed' THEN 3
          WHEN 'active' THEN 4
          WHEN 'returned' THEN 5
          ELSE 6
        END
    `;

    const result = await db.query(query);
    return result.rows;
  }

  /**
   * Mark remaining balance as paid
   */
  static async markRemainingBalancePaid(bookingId) {
    const query = `
      UPDATE bookings
      SET remaining_balance_paid = true
      WHERE id = $1
      RETURNING *
    `;

    const result = await db.query(query, [bookingId]);
    return result.rows[0];
  }
}

module.exports = Booking;