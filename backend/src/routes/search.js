const express = require('express');
const router = express.Router();
const {
  searchVehicles,
  getSearchFilters
} = require('../controllers/searchController');

// Public routes
router.get('/vehicles', searchVehicles);
router.get('/filters', getSearchFilters);

module.exports = router;