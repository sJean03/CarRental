const db = require('../config/database');
const getRevenueReport = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'month' } = req.query;

    let dateFormat;
    switch (groupBy) {
      case 'day':
        dateFormat = 'YYYY-MM-DD';
        break;
      case 'week':
        dateFormat = 'YYYY-IW';
        break;
      case 'month':
        dateFormat = 'YYYY-MM';
        break;
      case 'year':
        dateFormat = 'YYYY';
        break;
      default:
        dateFormat = 'YYYY-MM';
    }

    const query = `
      SELECT 
        TO_CHAR(res.pickup_date, $1) as period,
        COUNT(DISTINCT res.id) as total_bookings,
        COUNT(DISTINCT CASE WHEN res.status = 'completed' THEN res.id END) as completed_bookings,
        COUNT(DISTINCT CASE WHEN res.status = 'cancelled' THEN res.id END) as cancelled_bookings,
        COALESCE(SUM(res.total_amount), 0) as total_revenue,
        COALESCE(SUM(res.deposit_amount), 0) as total_deposits,
        COALESCE(SUM(res.insurance_amount), 0) as insurance_revenue,
        COALESCE(SUM(r.additional_charges), 0) as additional_charges,
        COALESCE(SUM(r.late_return_fee), 0) as late_fees,
        COALESCE(SUM(r.damage_charge), 0) as damage_charges
      FROM reservations res
      LEFT JOIN rentals r ON r.reservation_id = res.id
      WHERE res.pickup_date >= $2 
        AND res.pickup_date <= $3
      GROUP BY period
      ORDER BY period
    `;

    const result = await db.query(query, [
      dateFormat,
      startDate || '2024-01-01',
      endDate || new Date().toISOString()
    ]);

    // Get totals
    const totalsQuery = `
      SELECT 
        COUNT(DISTINCT res.id) as total_bookings,
        COALESCE(SUM(res.total_amount), 0) as total_revenue,
        COALESCE(AVG(res.total_amount), 0) as average_booking_value
      FROM reservations res
      WHERE res.pickup_date >= $1 
        AND res.pickup_date <= $2
    `;

    const totalsResult = await db.query(totalsQuery, [
      startDate || '2024-01-01',
      endDate || new Date().toISOString()
    ]);

    res.json({
      report: result.rows,
      totals: totalsResult.rows[0]
    });
  } catch (error) {
    console.error('Error generating revenue report:', error);
    res.status(500).json({ error: 'Failed to generate revenue report' });
  }
};

// @desc    Get fleet utilization report
// @route   GET /api/reports/fleet-utilization
// @access  Private (Admin)
const getFleetUtilizationReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const query = `
      SELECT 
        v.id,
        v.make,
        v.model,
        v.license_plate,
        v.daily_rate,
        vc.name as category,
        COUNT(DISTINCT res.id) as total_bookings,
        COUNT(DISTINCT CASE WHEN res.status = 'completed' THEN res.id END) as completed_rentals,
        COALESCE(SUM(
          EXTRACT(EPOCH FROM (res.dropoff_date - res.pickup_date)) / 86400
        ), 0) as total_rental_days,
        COALESCE(SUM(res.total_amount), 0) as total_revenue,
        ROUND(
          COALESCE(SUM(
            EXTRACT(EPOCH FROM (res.dropoff_date - res.pickup_date)) / 86400
          ), 0) / 
          NULLIF(EXTRACT(EPOCH FROM ($2::timestamp - $1::timestamp)) / 86400, 0) * 100,
          2
        ) as utilization_rate
      FROM vehicles v
      LEFT JOIN vehicle_categories vc ON vc.id = v.category_id
      LEFT JOIN reservations res ON res.vehicle_id = v.id 
        AND res.pickup_date >= $1 
        AND res.pickup_date <= $2
        AND res.status != 'cancelled'
      GROUP BY v.id, vc.name
      ORDER BY utilization_rate DESC
    `;

    const result = await db.query(query, [
      startDate || '2024-01-01',
      endDate || new Date().toISOString()
    ]);

    res.json({
      vehicles: result.rows,
      summary: {
        total_vehicles: result.rows.length,
        average_utilization: result.rows.reduce((sum, v) => sum + parseFloat(v.utilization_rate || 0), 0) / result.rows.length
      }
    });
  } catch (error) {
    console.error('Error generating fleet utilization report:', error);
    res.status(500).json({ error: 'Failed to generate fleet utilization report' });
  }
};

// @desc    Get customer analytics
// @route   GET /api/reports/customer-analytics
// @access  Private (Admin)
const getCustomerAnalytics = async (req, res) => {
  try {
    const query = `
      SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.created_at as registration_date,
        COUNT(DISTINCT res.id) as total_bookings,
        COUNT(DISTINCT CASE WHEN res.status = 'completed' THEN res.id END) as completed_bookings,
        COUNT(DISTINCT CASE WHEN res.status = 'cancelled' THEN res.id END) as cancelled_bookings,
        COALESCE(SUM(res.total_amount), 0) as lifetime_value,
        COALESCE(AVG(res.total_amount), 0) as average_booking_value,
        COALESCE(AVG(rev.rating), 0) as average_rating_given,
        MAX(res.created_at) as last_booking_date
      FROM users u
      LEFT JOIN reservations res ON res.user_id = u.id
      LEFT JOIN reviews rev ON rev.user_id = u.id
      WHERE u.role = 'customer'
      GROUP BY u.id
      ORDER BY lifetime_value DESC
      LIMIT 100
    `;

    const result = await db.query(query);

    // Get summary statistics
    const summaryQuery = `
      SELECT 
        COUNT(DISTINCT u.id) as total_customers,
        COUNT(DISTINCT CASE WHEN res.created_at >= NOW() - INTERVAL '30 days' THEN u.id END) as active_customers_30d,
        COALESCE(AVG(booking_count.count), 0) as avg_bookings_per_customer
      FROM users u
      LEFT JOIN (
        SELECT user_id, COUNT(*) as count
        FROM reservations
        GROUP BY user_id
      ) booking_count ON booking_count.user_id = u.id
      WHERE u.role = 'customer'
    `;

    const summaryResult = await db.query(summaryQuery);

    res.json({
      customers: result.rows,
      summary: summaryResult.rows[0]
    });
  } catch (error) {
    console.error('Error generating customer analytics:', error);
    res.status(500).json({ error: 'Failed to generate customer analytics' });
  }
};

// @desc    Get payment analytics
// @route   GET /api/reports/payment-analytics
// @access  Private (Admin)
const getPaymentAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const query = `
      SELECT 
        payment_method,
        payment_type,
        COUNT(*) as transaction_count,
        COALESCE(SUM(amount), 0) as total_amount,
        COALESCE(AVG(amount), 0) as average_amount,
        COUNT(CASE WHEN payment_status = 'completed' THEN 1 END) as successful_payments,
        COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending_payments,
        COUNT(CASE WHEN payment_status = 'refunded' THEN 1 END) as refunded_payments
      FROM payments
      WHERE created_at >= $1 
        AND created_at <= $2
      GROUP BY payment_method, payment_type
      ORDER BY total_amount DESC
    `;

    const result = await db.query(query, [
      startDate || '2024-01-01',
      endDate || new Date().toISOString()
    ]);

    res.json({
      analytics: result.rows
    });
  } catch (error) {
    console.error('Error generating payment analytics:', error);
    res.status(500).json({ error: 'Failed to generate payment analytics' });
  }
};

// @desc    Get owner earnings report
// @route   GET /api/reports/owner-earnings
// @access  Private (Admin)
const getOwnerEarningsReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const query = `
      SELECT 
        vo.id,
        vo.first_name || ' ' || vo.last_name as owner_name,
        vo.email,
        vo.payment_type,
        vo.percentage_share,
        COUNT(DISTINCT v.id) as total_vehicles,
        COUNT(DISTINCT op.id) as total_payments,
        COALESCE(SUM(op.total_rental_income), 0) as total_rental_income,
        COALESCE(SUM(op.owner_share), 0) as total_owner_share,
        COALESCE(SUM(op.rentease_share), 0) as total_rentease_share,
        COALESCE(SUM(op.deductions), 0) as total_deductions,
        COALESCE(SUM(op.net_payment), 0) as total_net_payment,
        COUNT(CASE WHEN op.payment_status = 'pending' THEN 1 END) as pending_payments_count,
        COALESCE(SUM(CASE WHEN op.payment_status = 'pending' THEN op.net_payment ELSE 0 END), 0) as pending_amount
      FROM vehicle_owners vo
      LEFT JOIN vehicles v ON v.owner_id = vo.id
      LEFT JOIN owner_payments op ON op.owner_id = vo.id
        AND op.payment_period_start >= $1
        AND op.payment_period_end <= $2
      GROUP BY vo.id
      ORDER BY total_rental_income DESC
    `;

    const result = await db.query(query, [
      startDate || '2024-01-01',
      endDate || new Date().toISOString()
    ]);

    res.json({
      owners: result.rows,
      summary: {
        total_owners: result.rows.length,
        total_rental_income: result.rows.reduce((sum, o) => sum + parseFloat(o.total_rental_income || 0), 0),
        total_owner_share: result.rows.reduce((sum, o) => sum + parseFloat(o.total_owner_share || 0), 0),
        total_rentease_share: result.rows.reduce((sum, o) => sum + parseFloat(o.total_rentease_share || 0), 0)
      }
    });
  } catch (error) {
    console.error('Error generating owner earnings report:', error);
    res.status(500).json({ error: 'Failed to generate owner earnings report' });
  }
};

module.exports = {
  getRevenueReport,
  getFleetUtilizationReport,
  getCustomerAnalytics,
  getPaymentAnalytics,
  getOwnerEarningsReport
};
