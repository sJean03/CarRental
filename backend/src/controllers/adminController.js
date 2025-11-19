const Booking = require('../models/Booking');
const schedulerService = require('../services/schedulerService');
const { runBookingLifecycleJob } = require('../jobs/bookingLifecycleJob');
const { runOverdueBookingsJob } = require('../jobs/overdueBookingsJob');

/**
 * Admin Controller
 * Handles admin-specific operations and lifecycle monitoring
 */

/**
 * Get lifecycle statistics for admin dashboard
 */
exports.getLifecycleStats = async (req, res) => {
  try {
    // Get booking counts by status
    const lifecycleStats = await Booking.getLifecycleStats();

    // Get overdue bookings count and total late fees
    const overdueBookings = await Booking.getOverdueBookings();
    const totalLateFees = overdueBookings.reduce(
      (sum, booking) => sum + (parseFloat(booking.late_fee) || 0),
      0
    );

    // Get upcoming transitions (bookings that will transition soon)
    const upcomingActive = await Booking.getBookingsReadyForActive(60); // Next hour
    const upcomingReturn = await Booking.getBookingsReadyForReturn(60); // Next hour

    // Get scheduler status
    const schedulerStatus = schedulerService.getStatus();

    res.json({
      success: true,
      data: {
        lifecycle: lifecycleStats,
        overdue: {
          count: overdueBookings.length,
          totalLateFees: Math.round(totalLateFees * 100) / 100
        },
        upcoming: {
          toActive: upcomingActive.length,
          toReturn: upcomingReturn.length
        },
        scheduler: schedulerStatus
      }
    });
  } catch (error) {
    console.error('Error getting lifecycle stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get lifecycle statistics',
      error: error.message
    });
  }
};

/**
 * Get all overdue bookings with details
 */
exports.getOverdueBookings = async (req, res) => {
  try {
    const overdueBookings = await Booking.getOverdueBookings();

    // Calculate additional details for each booking
    const enrichedBookings = overdueBookings.map(booking => {
      const returnDate = new Date(booking.return_date);
      const currentDate = new Date();
      const daysOverdue = Math.floor((currentDate - returnDate) / (1000 * 60 * 60 * 24));

      return {
        ...booking,
        days_overdue: daysOverdue,
        late_fee_display: parseFloat(booking.late_fee) || 0
      };
    });

    res.json({
      success: true,
      count: enrichedBookings.length,
      data: enrichedBookings
    });
  } catch (error) {
    console.error('Error getting overdue bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get overdue bookings',
      error: error.message
    });
  }
};

/**
 * Get bookings by status
 */
exports.getBookingsByStatus = async (req, res) => {
  try {
    const { statuses } = req.query;

    if (!statuses) {
      return res.status(400).json({
        success: false,
        message: 'Please provide statuses parameter (comma-separated)'
      });
    }

    const statusArray = statuses.split(',').map(s => s.trim());
    const bookings = await Booking.getBookingsByStatus(statusArray);

    res.json({
      success: true,
      count: bookings.length,
      statuses: statusArray,
      data: bookings
    });
  } catch (error) {
    console.error('Error getting bookings by status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get bookings by status',
      error: error.message
    });
  }
};

/**
 * Manually trigger a job (for admin testing)
 */
exports.triggerJob = async (req, res) => {
  try {
    const { jobName } = req.params;

    let result;
    switch (jobName) {
      case 'lifecycle':
        result = await runBookingLifecycleJob();
        break;
      case 'overdue':
        result = await runOverdueBookingsJob();
        break;
      default:
        return res.status(400).json({
          success: false,
          message: `Unknown job: ${jobName}. Available: lifecycle, overdue`
        });
    }

    res.json({
      success: true,
      message: `Job '${jobName}' executed successfully`,
      data: result
    });
  } catch (error) {
    console.error(`Error triggering job ${req.params.jobName}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to execute job',
      error: error.message
    });
  }
};

/**
 * Get scheduler status
 */
exports.getSchedulerStatus = async (req, res) => {
  try {
    const status = schedulerService.getStatus();

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting scheduler status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get scheduler status',
      error: error.message
    });
  }
};

/**
 * Force transition a booking to a new status
 */
exports.forceTransition = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a status to transition to'
      });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Update booking status
    const updatedBooking = await Booking.updateStatus(id, status);

    console.log(
      `[Admin] Force transition: Booking ${booking.booking_reference} ` +
      `${booking.status} → ${status} (Reason: ${reason || 'N/A'})`
    );

    res.json({
      success: true,
      message: `Booking transitioned from ${booking.status} to ${status}`,
      data: updatedBooking
    });
  } catch (error) {
    console.error('Error forcing transition:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to force transition',
      error: error.message
    });
  }
};

/**
 * Get upcoming transitions (next 24 hours)
 */
exports.getUpcomingTransitions = async (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const bufferMinutes = hours * 60;

    const toActive = await Booking.getBookingsReadyForActive(bufferMinutes);
    const toReturn = await Booking.getBookingsReadyForReturn(bufferMinutes);

    res.json({
      success: true,
      timeframe: `Next ${hours} hours`,
      data: {
        toActive: {
          count: toActive.length,
          bookings: toActive
        },
        toReturn: {
          count: toReturn.length,
          bookings: toReturn
        }
      }
    });
  } catch (error) {
    console.error('Error getting upcoming transitions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get upcoming transitions',
      error: error.message
    });
  }
};
