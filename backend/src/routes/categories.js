const express = require('express');
const router = express.Router();
const vehicleModel = require('../models/vehicleModel');

// Get all categories (public)
router.get('/', async (req, res) => {
  try {
    const categories = await vehicleModel.getCategories();
    res.json({
      success: true,
      count: categories.length,
      categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

module.exports = router;