const db = require('../config/database');

class Car {
  /**
   * Create a new car listing
   */
  static async create(ownerId, carData) {
    const {
      make, model, year, color, license_plate, vin,
      category_id, transmission, fuel_type, seating_capacity,
      daily_rate, description, features, rules, image_urls,
      home_branch_id, storage_option = 'owner_delivers'
    } = carData;

    const query = `
      INSERT INTO cars (
        owner_id, make, model, year, color, license_plate, vin,
        category_id, transmission, fuel_type, seating_capacity,
        daily_rate, description, features, rules, image_urls,
        home_branch_id, storage_option
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *
    `;

    const values = [
      ownerId, make, model, year, color, license_plate, vin,
      category_id, transmission, fuel_type, seating_capacity,
      daily_rate, description, features, rules, image_urls,
      home_branch_id, storage_option
    ];

    const result = await db.query(query, values);
    return result.rows[0];
  }

  /**
   * Find car by ID with owner details
   */
  static async findById(carId) {
    const query = `
      SELECT 
        c.*,
        vc.name as category_name,
        vo.user_id as owner_user_id,
        u.first_name as owner_first_name,
        u.last_name as owner_last_name,
        u.email as owner_email,
        vo.average_rating as owner_rating,
        vo.response_rate as owner_response_rate,
        l.name as branch_name,
        l.city as branch_city
      FROM cars c
      LEFT JOIN vehicle_categories vc ON c.category_id = vc.id
      LEFT JOIN vehicle_owners vo ON c.owner_id = vo.id
      LEFT JOIN users u ON vo.user_id = u.id
      LEFT JOIN locations l ON c.home_branch_id = l.id
      WHERE c.id = $1
    `;

    const result = await db.query(query, [carId]);
    return result.rows[0];
  }

  /**
   * Get all cars with filters
   */
  static async findAll(filters = {}) {
    let query = `
      SELECT 
        c.*,
        vc.name as category_name,
        l.name as branch_name,
        l.city as branch_city
      FROM cars c
      LEFT JOIN vehicle_categories vc ON c.category_id = vc.id
      LEFT JOIN locations l ON c.home_branch_id = l.id
      WHERE 1=1
    `;

    const values = [];
    let paramCount = 1;

    // Filter by status
    if (filters.status) {
      query += ` AND c.status = $${paramCount}`;
      values.push(filters.status);
      paramCount++;
    } else {
      // Default: only show listed cars
      query += ` AND c.status = 'listed'`;
    }

    // Filter by category
    if (filters.category_id) {
      query += ` AND c.category_id = $${paramCount}`;
      values.push(filters.category_id);
      paramCount++;
    }

    // Filter by transmission
    if (filters.transmission) {
      query += ` AND c.transmission = $${paramCount}`;
      values.push(filters.transmission);
      paramCount++;
    }

    // Filter by fuel type
    if (filters.fuel_type) {
      query += ` AND c.fuel_type = $${paramCount}`;
      values.push(filters.fuel_type);
      paramCount++;
    }

    // Filter by seating capacity
    if (filters.min_seats) {
      query += ` AND c.seating_capacity >= $${paramCount}`;
      values.push(filters.min_seats);
      paramCount++;
    }

    // Filter by price range
    if (filters.min_price) {
      query += ` AND c.daily_rate >= $${paramCount}`;
      values.push(filters.min_price);
      paramCount++;
    }

    if (filters.max_price) {
      query += ` AND c.daily_rate <= $${paramCount}`;
      values.push(filters.max_price);
      paramCount++;
    }

    // Filter by branch
    if (filters.branch_id) {
      query += ` AND c.home_branch_id = $${paramCount}`;
      values.push(filters.branch_id);
      paramCount++;
    }

    // Filter by owner
    if (filters.owner_id) {
      query += ` AND c.owner_id = $${paramCount}`;
      values.push(filters.owner_id);
      paramCount++;
    }

    // Search by make/model
    if (filters.search) {
      query += ` AND (LOWER(c.make) LIKE $${paramCount} OR LOWER(c.model) LIKE $${paramCount})`;
      values.push(`%${filters.search.toLowerCase()}%`);
      paramCount++;
    }

    // Sorting
    const sortBy = filters.sort_by || 'created_at';
    const sortOrder = filters.sort_order || 'DESC';
    query += ` ORDER BY c.${sortBy} ${sortOrder}`;

    // Pagination
    const limit = filters.limit || 20;
    const offset = filters.offset || 0;
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);

    const result = await db.query(query, values);
    return result.rows;
  }

  /**
   * Update car details
   */
  static async update(carId, updateData) {
    const allowedFields = [
      'make', 'model', 'year', 'color', 'license_plate', 'vin',
      'transmission', 'fuel_type', 'seating_capacity', 'daily_rate',
      'description', 'features', 'rules', 'image_urls', 'storage_option',
      'home_branch_id', 'status'
    ];

    const updates = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key) && updateData[key] !== undefined) {
        updates.push(`${key} = $${paramCount}`);
        values.push(updateData[key]);
        paramCount++;
      }
    });

    if (updates.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(carId);
    const query = `
      UPDATE cars 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows[0];
  }

  /**
   * Admin: Approve car listing
   */
  static async approve(carId, adminNotes = null) {
    const query = `
      UPDATE cars 
      SET status = 'listed', admin_notes = $1
      WHERE id = $2
      RETURNING *
    `;
    const result = await db.query(query, [adminNotes, carId]);
    return result.rows[0];
  }

  /**
   * Admin: Reject car listing
   */
  static async reject(carId, rejectionReason, adminNotes = null) {
    const query = `
      UPDATE cars 
      SET status = 'pending_approval', rejection_reason = $1, admin_notes = $2
      WHERE id = $3
      RETURNING *
    `;
    const result = await db.query(query, [rejectionReason, adminNotes, carId]);
    return result.rows[0];
  }

  /**
   * Check car availability for date range
   */
  static async checkAvailability(carId, pickupDate, returnDate) {
    const query = `
      SELECT EXISTS (
        SELECT 1 FROM bookings
        WHERE car_id = $1
        AND status NOT IN ('cancelled', 'cancelled_with_refund', 'completed')
        AND (
          (pickup_date <= $2 AND return_date >= $2) OR
          (pickup_date <= $3 AND return_date >= $3) OR
          (pickup_date >= $2 AND return_date <= $3)
        )
      ) as is_booked,
      EXISTS (
        SELECT 1 FROM car_availability
        WHERE car_id = $1
        AND (
          (blocked_from <= $2 AND blocked_until >= $2) OR
          (blocked_from <= $3 AND blocked_until >= $3) OR
          (blocked_from >= $2 AND blocked_until <= $3)
        )
      ) as is_blocked
    `;

    const result = await db.query(query, [carId, pickupDate, returnDate]);
    const { is_booked, is_blocked } = result.rows[0];
    
    return !is_booked && !is_blocked;
  }

  /**
   * Get car's blocked dates
   */
  static async getBlockedDates(carId) {
    const query = `
      SELECT blocked_from, blocked_until, reason
      FROM car_availability
      WHERE car_id = $1
      ORDER BY blocked_from ASC
    `;
    const result = await db.query(query, [carId]);
    return result.rows;
  }

  /**
   * Block dates for a car
   */
  static async blockDates(carId, blockedFrom, blockedUntil, reason = null) {
    const query = `
      INSERT INTO car_availability (car_id, blocked_from, blocked_until, reason)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await db.query(query, [carId, blockedFrom, blockedUntil, reason]);
    return result.rows[0];
  }

  /**
   * Delete car
   */
  static async delete(carId) {
    const query = 'DELETE FROM cars WHERE id = $1 RETURNING *';
    const result = await db.query(query, [carId]);
    return result.rows[0];
  }

  /**
   * Update car rating
   */
  static async updateRating(carId, newRating) {
    const query = `
      UPDATE cars 
      SET average_rating = (
        SELECT AVG(rating) 
        FROM (
          SELECT $2 as rating
          UNION ALL
          SELECT average_rating FROM cars WHERE id = $1 AND average_rating > 0
        ) ratings
      )
      WHERE id = $1
      RETURNING *
    `;
    const result = await db.query(query, [carId, newRating]);
    return result.rows[0];
  }
}

module.exports = Car;