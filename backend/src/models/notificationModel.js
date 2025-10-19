const db = require('../config/database');

const notificationModel = {
  // Create notification
  async create(notificationData) {
    const query = `
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        related_id,
        related_type
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const values = [
      notificationData.user_id,
      notificationData.type,
      notificationData.title,
      notificationData.message,
      notificationData.related_id || null,
      notificationData.related_type || null
    ];
    
    const result = await db.query(query, values);
    return result.rows[0];
  },

  // Find by ID
  async findById(id) {
    const query = 'SELECT * FROM notifications WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0];
  },

  // Find by user ID
  async findByUserId(userId, filters = {}) {
    let query = `
      SELECT * FROM notifications 
      WHERE user_id = $1
    `;
    
    const params = [userId];
    let paramIndex = 2;

    // Filter by read status
    if (filters.unread_only === 'true' || filters.unread_only === true) {
      query += ` AND is_read = false`;
    }

    // Pagination
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const offset = (page - 1) * limit;

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);
    return result.rows;
  },

  // Get unread count
  async getUnreadCount(userId) {
    const query = `
      SELECT COUNT(*) as count
      FROM notifications
      WHERE user_id = $1 AND is_read = false
    `;
    const result = await db.query(query, [userId]);
    return parseInt(result.rows[0].count);
  },

  // Mark as read
  async markAsRead(id, userId) {
    const query = `
      UPDATE notifications 
      SET is_read = true
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;
    const result = await db.query(query, [id, userId]);
    return result.rows[0];
  },

  // Mark all as read
  async markAllAsRead(userId) {
    const query = `
      UPDATE notifications 
      SET is_read = true
      WHERE user_id = $1 AND is_read = false
      RETURNING id
    `;
    const result = await db.query(query, [userId]);
    return result.rows;
  },

  // Delete notification
  async delete(id, userId) {
    const query = `
      DELETE FROM notifications 
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;
    const result = await db.query(query, [id, userId]);
    return result.rows[0];
  },

  // Delete all for user
  async deleteAllByUserId(userId) {
    const query = `
      DELETE FROM notifications 
      WHERE user_id = $1
      RETURNING id
    `;
    const result = await db.query(query, [userId]);
    return result.rows;
  },

  // Get recent notifications
  async getRecent(userId, limit = 5) {
    const query = `
      SELECT * FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;
    const result = await db.query(query, [userId, limit]);
    return result.rows;
  },

  // Delete old notifications (cleanup)
  async deleteOld(daysToKeep = 30) {
    const query = `
      DELETE FROM notifications
      WHERE created_at < NOW() - $1::interval
      AND is_read = true
      RETURNING COUNT(*) as deleted_count
    `;
    const result = await db.query(query, [`${daysToKeep} days`]);
    return result.rows[0];
  },

  // Helper: Create booking notification
  async createBookingNotification(userId, bookingId, bookingRef, type) {
    const messages = {
      'created': {
        title: 'Booking Created',
        message: `Your booking ${bookingRef} has been created. Please complete payment to confirm.`,
        type: 'booking_created'
      },
      'confirmed': {
        title: 'Booking Confirmed',
        message: `Your booking ${bookingRef} has been confirmed! Get ready for your rental.`,
        type: 'booking_confirmed'
      },
      'active': {
        title: 'Rental Started',
        message: `Your rental ${bookingRef} is now active. Enjoy your trip!`,
        type: 'rental_started'
      },
      'completed': {
        title: 'Rental Completed',
        message: `Thank you for returning the vehicle! Booking ${bookingRef} is complete.`,
        type: 'rental_completed'
      },
      'cancelled': {
        title: 'Booking Cancelled',
        message: `Your booking ${bookingRef} has been cancelled.`,
        type: 'booking_cancelled'
      }
    };

    const notification = messages[type];
    if (!notification) return null;

    return await this.create({
      user_id: userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      related_id: bookingId,
      related_type: 'booking'
    });
  },

  // Helper: Create payment notification
  async createPaymentNotification(userId, paymentId, amount, status) {
    const messages = {
      'verified': {
        title: 'Payment Verified',
        message: `Your payment of ₱${amount.toLocaleString()} has been verified.`
      },
      'completed': {
        title: 'Payment Received',
        message: `Payment of ₱${amount.toLocaleString()} received successfully.`
      },
      'refunded': {
        title: 'Payment Refunded',
        message: `₱${amount.toLocaleString()} has been refunded to you.`
      }
    };

    const notification = messages[status];
    if (!notification) return null;

    return await this.create({
      user_id: userId,
      type: `payment_${status}`,
      title: notification.title,
      message: notification.message,
      related_id: paymentId,
      related_type: 'payment'
    });
  },

  // Helper: Create maintenance notification (for owners)
  async createMaintenanceNotification(userId, vehicleId, vehicleName, message) {
    return await this.create({
      user_id: userId,
      type: 'maintenance_alert',
      title: 'Vehicle Maintenance Required',
      message: `${vehicleName}: ${message}`,
      related_id: vehicleId,
      related_type: 'vehicle'
    });
  }
};

module.exports = notificationModel;