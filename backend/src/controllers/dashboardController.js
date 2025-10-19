const db = require('../config/database'); 

const getAdminDashboard = async (req, res) => {
  try {
    // Overall statistics
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM vehicles WHERE status = 'available') as available_vehicles,
        (SELECT COUNT(*) FROM vehicles WHERE status = 'rented') as rented_vehicles,
        (SELECT COUNT(*) FROM vehicles WHERE status = 'maintenance') as maintenance_vehicles,
        (SELECT COUNT(*) FROM reservations WHERE status = 'pending_payment') as pending_bookings,
        (SELECT COUNT(*) FROM reservations WHERE status = 'confirmed') as confirmed_bookings,
        (SELECT COUNT(*) FROM reservations WHERE status = 'active') as active_rentals,
        (SELECT COUNT(*) FROM users WHERE role = 'customer' AND created_at >= NOW() - INTERVAL '30 days') as new_customers_30d,
        (SELECT COUNT(*) FROM payments WHERE payment_status = 'pending') as pending_payments,
        (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE payment_status = 'completed' AND payment_date >= NOW() - INTERVAL '30 days') as revenue_30d,
        (SELECT COALESCE(SUM(total_amount), 0) FROM reservations WHERE pickup_date >= NOW() - INTERVAL '30 days') as bookings_value_30d
    `;

    const statsResult = await db.query(statsQuery);

    // Recent bookings
    const recentBookingsQuery = `
      SELECT 
        res.*,
        u.first_name || ' ' || u.last_name as customer_name,
        v.make,
        v.model,
        v.license_plate
      FROM reservations res
      JOIN users u ON u.id = res.user_id
      JOIN vehicles v ON v.id = res.vehicle_id
      ORDER BY res.created_at DESC
      LIMIT 10
    `;

    const recentBookingsResult = await db.query(recentBookingsQuery);

    // Revenue trend (last 7 days)
    const revenueTrendQuery = `
      SELECT 
        DATE(payment_date) as date,
        COUNT(*) as payment_count,
        COALESCE(SUM(amount), 0) as daily_revenue
      FROM payments
      WHERE payment_status = 'completed'
        AND payment_date >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(payment_date)
      ORDER BY date
    `;

    const revenueTrendResult = await db.query(revenueTrendQuery);

    // Top performing vehicles
    const topVehiclesQuery = `
      SELECT 
        v.id,
        v.make,
        v.model,
        v.license_plate,
        COUNT(res.id) as booking_count,
        COALESCE(SUM(res.total_amount), 0) as total_revenue,
        COALESCE(AVG(rev.rating), 0) as avg_rating
      FROM vehicles v
      LEFT JOIN reservations res ON res.vehicle_id = v.id 
        AND res.created_at >= NOW() - INTERVAL '30 days'
      LEFT JOIN reviews rev ON rev.vehicle_id = v.id
      GROUP BY v.id
      ORDER BY booking_count DESC
      LIMIT 5
    `;

    const topVehiclesResult = await db.query(topVehiclesQuery);

    // Upcoming maintenance
    const upcomingMaintenanceQuery = `
      SELECT 
        v.id,
        v.make,
        v.model,
        v.license_plate,
        m.next_service_date,
        m.maintenance_type
      FROM vehicles v
      JOIN maintenance_records m ON m.vehicle_id = v.id
      WHERE m.next_service_date IS NOT NULL
        AND m.next_service_date <= NOW() + INTERVAL '7 days'
      ORDER BY m.next_service_date
      LIMIT 5
    `;

    const upcomingMaintenanceResult = await db.query(upcomingMaintenanceQuery);

    res.json({
      statistics: statsResult.rows[0],
      recentBookings: recentBookingsResult.rows,
      revenueTrend: revenueTrendResult.rows,
      topVehicles: topVehiclesResult.rows,
      upcomingMaintenance: upcomingMaintenanceResult.rows
    });
  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
};

// @desc    Get customer dashboard
// @route   GET /api/dashboard/customer
// @access  Private (Customer)
const getCustomerDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    // Customer statistics
    const statsQuery = `
      SELECT 
        COUNT(DISTINCT CASE WHEN res.status = 'active' THEN res.id END) as active_rentals,
        COUNT(DISTINCT CASE WHEN res.status = 'confirmed' THEN res.id END) as upcoming_bookings,
        COUNT(DISTINCT CASE WHEN res.status = 'completed' THEN res.id END) as completed_rentals,
        COUNT(DISTINCT CASE WHEN res.status = 'cancelled' THEN res.id END) as cancelled_bookings,
        COALESCE(SUM(CASE WHEN res.status = 'completed' THEN res.total_amount ELSE 0 END), 0) as total_spent,
        COUNT(DISTINCT rev.id) as total_reviews
      FROM reservations res
      LEFT JOIN reviews rev ON rev.user_id = $1
      WHERE res.user_id = $1
    `;

    const statsResult = await db.query(statsQuery, [userId]);

    // Active rentals
    const activeRentalsQuery = `
      SELECT 
        res.*,
        v.make,
        v.model,
        v.license_plate,
        v.image_urls,
        l.name as pickup_location_name,
        r.actual_pickup_date
      FROM reservations res
      JOIN vehicles v ON v.id = res.vehicle_id
      LEFT JOIN locations l ON l.id = res.pickup_location_id
      LEFT JOIN rentals r ON r.reservation_id = res.id
      WHERE res.user_id = $1 AND res.status = 'active'
      ORDER BY res.pickup_date
    `;

    const activeRentalsResult = await db.query(activeRentalsQuery, [userId]);

    // Upcoming bookings
    const upcomingBookingsQuery = `
      SELECT 
        res.*,
        v.make,
        v.model,
        v.license_plate,
        v.image_urls,
        l.name as pickup_location_name
      FROM reservations res
      JOIN vehicles v ON v.id = res.vehicle_id
      LEFT JOIN locations l ON l.id = res.pickup_location_id
      WHERE res.user_id = $1 
        AND res.status IN ('pending_payment', 'confirmed')
        AND res.pickup_date >= NOW()
      ORDER BY res.pickup_date
      LIMIT 5
    `;

    const upcomingBookingsResult = await db.query(upcomingBookingsQuery, [userId]);

    // Recent history
    const recentHistoryQuery = `
      SELECT 
        res.*,
        v.make,
        v.model,
        v.license_plate,
        v.image_urls,
        r.actual_dropoff_date,
        r.additional_charges,
        EXISTS(SELECT 1 FROM reviews WHERE rental_id = r.id) as has_review
      FROM reservations res
      JOIN vehicles v ON v.id = res.vehicle_id
      LEFT JOIN rentals r ON r.reservation_id = res.id
      WHERE res.user_id = $1 AND res.status = 'completed'
      ORDER BY r.actual_dropoff_date DESC
      LIMIT 5
    `;

    const recentHistoryResult = await db.query(recentHistoryQuery, [userId]);

    // Favorite vehicles (most rented)
    const favoriteVehiclesQuery = `
      SELECT 
        v.id,
        v.make,
        v.model,
        v.license_plate,
        v.image_urls,
        v.daily_rate,
        COUNT(res.id) as rental_count,
        COALESCE(AVG(rev.rating), 0) as avg_rating
      FROM vehicles v
      JOIN reservations res ON res.vehicle_id = v.id AND res.user_id = $1
      LEFT JOIN reviews rev ON rev.vehicle_id = v.id
      GROUP BY v.id
      ORDER BY rental_count DESC
      LIMIT 3
    `;

    const favoriteVehiclesResult = await db.query(favoriteVehiclesQuery, [userId]);

    res.json({
      statistics: statsResult.rows[0],
      activeRentals: activeRentalsResult.rows,
      upcomingBookings: upcomingBookingsResult.rows,
      recentHistory: recentHistoryResult.rows,
      favoriteVehicles: favoriteVehiclesResult.rows
    });
  } catch (error) {
    console.error('Error fetching customer dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
};

// @desc    Get system health status
// @route   GET /api/dashboard/health
// @access  Private (Admin)
const getSystemHealth = async (req, res) => {
  try {
    // Database health
    const dbHealth = await db.query('SELECT NOW() as timestamp');

    // Count critical items
    const criticalQuery = `
      SELECT 
        (SELECT COUNT(*) FROM vehicles WHERE status = 'maintenance') as vehicles_in_maintenance,
        (SELECT COUNT(*) FROM payments WHERE payment_status = 'pending' AND created_at < NOW() - INTERVAL '24 hours') as overdue_payments,
        (SELECT COUNT(*) FROM reservations WHERE status = 'pending_payment' AND created_at < NOW() - INTERVAL '2 hours') as abandoned_bookings,
        (SELECT COUNT(*) FROM maintenance_records WHERE next_service_date < NOW()) as overdue_maintenance
    `;

    const criticalResult = await db.query(criticalQuery);

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        timestamp: dbHealth.rows[0].timestamp
      },
      critical: criticalResult.rows[0]
    });
  } catch (error) {
    console.error('Error fetching system health:', error);
    res.status(500).json({ 
      status: 'unhealthy',
      error: error.message 
    });
  }
};

module.exports = {
  getAdminDashboard,
  getCustomerDashboard,
  getSystemHealth
};