const db = require('../config/database');

const trackingModel = {
  // Record location
  async create(trackingData) {
    const query = `
      INSERT INTO vehicle_tracking (
        vehicle_id,
        rental_id,
        latitude,
        longitude,
        speed,
        heading,
        altitude,
        address,
        tracked_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    
    const values = [
      trackingData.vehicle_id,
      trackingData.rental_id || null,
      trackingData.latitude,
      trackingData.longitude,
      trackingData.speed || null,
      trackingData.heading || null,
      trackingData.altitude || null,
      trackingData.address || null,
      trackingData.tracked_at || new Date()
    ];
    
    const result = await db.query(query, values);
    return result.rows[0];
  },

  // Get current location for vehicle
  async getCurrentLocation(vehicleId) {
    const query = `
      SELECT 
        vt.*,
        v.make,
        v.model,
        v.license_plate,
        r.id as active_rental_id,
        res.booking_reference
      FROM vehicle_tracking vt
      JOIN vehicles v ON v.id = vt.vehicle_id
      LEFT JOIN rentals r ON r.id = vt.rental_id
      LEFT JOIN reservations res ON res.id = r.reservation_id
      WHERE vt.vehicle_id = $1
      ORDER BY vt.tracked_at DESC
      LIMIT 1
    `;
    const result = await db.query(query, [vehicleId]);
    return result.rows[0];
  },

  // Get location history
  async getHistory(vehicleId, filters = {}) {
    let query = `
      SELECT *
      FROM vehicle_tracking
      WHERE vehicle_id = $1
    `;
    
    const params = [vehicleId];
    let paramIndex = 2;

    if (filters.rental_id) {
      query += ` AND rental_id = $${paramIndex}`;
      params.push(filters.rental_id);
      paramIndex++;
    }

    if (filters.start_date) {
      query += ` AND tracked_at >= $${paramIndex}`;
      params.push(filters.start_date);
      paramIndex++;
    }

    if (filters.end_date) {
      query += ` AND tracked_at <= $${paramIndex}`;
      params.push(filters.end_date);
      paramIndex++;
    }

    const limit = filters.limit || 100;
    query += ` ORDER BY tracked_at DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await db.query(query, params);
    return result.rows;
  },

  // Get all active vehicle locations
  async getActiveLocations() {
    const query = `
      SELECT DISTINCT ON (v.id)
        v.id,
        v.make,
        v.model,
        v.license_plate,
        v.status,
        vt.latitude,
        vt.longitude,
        vt.speed,
        vt.address,
        vt.tracked_at,
        r.id as rental_id,
        res.booking_reference,
        u.first_name || ' ' || u.last_name as customer_name
      FROM vehicles v
      LEFT JOIN vehicle_tracking vt ON vt.vehicle_id = v.id
      LEFT JOIN rentals r ON r.reservation_id IN (
        SELECT id FROM reservations WHERE vehicle_id = v.id AND status = 'active'
      )
      LEFT JOIN reservations res ON res.id = r.reservation_id
      LEFT JOIN users u ON u.id = res.user_id
      WHERE v.is_tracked = true
        AND vt.tracked_at >= NOW() - INTERVAL '1 hour'
      ORDER BY v.id, vt.tracked_at DESC
    `;
    const result = await db.query(query);
    return result.rows;
  },

  // Get tracking for rental
  async getByRentalId(rentalId) {
    const query = `
      SELECT 
        vt.*,
        v.make,
        v.model,
        v.license_plate
      FROM vehicle_tracking vt
      JOIN vehicles v ON v.id = vt.vehicle_id
      WHERE vt.rental_id = $1
      ORDER BY vt.tracked_at ASC
    `;
    const result = await db.query(query, [rentalId]);
    return result.rows;
  },

  // Get distance traveled during rental
  async getDistanceTraveled(rentalId) {
    const query = `
      WITH track_points AS (
        SELECT 
          latitude,
          longitude,
          LAG(latitude) OVER (ORDER BY tracked_at) as prev_lat,
          LAG(longitude) OVER (ORDER BY tracked_at) as prev_lon
        FROM vehicle_tracking
        WHERE rental_id = $1
      )
      SELECT 
        SUM(
          6371 * acos(
            cos(radians(prev_lat)) * 
            cos(radians(latitude)) * 
            cos(radians(longitude) - radians(prev_lon)) + 
            sin(radians(prev_lat)) * 
            sin(radians(latitude))
          )
        ) as total_distance_km
      FROM track_points
      WHERE prev_lat IS NOT NULL
    `;
    const result = await db.query(query, [rentalId]);
    return result.rows[0];
  },

  // Delete old tracking data
  async deleteOldData(daysToKeep = 90) {
    const query = `
      DELETE FROM vehicle_tracking
      WHERE tracked_at < NOW() - $1::interval
      RETURNING COUNT(*) as deleted_count
    `;
    const result = await db.query(query, [`${daysToKeep} days`]);
    return result.rows[0];
  },

  // Get tracking statistics
  async getStatistics(vehicleId = null, startDate = null, endDate = null) {
    let query = `
      SELECT 
        COUNT(*) as total_records,
        COUNT(DISTINCT vehicle_id) as vehicles_tracked,
        COUNT(DISTINCT rental_id) as rentals_tracked,
        MIN(tracked_at) as first_record,
        MAX(tracked_at) as last_record,
        ROUND(AVG(speed), 2) as avg_speed,
        MAX(speed) as max_speed
      FROM vehicle_tracking
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;

    if (vehicleId) {
      query += ` AND vehicle_id = $${paramIndex}`;
      params.push(vehicleId);
      paramIndex++;
    }

    if (startDate) {
      query += ` AND tracked_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND tracked_at <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    const result = await db.query(query, params);
    return result.rows[0];
  }
};

module.exports = trackingModel;