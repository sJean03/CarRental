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

    // Filter by status (default: available)
    if (filters.status) {
      query += ` AND v.status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    } else {
      query += ` AND v.status = 'available'`;
    }

    // Filter by category
    if (filters.category_id) {
      query += ` AND v.category_id = $${paramIndex}`;
      params.push(filters.category_id);
      paramIndex++;
    }

    // Filter by location
    if (filters.location_id) {
      query += ` AND v.current_location_id = $${paramIndex}`;
      params.push(filters.location_id);
      paramIndex++;
    }

    // Filter by transmission
    if (filters.transmission_type) {
      query += ` AND v.transmission_type = $${paramIndex}`;
      params.push(filters.transmission_type);
      paramIndex++;
    }

    // Filter by fuel type
    if (filters.fuel_type) {
      query += ` AND v.fuel_type = $${paramIndex}`;
      params.push(filters.fuel_type);
      paramIndex++;
    }

    // Filter by price range
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

    // Search by make or model
    if (filters.search) {
      query += ` AND (LOWER(v.make) LIKE $${paramIndex} OR LOWER(v.model) LIKE $${paramIndex})`;
      params.push(`%${filters.search.toLowerCase()}%`);
      paramIndex++;
    }

    query += ` ORDER BY v.daily_rate ASC`;

    const result = await db.query(query, params);
    return result.rows;
  },

  // Get vehicle by ID
  async findById(id) {
    const query = `
      SELECT 
        v.*,
        vc.name as category_name,
        vc.description as category_description,
        cl.name as current_location_name,
        cl.address as current_location_address,
        cl.city as current_location_city,
        hl.name as home_location_name,
        vo.first_name as owner_first_name,
        vo.last_name as owner_last_name,
        vo.percentage_share as owner_percentage_share
      FROM vehicles v
      LEFT JOIN vehicle_categories vc ON v.category_id = vc.id
      LEFT JOIN locations cl ON v.current_location_id = cl.id
      LEFT JOIN locations hl ON v.home_location_id = hl.id
      LEFT JOIN vehicle_owners vo ON v.owner_id = vo.id
      WHERE v.id = $1
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  },

  // Get all vehicle categories
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
  }
};

module.exports = vehicleModel;