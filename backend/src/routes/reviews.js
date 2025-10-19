const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const {
  createReview,
  getVehicleReviews,
  getMyReviews,
  updateReview,
  deleteReview
} = require('../controllers/reviewController');

// Public routes
router.get('/vehicle/:vehicleId', getVehicleReviews);

// Protected routes
router.use(protect);
router.post('/', restrictTo('customer'), createReview);
router.get('/my-reviews', restrictTo('customer'), getMyReviews);
router.put('/:id', updateReview);
router.delete('/:id', deleteReview);

module.exports = router;