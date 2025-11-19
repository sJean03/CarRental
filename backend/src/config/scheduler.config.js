/**
 * Scheduler Configuration
 * Defines cron schedules and settings for automated jobs
 */

module.exports = {
  // Cron schedule patterns (using node-cron syntax)
  schedules: {
    // Check for bookings needing status transitions every 15 minutes
    bookingLifecycle: '*/15 * * * *', // Every 15 minutes

    // Check for overdue bookings every hour
    overdueBookings: '0 * * * *', // Every hour at minute 0

    // Daily cleanup and maintenance at 2 AM
    dailyMaintenance: '0 2 * * *', // 2:00 AM daily
  },

  // Late fee configuration
  lateFees: {
    // Percentage of daily rate to charge per late day
    ratePerDay: 0.20, // 20% per day

    // Maximum late fee (percentage of total rental cost)
    maxPercentage: 1.0, // 100% of rental cost

    // Grace period in hours before late fees apply
    gracePeriodHours: 2,
  },

  // Notification settings
  notifications: {
    // Enable/disable notifications
    enabled: true,

    // Overdue reminder intervals (hours after due time)
    overdueReminders: [1, 6, 24, 48],

    // Email notification settings
    email: {
      from: process.env.EMAIL_FROM || 'noreply@rentease.com',
      replyTo: process.env.EMAIL_REPLY_TO || 'support@rentease.com',
    },
  },

  // Transition settings
  transitions: {
    // Enable automatic transitions
    autoActive: true,
    autoReturn: true,

    // Time buffer before pickup/return (minutes)
    // e.g., if pickup is at 10:00 AM, transition at 9:45 AM
    bufferMinutes: 15,
  },

  // Logging settings
  logging: {
    // Enable detailed logging for debugging
    verbose: process.env.NODE_ENV === 'development',

    // Log all automated actions to database
    auditDatabase: true,
  },

  // Feature toggles (can be controlled via environment variables)
  features: {
    // Enable/disable the entire scheduler
    schedulerEnabled: process.env.SCHEDULER_ENABLED !== 'false',

    // Individual feature toggles
    autoTransitions: process.env.AUTO_TRANSITIONS !== 'false',
    overdueDetection: process.env.OVERDUE_DETECTION !== 'false',
    autoLateFees: process.env.AUTO_LATE_FEES !== 'false',
  },
};
