const express = require('express');
const router = express.Router();
const locationModel = require('../models/locationModel');

// Get all locations (public)
router.get('/', async (req, res) => {
  try {
    const locations = await locationModel.findAll();
    res.json({
      success: true,
      count: locations.length,
      locations
    });
  } catch (error) {
    console.error('Get locations error:', error);
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
});

// Get location by ID
router.get('/:id', async (req, res) => {
  try {
    const location = await locationModel.findById(req.params.id);
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }
    res.json({
      success: true,
      location
    });
  } catch (error) {
    console.error('Get location error:', error);
    res.status(500).json({ error: 'Failed to fetch location' });
  }
});

module.exports = router;