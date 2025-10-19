const db = require('../config/database');

// @desc    Get owner dashboard statistics
// @route   GET /api/owners/dashboard
// @access  Private (Owner)
const getOwnerDashboard = async (req, res) => {
  try {
    const ownerId = req.user.ownerId; // Assuming you have ownerId in JWT

    // Get owner info with earnings
    const ownerQuery = `
      SELECT 
        vo.*,
        COUNT(DISTINCT v.id) as total_vehicles,
        COUNT(DISTINCT r.id) as total_rentals,
        COALESCE(SUM(op.owner_share), 0) as total_earned,
        COALESCE(SUM(CASE WHEN op.payment_status = 'pending' THEN op.owner_share ELSE 0 END), 0) as pending_payments
      FROM vehicle_owners vo
      LEFT JOIN vehicles v ON v.owner_id = vo.id
      LEFT JOIN reservations res ON res.vehicle_id = v.id
      LEFT JOIN rentals r ON r.reservation_id = res.id
      LEFT JOIN owner_payments op ON op.owner_id = vo.id
      WHERE vo.id = $1
      GROUP BY vo.id
    `;

    const result = await db.query(ownerQuery, [ownerId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Owner not found' });
    }

    // Get recent rentals
    const recentRentalsQuery = `
      SELECT 
        r.id,
        v.make,
        v.model,
        v.license_plate,
        res.booking_reference,
        res.pickup_date,
        res.dropoff_date,
        res.total_amount,
        res.status,
        u.first_name || ' ' || u.last_name as customer_name
      FROM rentals r
      JOIN reservations res ON res.id = r.reservation_id
      JOIN vehicles v ON v.id = res.vehicle_id
      JOIN users u ON u.id = res.user_id
      WHERE v.owner_id = $1
      ORDER BY r.created_at DESC
      LIMIT 10
    `;

    const recentRentals = await db.query(recentRentalsQuery, [ownerId]);

    res.json({
      owner: result.rows[0],
      recentRentals: recentRentals.rows
    });
  } catch (error) {
    console.error('Error fetching owner dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
};

// @desc    Get owner's vehicles
// @route   GET /api/owners/vehicles
// @access  Private (Owner)
const getOwnerVehicles = async (req, res) => {
  try {
    const ownerId = req.user.ownerId;

    const query = `
      SELECT 
        v.*,
        vc.name as category_name,
        l.name as location_name,
        COUNT(DISTINCT res.id) as total_bookings,
        COALESCE(AVG(rev.rating), 0) as average_rating,
        COUNT(DISTINCT rev.id) as review_count
      FROM vehicles v
      LEFT JOIN vehicle_categories vc ON vc.id = v.category_id
      LEFT JOIN locations l ON l.id = v.current_location_id
      LEFT JOIN reservations res ON res.vehicle_id = v.id AND res.status != 'cancelled'
      LEFT JOIN reviews rev ON rev.vehicle_id = v.id
      WHERE v.owner_id = $1
      GROUP BY v.id, vc.name, l.name
      ORDER BY v.created_at DESC
    `;

    const result = await db.query(query, [ownerId]);

    res.json({
      vehicles: result.rows
    });
  } catch (error) {
    console.error('Error fetching owner vehicles:', error);
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
};

// @desc    Get owner's payment history
// @route   GET /api/owners/payments
// @access  Private (Owner)
const getOwnerPayments = async (req, res) => {
  try {
    const ownerId = req.user.ownerId;
    const { status, startDate, endDate, page = 1, limit = 10 } = req.query;

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

    if (status) {
      query += ` AND op.payment_status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (startDate) {
      query += ` AND op.payment_period_start >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND op.payment_period_end <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    query += ` ORDER BY op.created_at DESC`;

    // Pagination
    const offset = (page - 1) * limit;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) 
      FROM owner_payments 
      WHERE owner_id = $1
      ${status ? 'AND payment_status = $2' : ''}
    `;
    const countParams = [ownerId];
    if (status) countParams.push(status);
    const countResult = await db.query(countQuery, countParams);

    res.json({
      payments: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count)
      }
    });
  } catch (error) {
    console.error('Error fetching owner payments:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
};

// @desc    Get vehicle performance analytics
// @route   GET /api/owners/vehicles/:vehicleId/analytics
// @access  Private (Owner)
const getVehicleAnalytics = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const ownerId = req.user.ownerId;

    // Verify ownership
    const ownershipCheck = await db.query(
      'SELECT id FROM vehicles WHERE id = $1 AND owner_id = $2',
      [vehicleId, ownerId]
    );

    if (ownershipCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Unauthorized access to vehicle' });
    }

    // Get analytics data
    const analyticsQuery = `
      SELECT 
        COUNT(res.id) as total_bookings,
        COUNT(CASE WHEN res.status = 'completed' THEN 1 END) as completed_rentals,
        COUNT(CASE WHEN res.status = 'cancelled' THEN 1 END) as cancelled_bookings,
        COALESCE(SUM(res.total_amount), 0) as total_revenue,
        COALESCE(AVG(rev.rating), 0) as average_rating,
        COUNT(DISTINCT rev.id) as total_reviews,
        COALESCE(AVG(EXTRACT(EPOCH FROM (res.dropoff_date - res.pickup_date))/86400), 0) as avg_rental_days
      FROM vehicles v
      LEFT JOIN reservations res ON res.vehicle_id = v.id
      LEFT JOIN reviews rev ON rev.vehicle_id = v.id
      WHERE v.id = $1
      GROUP BY v.id
    `;

    const analyticsResult = await db.query(analyticsQuery, [vehicleId]);

    // Get monthly revenue trend (last 6 months)
    const trendQuery = `
      SELECT 
        TO_CHAR(res.pickup_date, 'YYYY-MM') as month,
        COUNT(res.id) as bookings,
        COALESCE(SUM(res.total_amount), 0) as revenue
      FROM reservations res
      WHERE res.vehicle_id = $1 
        AND res.pickup_date >= NOW() - INTERVAL '6 months'
        AND res.status != 'cancelled'
      GROUP BY TO_CHAR(res.pickup_date, 'YYYY-MM')
      ORDER BY month DESC
    `;

    const trendResult = await db.query(trendQuery, [vehicleId]);

    // Get maintenance costs
    const maintenanceQuery = `
      SELECT 
        COUNT(*) as total_maintenance,
        COALESCE(SUM(cost), 0) as total_maintenance_cost
      FROM maintenance_records
      WHERE vehicle_id = $1
    `;

    const maintenanceResult = await db.query(maintenanceQuery, [vehicleId]);

    res.json({
      analytics: analyticsResult.rows[0],
      trend: trendResult.rows,
      maintenance: maintenanceResult.rows[0]
    });
  } catch (error) {
    console.error('Error fetching vehicle analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};

// @desc    Get earnings summary
// @route   GET /api/owners/earnings/summary
// @access  Private (Owner)
const getEarningsSummary = async (req, res) => {
  try {
    const ownerId = req.user.ownerId;
    const { year = new Date().getFullYear() } = req.query;

    const query = `
      SELECT 
        TO_CHAR(payment_period_start, 'Mon') as month,
        EXTRACT(MONTH FROM payment_period_start) as month_number,
        SUM(total_rental_income) as rental_income,
        SUM(owner_share) as owner_earnings,
        SUM(rentease_share) as rentease_share,
        SUM(deductions) as total_deductions,
        COUNT(*) as payment_count
      FROM owner_payments
      WHERE owner_id = $1 
        AND EXTRACT(YEAR FROM payment_period_start) = $2
      GROUP BY month_number, TO_CHAR(payment_period_start, 'Mon')
      ORDER BY month_number
    `;

    const result = await db.query(query, [ownerId, year]);

    // Get year-to-date totals
    const ytdQuery = `
      SELECT 
        SUM(total_rental_income) as ytd_rental_income,
        SUM(owner_share) as ytd_owner_earnings,
        SUM(deductions) as ytd_deductions,
        COUNT(DISTINCT payment_period_start) as total_periods
      FROM owner_payments
      WHERE owner_id = $1 
        AND EXTRACT(YEAR FROM payment_period_start) = $2
    `;

    const ytdResult = await db.query(ytdQuery, [ownerId, year]);

    res.json({
      monthlyEarnings: result.rows,
      yearToDate: ytdResult.rows[0]
    });
  } catch (error) {
    console.error('Error fetching earnings summary:', error);
    res.status(500).json({ error: 'Failed to fetch earnings summary' });
  }
};

module.exports = {
  getOwnerDashboard,
  getOwnerVehicles,
  getOwnerPayments,
  getVehicleAnalytics,
  getEarningsSummary
};