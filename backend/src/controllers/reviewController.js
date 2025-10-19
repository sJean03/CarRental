const db = require('../config/database');

// @desc    Create a review
// @route   POST /api/reviews
// @access  Private (Customer)
const createReview = async (req, res) => {
  try {
    const {
      rentalId,
      vehicleId,
      rating,
      cleanlinessRating,
      vehicleConditionRating,
      comment
    } = req.body;

    const userId = req.user.id;

    // Validate required fields
    if (!rentalId || !vehicleId || !rating) {
      return res.status(400).json({ 
        error: 'Rental ID, vehicle ID, and rating are required' 
      });
    }

    // Verify rental exists and belongs to user
    const rentalCheck = await db.query(
      `SELECT r.id, res.user_id, res.status 
       FROM rentals r
       JOIN reservations res ON res.id = r.reservation_id
       WHERE r.id = $1`,
      [rentalId]
    );

    if (rentalCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Rental not found' });
    }

    if (rentalCheck.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized to review this rental' });
    }

    if (rentalCheck.rows[0].status !== 'completed') {
      return res.status(400).json({ error: 'Can only review completed rentals' });
    }

    // Check if review already exists
    const existingReview = await db.query(
      'SELECT id FROM reviews WHERE rental_id = $1 AND user_id = $2',
      [rentalId, userId]
    );

    if (existingReview.rows.length > 0) {
      return res.status(400).json({ error: 'You have already reviewed this rental' });
    }

    const query = `
      INSERT INTO reviews (
        user_id, rental_id, vehicle_id, rating, 
        cleanliness_rating, vehicle_condition_rating, comment
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const result = await db.query(query, [
      userId,
      rentalId,
      vehicleId,
      rating,
      cleanlinessRating || null,
      vehicleConditionRating || null,
      comment || null
    ]);

    res.status(201).json({
      message: 'Review created successfully',
      review: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
};

// @desc    Get reviews for a vehicle
// @route   GET /api/reviews/vehicle/:vehicleId
// @access  Public
const getVehicleReviews = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { page = 1, limit = 10, sortBy = 'created_at', order = 'DESC' } = req.query;

    const offset = (page - 1) * limit;

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
      ORDER BY ${sortBy} ${order}
      LIMIT $2 OFFSET $3
    `;

    const result = await db.query(query, [vehicleId, limit, offset]);

    // Get review statistics
    const statsQuery = `
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

    const statsResult = await db.query(statsQuery, [vehicleId]);

    res.json({
      reviews: result.rows,
      statistics: statsResult.rows[0],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(statsResult.rows[0].total_reviews)
      }
    });
  } catch (error) {
    console.error('Error fetching vehicle reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};

// @desc    Get user's reviews
// @route   GET /api/reviews/my-reviews
// @access  Private (Customer)
const getMyReviews = async (req, res) => {
  try {
    const userId = req.user.id;

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

    res.json({
      reviews: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};

// @desc    Update a review
// @route   PUT /api/reviews/:id
// @access  Private (Customer - own reviews only)
const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const {
      rating,
      cleanlinessRating,
      vehicleConditionRating,
      comment
    } = req.body;

    // Check if review exists and belongs to user
    const reviewCheck = await db.query(
      'SELECT id FROM reviews WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (reviewCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found or unauthorized' });
    }

    const query = `
      UPDATE reviews
      SET 
        rating = COALESCE($1, rating),
        cleanliness_rating = COALESCE($2, cleanliness_rating),
        vehicle_condition_rating = COALESCE($3, vehicle_condition_rating),
        comment = COALESCE($4, comment),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `;

    const result = await db.query(query, [
      rating,
      cleanlinessRating,
      vehicleConditionRating,
      comment,
      id
    ]);

    res.json({
      message: 'Review updated successfully',
      review: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ error: 'Failed to update review' });
  }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private (Customer - own reviews, Admin)
const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Admin can delete any review, users can only delete their own
    let query;
    let params;

    if (userRole === 'admin') {
      query = 'DELETE FROM reviews WHERE id = $1 RETURNING id';
      params = [id];
    } else {
      query = 'DELETE FROM reviews WHERE id = $1 AND user_id = $2 RETURNING id';
      params = [id, userId];
    }

    const result = await db.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found or unauthorized' });
    }

    res.json({
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
};

module.exports = {
  createReview,
  getVehicleReviews,
  getMyReviews,
  updateReview,
  deleteReview
};