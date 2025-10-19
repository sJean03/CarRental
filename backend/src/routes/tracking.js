const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const {
  recordLocation,
  getCurrentLocation,
  getLocationHistory,
  getAllActiveLocations
} = require('../controllers/trackingController');

// Record location (might be from GPS device with API key)
router.post('/', recordLocation);

// Protected routes
router.use(protect);

router.get('/active', restrictTo('admin', 'staff'), getAllActiveLocations);
router.get('/vehicle/:vehicleId/current', restrictTo('admin', 'staff', 'owner'), getCurrentLocation);
router.get('/vehicle/:vehicleId/history', restrictTo('admin', 'staff', 'owner'), getLocationHistory);

module.exports = router;