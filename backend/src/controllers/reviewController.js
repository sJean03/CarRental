const reviewModel = require('../models/reviewModel');
const rentalModel = require('../models/rentalModel');
const bookingModel = require('../models/bookingModel');

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
    const rental = await rentalModel.findByReservationId(rentalId);
    if (!rental) {
      return res.status(404).json({ error: 'Rental not found' });
    }

    // Get booking to verify user
    const booking = await bookingModel.findById(rentalId);
    if (!booking || booking.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized to review this rental' });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({ error: 'Can only review completed rentals' });
    }

    // Check if already reviewed
    const hasReviewed = await reviewModel.hasUserReviewed(userId, rental.id);
    if (hasReviewed) {
      return res.status(400).json({ error: 'You have already reviewed this rental' });
    }

    // Create review
    const review = await reviewModel.create({
      user_id: userId,
      rental_id: rental.id,
      vehicle_id: vehicleId,
      rating,
      cleanliness_rating: cleanlinessRating || null,
      vehicle_condition_rating: vehicleConditionRating || null,
      comment: comment || null
    });

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      review
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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const reviews = await reviewModel.findByVehicleId(vehicleId, limit, offset);
    const statistics = await reviewModel.getVehicleStats(vehicleId);

    res.json({
      success: true,
      reviews,
      statistics,
      pagination: {
        page,
        limit,
        total: parseInt(statistics.total_reviews)
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

    const reviews = await reviewModel.findByUserId(userId);

    res.json({
      success: true,
      reviews,
      count: reviews.length
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
    const existingReview = await reviewModel.findById(id);
    if (!existingReview) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (existingReview.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized to update this review' });
    }

    // Build update object
    const updateData = {};
    if (rating !== undefined) updateData.rating = rating;
    if (cleanlinessRating !== undefined) updateData.cleanliness_rating = cleanlinessRating;
    if (vehicleConditionRating !== undefined) updateData.vehicle_condition_rating = vehicleConditionRating;
    if (comment !== undefined) updateData.comment = comment;

    const review = await reviewModel.update(id, updateData);

    res.json({
      success: true,
      message: 'Review updated successfully',
      review
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

    const existingReview = await reviewModel.findById(id);
    if (!existingReview) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Admin can delete any review, users can only delete their own
    if (userRole !== 'admin' && existingReview.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized to delete this review' });
    }

    await reviewModel.delete(id);

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
};

// @desc    Get recent reviews (for homepage)
// @route   GET /api/reviews/recent
// @access  Public
const getRecentReviews = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const reviews = await reviewModel.getRecent(limit);

    res.json({
      success: true,
      reviews,
      count: reviews.length
    });
  } catch (error) {
    console.error('Error fetching recent reviews:', error);
    res.status(500).json({ error: 'Failed to fetch recent reviews' });
  }
};

module.exports = {
  createReview,
  getVehicleReviews,
  getMyReviews,
  updateReview,
  deleteReview,
  getRecentReviews
};