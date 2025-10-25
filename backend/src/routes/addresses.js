const express = require('express');
const router = express.Router();
const db = require('../config/database');
const authMiddleware = require('../middleware/authMiddleware');
const { validate, validateUUID } = require('../middleware/validation');

/**
 * @route   GET /api/addresses
 * @desc    Get user addresses
 * @access  Private
 */
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC',
      [req.user.id]
    );

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: { addresses: result.rows }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/addresses
 * @desc    Create new address
 * @access  Private
 */
router.post(
  '/',
  authMiddleware,
  validate({
    street_address: { required: true, trim: true },
    city: { required: true, trim: true },
    province: { required: true, trim: true },
    postal_code: { required: true, trim: true },
    country: { required: false, trim: true },
    is_default: { required: false }
  }),
  async (req, res, next) => {
    try {
      const { street_address, city, province, postal_code, country, is_default } = req.body;

      // If setting as default, unset other defaults
      if (is_default) {
        await db.query(
          'UPDATE addresses SET is_default = false WHERE user_id = $1',
          [req.user.id]
        );
      }

      const result = await db.query(
        `INSERT INTO addresses (user_id, street_address, city, province, postal_code, country, is_default)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [req.user.id, street_address, city, province, postal_code, country || 'Philippines', is_default || false]
      );

      res.status(201).json({
        success: true,
        message: 'Address added successfully',
        data: { address: result.rows[0] }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   PUT /api/addresses/:id
 * @desc    Update address
 * @access  Private
 */
router.put('/:id', authMiddleware, validateUUID('id'), async (req, res, next) => {
  try {
    const { street_address, city, province, postal_code, country, is_default } = req.body;

    // If setting as default, unset other defaults
    if (is_default) {
      await db.query(
        'UPDATE addresses SET is_default = false WHERE user_id = $1 AND id != $2',
        [req.user.id, req.params.id]
      );
    }

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (street_address) {
      updates.push(`street_address = $${paramCount}`);
      values.push(street_address);
      paramCount++;
    }
    if (city) {
      updates.push(`city = $${paramCount}`);
      values.push(city);
      paramCount++;
    }
    if (province) {
      updates.push(`province = $${paramCount}`);
      values.push(province);
      paramCount++;
    }
    if (postal_code) {
      updates.push(`postal_code = $${paramCount}`);
      values.push(postal_code);
      paramCount++;
    }
    if (country) {
      updates.push(`country = $${paramCount}`);
      values.push(country);
      paramCount++;
    }
    if (is_default !== undefined) {
      updates.push(`is_default = $${paramCount}`);
      values.push(is_default);
      paramCount++;
    }

    values.push(req.params.id, req.user.id);

    const result = await db.query(
      `UPDATE addresses
       SET ${updates.join(', ')}
       WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      data: { address: result.rows[0] }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/addresses/:id
 * @desc    Delete address
 * @access  Private
 */
router.delete('/:id', authMiddleware, validateUUID('id'), async (req, res, next) => {
  try {
    const result = await db.query(
      'DELETE FROM addresses WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Address deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
