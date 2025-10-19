const recordLocation = async (req, res) => {
  try {
    const {
      vehicleId,
      rentalId,
      latitude,
      longitude,
      speed,
      heading,
      altitude,
      address,
      trackedAt
    } = req.body;

    // Validate required fields
    if (!vehicleId || !latitude || !longitude) {
      return res.status(400).json({ 
        error: 'Vehicle ID, latitude, and longitude are required' 
      });
    }

    // Verify vehicle exists and has tracking enabled
    const vehicleCheck = await db.query(
      'SELECT id, is_tracked FROM vehicles WHERE id = $1',
      [vehicleId]
    );

    if (vehicleCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    if (!vehicleCheck.rows[0].is_tracked) {
      return res.status(400).json({ error: 'Vehicle tracking not enabled' });
    }

    const query = `
      INSERT INTO vehicle_tracking (
        vehicle_id, rental_id, latitude, longitude, 
        speed, heading, altitude, address, tracked_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const result = await db.query(query, [
      vehicleId,
      rentalId || null,
      latitude,
      longitude,
      speed || null,
      heading || null,
      altitude || null,
      address || null,
      trackedAt || new Date()
    ]);

    res.status(201).json({
      message: 'Location recorded successfully',
      tracking: result.rows[0]
    });
  } catch (error) {
    console.error('Error recording location:', error);
    res.status(500).json({ error: 'Failed to record location' });
  }
};

// @desc    Get vehicle current location
// @route   GET /api/tracking/vehicle/:vehicleId/current
// @access  Private (Admin/Staff/Owner)
const getCurrentLocation = async (req, res) => {
  try {
    const { vehicleId } = req.params;

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

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No tracking data found for this vehicle' });
    }

    res.json({
      location: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching current location:', error);
    res.status(500).json({ error: 'Failed to fetch current location' });
  }
};

// @desc    Get vehicle location history
// @route   GET /api/tracking/vehicle/:vehicleId/history
// @access  Private (Admin/Staff/Owner)
const getLocationHistory = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { startDate, endDate, rentalId, limit = 100 } = req.query;

    let query = `
      SELECT *
      FROM vehicle_tracking
      WHERE vehicle_id = $1
    `;

    const params = [vehicleId];
    let paramIndex = 2;

    if (rentalId) {
      query += ` AND rental_id = $${paramIndex}`;
      params.push(rentalId);
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

    query += ` ORDER BY tracked_at DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await db.query(query, params);

    res.json({
      history: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching location history:', error);
    res.status(500).json({ error: 'Failed to fetch location history' });
  }
};

// @desc    Get all active vehicle locations (for map view)
// @route   GET /api/tracking/active
// @access  Private (Admin/Staff)
const getAllActiveLocations = async (req, res) => {
  try {
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

    res.json({
      vehicles: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching active locations:', error);
    res.status(500).json({ error: 'Failed to fetch active locations' });
  }
};

module.exports = {
  recordLocation,
  getCurrentLocation,
  getLocationHistory,
  getAllActiveLocations
};