const express = require('express');
const router = express.Router();
const db = require('../config/database');
const authMiddleware = require('../middleware/authMiddleware');
const { validate, validateUUID } = require('../middleware/validation');

/**
 * @route   POST /api/damages
 * @desc    Report damage
 * @access  Private
 */
router.post(
  '/',
  authMiddleware,
  validate({
    booking_id: { required: true, type: 'uuid' },
    car_id: { required: true, type: 'uuid' },
    description: { required: true, minLength: 10 },
  }),
  async (req, res, next) => {
    try {
      const { booking_id, car_id, description, damage_photos, estimated_cost } = req.body;

      const result = await db.query(
        `INSERT INTO damages (booking_id, car_id, reported_by, description, damage_photos, estimated_cost)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [booking_id, car_id, req.user.id, description, damage_photos || [], estimated_cost || null]
      );

      res.status(201).json({
        success: true,
        message: 'Damage reported successfully',
        data: { damage: result.rows[0] }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/damages/booking/:booking_id
 * @desc    Get damages for a booking
 * @access  Private
 */
router.get('/booking/:booking_id', authMiddleware, validateUUID('booking_id'), async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT d.*, u.first_name, u.last_name, u.email
       FROM damages d
       LEFT JOIN users u ON d.reported_by = u.id
       WHERE d.booking_id = $1
       ORDER BY d.created_at DESC`,
      [req.params.booking_id]
    );

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: { damages: result.rows }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/damages/:id/resolve
 * @desc    Resolve damage (admin/owner)
 * @access  Private
 */
router.put('/:id/resolve', authMiddleware, validateUUID('id'), async (req, res, next) => {
  try {
    const { resolution_notes } = req.body;

    const result = await db.query(
      `UPDATE damages
       SET status = 'resolved', resolution_notes = $1, resolved_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [resolution_notes, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Damage report not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Damage resolved',
      data: { damage: result.rows[0] }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
