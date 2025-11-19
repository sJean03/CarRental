const Booking = require('../models/Booking');
const schedulerConfig = require('../config/scheduler.config');

/**
 * Booking Lifecycle Job
 * Automatically transitions bookings through their lifecycle stages
 */

/**
 * Transition confirmed bookings to active when pickup date arrives
 */
async function transitionToActive() {
  const results = {
    checked: 0,
    transitioned: 0,
    failed: 0,
    errors: []
  };

  try {
    // Get bookings ready to become active
    const bookings = await Booking.getBookingsReadyForActive(
      schedulerConfig.transitions.bufferMinutes
    );

    results.checked = bookings.length;

    if (schedulerConfig.logging.verbose) {
      console.log(`[Lifecycle] Found ${bookings.length} bookings ready to transition to active`);
    }

    // Transition each booking
    for (const booking of bookings) {
      try {
        await Booking.updateStatus(booking.id, 'active');
        results.transitioned++;

        console.log(
          `[Lifecycle] ✓ Booking ${booking.booking_reference} transitioned to active ` +
          `(${booking.make} ${booking.model} - Customer: ${booking.customer_first_name})`
        );

        // TODO: Send notification to customer
        // await sendNotification(booking, 'rental_started');
      } catch (error) {
        results.failed++;
        results.errors.push({
          bookingId: booking.id,
          reference: booking.booking_reference,
          error: error.message
        });

        console.error(
          `[Lifecycle] ✗ Failed to transition booking ${booking.booking_reference}:`,
          error.message
        );
      }
    }
  } catch (error) {
    console.error('[Lifecycle] Error in transitionToActive:', error);
    throw error;
  }

  return results;
}

/**
 * Transition active bookings to returned when return date arrives
 */
async function transitionToReturned() {
  const results = {
    checked: 0,
    transitioned: 0,
    failed: 0,
    withLateFees: 0,
    errors: []
  };

  try {
    // Get bookings ready to be marked as returned
    const bookings = await Booking.getBookingsReadyForReturn(
      schedulerConfig.transitions.bufferMinutes
    );

    results.checked = bookings.length;

    if (schedulerConfig.logging.verbose) {
      console.log(`[Lifecycle] Found ${bookings.length} bookings ready to transition to returned`);
    }

    // Transition each booking
    for (const booking of bookings) {
      try {
        const returnDate = new Date(booking.return_date);
        const currentDate = new Date();
        const isLate = currentDate > returnDate;

        // Calculate late fees if applicable
        let lateFeeData = null;
        if (isLate && schedulerConfig.features.autoLateFees) {
          lateFeeData = await Booking.calculateLateFee(
            booking.id,
            schedulerConfig.lateFees.ratePerDay,
            schedulerConfig.lateFees.maxPercentage
          );

          if (lateFeeData.daysLate > 0) {
            await Booking.recordLateReturn(
              booking.id,
              currentDate,
              lateFeeData.daysLate,
              lateFeeData.lateFee
            );
            results.withLateFees++;
          }
        }

        // Transition to returned
        await Booking.updateStatus(booking.id, 'returned');
        results.transitioned++;

        const lateFeeMsg = lateFeeData && lateFeeData.daysLate > 0
          ? ` (${lateFeeData.daysLate} days late, fee: $${lateFeeData.lateFee})`
          : '';

        console.log(
          `[Lifecycle] ✓ Booking ${booking.booking_reference} transitioned to returned` +
          lateFeeMsg +
          ` (${booking.make} ${booking.model} - Customer: ${booking.customer_first_name})`
        );

        // TODO: Send notification to owner
        // await sendNotification(booking, 'vehicle_returned');
      } catch (error) {
        results.failed++;
        results.errors.push({
          bookingId: booking.id,
          reference: booking.booking_reference,
          error: error.message
        });

        console.error(
          `[Lifecycle] ✗ Failed to transition booking ${booking.booking_reference}:`,
          error.message
        );
      }
    }
  } catch (error) {
    console.error('[Lifecycle] Error in transitionToReturned:', error);
    throw error;
  }

  return results;
}

/**
 * Main job runner - executes all lifecycle transitions
 */
async function runBookingLifecycleJob() {
  const startTime = Date.now();
  console.log('[Lifecycle] Starting booking lifecycle job...');

  const results = {
    timestamp: new Date().toISOString(),
    duration: 0,
    toActive: null,
    toReturned: null
  };

  try {
    // Transition bookings to active
    if (schedulerConfig.transitions.autoActive) {
      results.toActive = await transitionToActive();
    }

    // Transition bookings to returned
    if (schedulerConfig.transitions.autoReturn) {
      results.toReturned = await transitionToReturned();
    }

    results.duration = Date.now() - startTime;

    const totalTransitioned =
      (results.toActive?.transitioned || 0) +
      (results.toReturned?.transitioned || 0);

    const totalFailed =
      (results.toActive?.failed || 0) +
      (results.toReturned?.failed || 0);

    console.log(
      `[Lifecycle] Job completed in ${results.duration}ms - ` +
      `Transitioned: ${totalTransitioned}, Failed: ${totalFailed}`
    );

    return results;
  } catch (error) {
    console.error('[Lifecycle] Job failed:', error);
    results.duration = Date.now() - startTime;
    results.error = error.message;
    throw error;
  }
}

module.exports = {
  runBookingLifecycleJob,
  transitionToActive,
  transitionToReturned
};
