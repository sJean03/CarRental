const express = require('express');
const router = express.Router();
const db = require('../config/database');
const authMiddleware = require('../middleware/authMiddleware');
const { validateUUID } = require('../middleware/validation');

/**
 * @route   GET /api/notifications
 * @desc    Get user notifications
 * @access  Private
 */
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const { is_read } = req.query;

    let query = `
      SELECT * FROM notifications
      WHERE user_id = $1
    `;

    const values = [req.user.id];

    if (is_read !== undefined) {
      query += ` AND is_read = $2`;
      values.push(is_read === 'true');
    }

    query += ` ORDER BY created_at DESC LIMIT 50`;

    const result = await db.query(query, values);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: { notifications: result.rows }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get unread notification count
 * @access  Private
 */
router.get('/unread-count', authMiddleware, async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
      [req.user.id]
    );

    res.status(200).json({
      success: true,
      data: { count: parseInt(result.rows[0].count) }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.put('/:id/read', authMiddleware, validateUUID('id'), async (req, res, next) => {
  try {
    const result = await db.query(
      `UPDATE notifications
       SET is_read = true, read_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { notification: result.rows[0] }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/notifications/mark-all-read
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.put('/mark-all-read', authMiddleware, async (req, res, next) => {
  try {
    await db.query(
      `UPDATE notifications
       SET is_read = true, read_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND is_read = false`,
      [req.user.id]
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete notification
 * @access  Private
 */
router.delete('/:id', authMiddleware, validateUUID('id'), async (req, res, next) => {
  try {
    const result = await db.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
