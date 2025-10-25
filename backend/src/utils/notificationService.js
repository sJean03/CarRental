const db = require('../config/database');

/**
 * Simple notification logger (console-based for now)
 * Can be replaced with actual email service post-MVP
 */

/**
 * Log notification to console
 */
const logNotification = (userEmail, type, title, message) => {
  console.log('\n📧 ===== NOTIFICATION =====');
  console.log(`To: ${userEmail}`);
  console.log(`Type: ${type}`);
  console.log(`Title: ${title}`);
  console.log(`Message: ${message}`);
  console.log('==========================\n');
};

/**
 * Create notification in database and log to console
 */
const createNotification = async (userId, userEmail, type, title, message, relatedId = null, relatedType = null, actionUrl = null) => {
  try {
    const query = `
      INSERT INTO notifications (user_id, type, title, message, related_id, related_type, action_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const values = [userId, type, title, message, relatedId, relatedType, actionUrl];
    const result = await db.query(query, values);
    
    // Log to console
    logNotification(userEmail, type, title, message);
    
    return result.rows[0];
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Send booking confirmation notification
 */
const sendBookingConfirmation = async (userId, userEmail, bookingReference, carDetails) => {
  const title = 'Booking Confirmed!';
  const message = `Your booking ${bookingReference} for ${carDetails} has been confirmed.`;
  
  return await createNotification(
    userId,
    userEmail,
    'booking_confirmed',
    title,
    message,
    null,
    'booking',
    `/bookings/${bookingReference}`
  );
};

/**
 * Send car approval notification
 */
const sendCarApproval = async (userId, userEmail, carDetails) => {
  const title = 'Car Listing Approved!';
  const message = `Your ${carDetails} has been approved and is now listed on RentEase.`;
  
  return await createNotification(
    userId,
    userEmail,
    'car_approved',
    title,
    message
  );
};

/**
 * Send car rejection notification
 */
const sendCarRejection = async (userId, userEmail, carDetails, reason) => {
  const title = 'Car Listing Needs Attention';
  const message = `Your ${carDetails} listing was not approved. Reason: ${reason}`;
  
  return await createNotification(
    userId,
    userEmail,
    'car_rejected',
    title,
    message
  );
};

/**
 * Send payment received notification
 */
const sendPaymentReceived = async (userId, userEmail, amount, bookingReference) => {
  const title = 'Payment Received';
  const message = `We've received your payment of ₱${amount} for booking ${bookingReference}.`;
  
  return await createNotification(
    userId,
    userEmail,
    'payment_received',
    title,
    message
  );
};

/**
 * Send payment failed notification
 */
const sendPaymentFailed = async (userId, userEmail, bookingReference) => {
  const title = 'Payment Failed';
  const message = `Payment for booking ${bookingReference} could not be processed. Please try again.`;
  
  return await createNotification(
    userId,
    userEmail,
    'payment_failed',
    title,
    message
  );
};

module.exports = {
  createNotification,
  sendBookingConfirmation,
  sendCarApproval,
  sendCarRejection,
  sendPaymentReceived,
  sendPaymentFailed,
  logNotification
};