const express = require('express');
const router = express.Router();
const db = require('../config/database');

/**
 * @route   GET /api/locations
 * @desc    Get all locations/branches
 * @access  Public
 */
router.get('/', async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT * FROM locations WHERE is_active = true ORDER BY name ASC'
    );

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: { locations: result.rows }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/locations/:id
 * @desc    Get single location
 * @access  Public
 */
router.get('/:id', async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT * FROM locations WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { location: result.rows[0] }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
