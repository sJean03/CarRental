const db = require('../config/database');

const reviewModel = {
  // Create review
  async create(reviewData) {
    const query = `
      INSERT INTO reviews (
        user_id,
        rental_id,
        vehicle_id,
        rating,
        cleanliness_rating,
        vehicle_condition_rating,
        comment
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const values = [
      reviewData.user_id,
      reviewData.rental_id,
      reviewData.vehicle_id,
      reviewData.rating,
      reviewData.cleanliness_rating || null,
      reviewData.vehicle_condition_rating || null,
      reviewData.comment || null
    ];
    
    const result = await db.query(query, values);
    return result.rows[0];
  },

  // Find by ID
  async findById(id) {
    const query = `
      SELECT 
        r.*,
        u.first_name,
        u.last_name,
        v.make,
        v.model,
        v.license_plate
      FROM reviews r
      JOIN users u ON u.id = r.user_id
      JOIN vehicles v ON v.id = r.vehicle_id
      WHERE r.id = $1
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  },

  // Find by vehicle ID
  async findByVehicleId(vehicleId, limit = 10, offset = 0) {
    const query = `
      SELECT 
        r.*,
        u.first_name,
        u.last_name,
        res.booking_reference,
        res.pickup_date,
        res.dropoff_date
      FROM reviews r
      JOIN users u ON u.id = r.user_id
      JOIN rentals rent ON rent.id = r.rental_id
      JOIN reservations res ON res.id = rent.reservation_id
      WHERE r.vehicle_id = $1
      ORDER BY r.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await db.query(query, [vehicleId, limit, offset]);
    return result.rows;
  },

  // Find by user ID
  async findByUserId(userId) {
    const query = `
      SELECT 
        r.*,
        v.make,
        v.model,
        v.license_plate,
        res.booking_reference,
        res.pickup_date,
        res.dropoff_date
      FROM reviews r
      JOIN vehicles v ON v.id = r.vehicle_id
      JOIN rentals rent ON rent.id = r.rental_id
      JOIN reservations res ON res.id = rent.reservation_id
      WHERE r.user_id = $1
      ORDER BY r.created_at DESC
    `;
    const result = await db.query(query, [userId]);
    return result.rows;
  },

  // Find by rental ID
  async findByRentalId(rentalId) {
    const query = `
      SELECT 
        r.*,
        u.first_name,
        u.last_name,
        v.make,
        v.model
      FROM reviews r
      JOIN users u ON u.id = r.user_id
      JOIN vehicles v ON v.id = r.vehicle_id
      WHERE r.rental_id = $1
    `;
    const result = await db.query(query, [rentalId]);
    return result.rows[0];
  },

  // Update review
  async update(id, reviewData) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    Object.keys(reviewData).forEach(key => {
      if (reviewData[key] !== undefined) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(reviewData[key]);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    const query = `
      UPDATE reviews 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    values.push(id);

    const result = await db.query(query, values);
    return result.rows[0];
  },

  // Delete review
  async delete(id) {
    const query = 'DELETE FROM reviews WHERE id = $1 RETURNING *';
    const result = await db.query(query, [id]);
    return result.rows[0];
  },

  // Get vehicle rating statistics
  async getVehicleStats(vehicleId) {
    const query = `
      SELECT 
        COUNT(*) as total_reviews,
        ROUND(AVG(rating), 1) as average_rating,
        ROUND(AVG(cleanliness_rating), 1) as avg_cleanliness,
        ROUND(AVG(vehicle_condition_rating), 1) as avg_condition,
        COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
        COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
        COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
        COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
        COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
      FROM reviews
      WHERE vehicle_id = $1
    `;
    const result = await db.query(query, [vehicleId]);
    return result.rows[0];
  },

  // Check if user already reviewed rental
  async hasUserReviewed(userId, rentalId) {
    const query = `
      SELECT EXISTS(
        SELECT 1 FROM reviews 
        WHERE user_id = $1 AND rental_id = $2
      ) as has_reviewed
    `;
    const result = await db.query(query, [userId, rentalId]);
    return result.rows[0].has_reviewed;
  },

  // Get recent reviews (for homepage/dashboard)
  async getRecent(limit = 10) {
    const query = `
      SELECT 
        r.*,
        u.first_name,
        u.last_name,
        v.make,
        v.model,
        v.license_plate
      FROM reviews r
      JOIN users u ON u.id = r.user_id
      JOIN vehicles v ON v.id = r.vehicle_id
      WHERE r.rating >= 4
      ORDER BY r.created_at DESC
      LIMIT $1
    `;
    const result = await db.query(query, [limit]);
    return result.rows;
  }
};

module.exports = reviewModel;