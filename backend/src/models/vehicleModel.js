const db = require('../config/database');

const vehicleModel = {
  // Get all vehicles with optional filters
  async findAll(filters = {}) {
    let query = `
      SELECT 
        v.*,
        vc.name as category_name,
        l.name as location_name,
        l.city as location_city,
        vo.first_name as owner_first_name,
        vo.last_name as owner_last_name
      FROM vehicles v
      LEFT JOIN vehicle_categories vc ON v.category_id = vc.id
      LEFT JOIN locations l ON v.current_location_id = l.id
      LEFT JOIN vehicle_owners vo ON v.owner_id = vo.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;

    if (filters.status) {
      query += ` AND v.status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters.category_id) {
      query += ` AND v.category_id = $${paramIndex}`;
      params.push(filters.category_id);
      paramIndex++;
    }

    if (filters.location_id) {
      query += ` AND v.current_location_id = $${paramIndex}`;
      params.push(filters.location_id);
      paramIndex++;
    }

    if (filters.transmission_type) {
      query += ` AND v.transmission_type = $${paramIndex}`;
      params.push(filters.transmission_type);
      paramIndex++;
    }

    if (filters.fuel_type) {
      query += ` AND v.fuel_type = $${paramIndex}`;
      params.push(filters.fuel_type);
      paramIndex++;
    }

    if (filters.min_price) {
      query += ` AND v.daily_rate >= $${paramIndex}`;
      params.push(filters.min_price);
      paramIndex++;
    }

    if (filters.max_price) {
      query += ` AND v.daily_rate <= $${paramIndex}`;
      params.push(filters.max_price);
      paramIndex++;
    }

    if (filters.search) {
      query += ` AND (
        v.make ILIKE $${paramIndex} OR 
        v.model ILIKE $${paramIndex} OR 
        v.license_plate ILIKE $${paramIndex}
      )`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    query += ' ORDER BY v.created_at DESC';

    const result = await db.query(query, params);
    return result.rows;
  },

  // Find vehicle by ID
  async findById(id) {
    const query = `
      SELECT 
        v.*,
        vc.name as category_name,
        vc.description as category_description,
        l.name as location_name,
        l.address as location_address,
        l.city as location_city,
        vo.first_name as owner_first_name,
        vo.last_name as owner_last_name,
        vo.email as owner_email
      FROM vehicles v
      LEFT JOIN vehicle_categories vc ON v.category_id = vc.id
      LEFT JOIN locations l ON v.current_location_id = l.id
      LEFT JOIN vehicle_owners vo ON v.owner_id = vo.id
      WHERE v.id = $1
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  },

  // Find vehicle by VIN
  async findByVIN(vin) {
    const query = 'SELECT * FROM vehicles WHERE vehicle_identification_number = $1';
    const result = await db.query(query, [vin]);
    return result.rows[0];
  },

  // Get all categories
  async getCategories() {
    const query = 'SELECT * FROM vehicle_categories ORDER BY name ASC';
    const result = await db.query(query);
    return result.rows;
  },

  // Get vehicles by category
  async findByCategory(categoryId) {
    const query = `
      SELECT 
        v.*,
        vc.name as category_name,
        l.name as location_name
      FROM vehicles v
      LEFT JOIN vehicle_categories vc ON v.category_id = vc.id
      LEFT JOIN locations l ON v.current_location_id = l.id
      WHERE v.category_id = $1 AND v.status = 'available'
      ORDER BY v.daily_rate ASC
    `;
    const result = await db.query(query, [categoryId]);
    return result.rows;
  },

  // Check vehicle availability for date range
  async checkAvailability(vehicleId, pickupDate, dropoffDate) {
    const query = `
      SELECT COUNT(*) as conflicting_bookings
      FROM reservations
      WHERE vehicle_id = $1
        AND status IN ('confirmed', 'active')
        AND (
          (pickup_date <= $2 AND dropoff_date >= $2)
          OR (pickup_date <= $3 AND dropoff_date >= $3)
          OR (pickup_date >= $2 AND dropoff_date <= $3)
        )
    `;
    const result = await db.query(query, [vehicleId, pickupDate, dropoffDate]);
    return parseInt(result.rows[0].conflicting_bookings) === 0;
  },

  // Create new vehicle
  async create(vehicleData) {
    const query = `
      INSERT INTO vehicles (
        owner_id,
        ownership_type,
        vehicle_identification_number,
        make,
        model,
        year,
        color,
        license_plate,
        category_id,
        transmission_type,
        fuel_type,
        seating_capacity,
        current_mileage,
        daily_rate,
        hourly_late_fee,
        status,
        current_location_id,
        home_location_id,
        image_urls,
        is_tracked,
        tracker_device_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING *
    `;

    const values = [
      vehicleData.owner_id || null,
      vehicleData.ownership_type || 'rentease_owned',
      vehicleData.vehicle_identification_number,
      vehicleData.make,
      vehicleData.model,
      vehicleData.year,
      vehicleData.color || null,
      vehicleData.license_plate,
      vehicleData.category_id || null,
      vehicleData.transmission_type || 'automatic',
      vehicleData.fuel_type || 'petrol',
      vehicleData.seating_capacity || 5,
      vehicleData.current_mileage || 0,
      vehicleData.daily_rate,
      vehicleData.hourly_late_fee || 200.00,
      'available',
      vehicleData.current_location_id || null,
      vehicleData.home_location_id || null,
      vehicleData.image_urls || null,
      vehicleData.is_tracked || false,
      vehicleData.tracker_device_id || null
    ];

    const result = await db.query(query, values);
    return result.rows[0];
  },

  // Update vehicle
  async update(id, vehicleData) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    const allowedFields = [
      'owner_id', 'ownership_type', 'make', 'model', 'year', 'color',
      'license_plate', 'category_id', 'transmission_type', 'fuel_type',
      'seating_capacity', 'current_mileage', 'daily_rate', 'hourly_late_fee',
      'current_location_id', 'home_location_id', 'image_urls', 
      'is_tracked', 'tracker_device_id'
    ];

    allowedFields.forEach(field => {
      if (vehicleData[field] !== undefined) {
        fields.push(`${field} = $${paramIndex}`);
        values.push(vehicleData[field]);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    const query = `
      UPDATE vehicles 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    values.push(id);

    const result = await db.query(query, values);
    return result.rows[0];
  },

  // Update vehicle status
  async updateStatus(id, status) {
    const query = `
      UPDATE vehicles 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    const result = await db.query(query, [status, id]);
    return result.rows[0];
  },

  // Update vehicle location
  async updateLocation(id, locationId) {
    const query = `
      UPDATE vehicles 
      SET current_location_id = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    const result = await db.query(query, [locationId, id]);
    return result.rows[0];
  },

  // Update vehicle mileage
  async updateMileage(id, mileage) {
    const query = `
      UPDATE vehicles 
      SET current_mileage = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    const result = await db.query(query, [mileage, id]);
    return result.rows[0];
  },

  // Check if vehicle has active bookings
  async hasActiveBookings(vehicleId) {
    const query = `
      SELECT COUNT(*) as active_bookings
      FROM reservations
      WHERE vehicle_id = $1 AND status IN ('confirmed', 'active')
    `;
    const result = await db.query(query, [vehicleId]);
    return parseInt(result.rows[0].active_bookings) > 0;
  },

  // Get vehicle statistics
  async getStatistics(vehicleId) {
    const query = `
      SELECT 
        COUNT(r.id) as total_rentals,
        COUNT(CASE WHEN r.status = 'completed' THEN 1 END) as completed_rentals,
        COALESCE(AVG(rev.rating), 0) as average_rating,
        COALESCE(SUM(r.total_amount), 0) as total_revenue
      FROM vehicles v
      LEFT JOIN reservations r ON r.vehicle_id = v.id
      LEFT JOIN rentals rent ON rent.reservation_id = r.id
      LEFT JOIN reviews rev ON rev.vehicle_id = v.id
      WHERE v.id = $1
      GROUP BY v.id
    `;
    const result = await db.query(query, [vehicleId]);
    return result.rows[0];
  }
};

module.exports = vehicleModel;