const Booking = require('../models/Booking');
const schedulerConfig = require('../config/scheduler.config');

/**
 * Overdue Bookings Job
 * Detects overdue bookings and sends notifications
 */

// Track last notification times to avoid spam
const notificationCache = new Map();

/**
 * Check if a notification should be sent based on interval settings
 */
function shouldSendNotification(bookingId, hoursOverdue) {
  const cacheKey = `${bookingId}_${Math.floor(hoursOverdue)}`;
  const lastSent = notificationCache.get(cacheKey);

  // Check if this interval has already been notified
  const intervals = schedulerConfig.notifications.overdueReminders;
  const currentInterval = intervals.find(interval => hoursOverdue >= interval);

  if (!currentInterval) {
    return false;
  }

  // If we've already sent for this interval, don't send again
  if (lastSent && lastSent >= currentInterval) {
    return false;
  }

  // Update cache
  notificationCache.set(cacheKey, currentInterval);
  return true;
}

/**
 * Send notification for overdue booking (placeholder for actual implementation)
 */
async function sendOverdueNotification(booking, hoursOverdue, lateFeeInfo) {
  // TODO: Implement actual notification service (email, SMS, etc.)

  const message = {
    to: booking.customer_email,
    subject: `Urgent: Vehicle Overdue - ${booking.make} ${booking.model}`,
    body: `
      Dear ${booking.customer_first_name},

      Your rental of ${booking.make} ${booking.model} (${booking.license_plate})
      was due for return on ${new Date(booking.return_date).toLocaleDateString()}.

      The vehicle is now ${Math.floor(hoursOverdue / 24)} day(s) overdue.

      ${lateFeeInfo.daysLate > 0
        ? `Current late fee: $${lateFeeInfo.lateFee} ($${lateFeeInfo.lateFeePerDay}/day)`
        : 'Late fees will be applied after the grace period.'
      }

      Please return the vehicle immediately to avoid additional charges.

      Booking Reference: ${booking.booking_reference}

      Thank you,
      RentEase Team
    `
  };

  if (schedulerConfig.logging.verbose) {
    console.log('[Overdue] Would send notification:', message);
  }

  // For now, just log - replace with actual email/SMS service
  console.log(
    `[Overdue] 📧 Notification would be sent to ${booking.customer_email} ` +
    `(${Math.floor(hoursOverdue / 24)} days overdue, fee: $${lateFeeInfo.lateFee})`
  );

  return message;
}

/**
 * Process overdue bookings
 */
async function processOverdueBookings() {
  const results = {
    checked: 0,
    overdue: 0,
    notificationsSent: 0,
    failed: 0,
    errors: []
  };

  try {
    // Get all overdue bookings
    const overdueBookings = await Booking.getOverdueBookings();
    results.checked = overdueBookings.length;

    if (schedulerConfig.logging.verbose) {
      console.log(`[Overdue] Found ${overdueBookings.length} overdue bookings`);
    }

    if (overdueBookings.length === 0) {
      return results;
    }

    const currentDate = new Date();

    // Process each overdue booking
    for (const booking of overdueBookings) {
      try {
        const returnDate = new Date(booking.return_date);
        const hoursOverdue = (currentDate - returnDate) / (1000 * 60 * 60);
        const gracePeriodHours = schedulerConfig.lateFees.gracePeriodHours;

        results.overdue++;

        // Calculate current late fee
        const lateFeeInfo = await Booking.calculateLateFee(
          booking.id,
          schedulerConfig.lateFees.ratePerDay,
          schedulerConfig.lateFees.maxPercentage
        );

        // Check if we should send notification
        if (
          schedulerConfig.notifications.enabled &&
          hoursOverdue > gracePeriodHours &&
          shouldSendNotification(booking.id, hoursOverdue)
        ) {
          await sendOverdueNotification(booking, hoursOverdue, lateFeeInfo);
          results.notificationsSent++;
        }

        // Update late fee in database if applicable
        if (lateFeeInfo.daysLate > 0 && schedulerConfig.features.autoLateFees) {
          await Booking.recordLateReturn(
            booking.id,
            currentDate,
            lateFeeInfo.daysLate,
            lateFeeInfo.lateFee
          );
        }

        if (schedulerConfig.logging.verbose) {
          console.log(
            `[Overdue] Processed ${booking.booking_reference}: ` +
            `${lateFeeInfo.daysLate} days late, fee: $${lateFeeInfo.lateFee}`
          );
        }
      } catch (error) {
        results.failed++;
        results.errors.push({
          bookingId: booking.id,
          reference: booking.booking_reference,
          error: error.message
        });

        console.error(
          `[Overdue] ✗ Failed to process booking ${booking.booking_reference}:`,
          error.message
        );
      }
    }
  } catch (error) {
    console.error('[Overdue] Error in processOverdueBookings:', error);
    throw error;
  }

  return results;
}

/**
 * Main job runner - detects and processes overdue bookings
 */
async function runOverdueBookingsJob() {
  const startTime = Date.now();
  console.log('[Overdue] Starting overdue bookings job...');

  const results = {
    timestamp: new Date().toISOString(),
    duration: 0,
    processing: null
  };

  try {
    results.processing = await processOverdueBookings();
    results.duration = Date.now() - startTime;

    if (results.processing.overdue > 0) {
      console.log(
        `[Overdue] Job completed in ${results.duration}ms - ` +
        `Found ${results.processing.overdue} overdue bookings, ` +
        `sent ${results.processing.notificationsSent} notifications`
      );
    } else {
      if (schedulerConfig.logging.verbose) {
        console.log(`[Overdue] Job completed - No overdue bookings found`);
      }
    }

    return results;
  } catch (error) {
    console.error('[Overdue] Job failed:', error);
    results.duration = Date.now() - startTime;
    results.error = error.message;
    throw error;
  }
}

/**
 * Clear notification cache (useful for testing)
 */
function clearNotificationCache() {
  notificationCache.clear();
  console.log('[Overdue] Notification cache cleared');
}

module.exports = {
  runOverdueBookingsJob,
  processOverdueBookings,
  clearNotificationCache
};
