const cron = require('node-cron');
const schedulerConfig = require('../config/scheduler.config');

/**
 * Scheduler Service
 * Manages all cron jobs for automated booking lifecycle operations
 */
class SchedulerService {
  constructor() {
    this.jobs = new Map();
    this.isRunning = false;
  }

  /**
   * Initialize and start all scheduled jobs
   */
  start() {
    if (!schedulerConfig.features.schedulerEnabled) {
      console.log('[Scheduler] Scheduler is disabled via configuration');
      return;
    }

    if (this.isRunning) {
      console.log('[Scheduler] Scheduler is already running');
      return;
    }

    console.log('[Scheduler] Starting automated job scheduler...');

    // Import job modules
    const { runBookingLifecycleJob } = require('../jobs/bookingLifecycleJob');
    const { runOverdueBookingsJob } = require('../jobs/overdueBookingsJob');

    // Schedule booking lifecycle transitions (every 15 minutes)
    if (schedulerConfig.features.autoTransitions) {
      const lifecycleJob = cron.schedule(
        schedulerConfig.schedules.bookingLifecycle,
        async () => {
          try {
            if (schedulerConfig.logging.verbose) {
              console.log('[Scheduler] Running booking lifecycle job...');
            }
            await runBookingLifecycleJob();
          } catch (error) {
            console.error('[Scheduler] Error in booking lifecycle job:', error);
          }
        },
        {
          scheduled: false,
        }
      );
      this.jobs.set('bookingLifecycle', lifecycleJob);
      lifecycleJob.start();
      console.log('[Scheduler] Booking lifecycle job scheduled:', schedulerConfig.schedules.bookingLifecycle);
    }

    // Schedule overdue bookings check (every hour)
    if (schedulerConfig.features.overdueDetection) {
      const overdueJob = cron.schedule(
        schedulerConfig.schedules.overdueBookings,
        async () => {
          try {
            if (schedulerConfig.logging.verbose) {
              console.log('[Scheduler] Running overdue bookings job...');
            }
            await runOverdueBookingsJob();
          } catch (error) {
            console.error('[Scheduler] Error in overdue bookings job:', error);
          }
        },
        {
          scheduled: false,
        }
      );
      this.jobs.set('overdueBookings', overdueJob);
      overdueJob.start();
      console.log('[Scheduler] Overdue bookings job scheduled:', schedulerConfig.schedules.overdueBookings);
    }

    this.isRunning = true;
    console.log(`[Scheduler] Started ${this.jobs.size} scheduled jobs`);

    // Run jobs immediately on startup for immediate processing
    if (schedulerConfig.features.autoTransitions) {
      runBookingLifecycleJob().catch(error => {
        console.error('[Scheduler] Error running initial lifecycle job:', error);
      });
    }

    if (schedulerConfig.features.overdueDetection) {
      runOverdueBookingsJob().catch(error => {
        console.error('[Scheduler] Error running initial overdue job:', error);
      });
    }
  }

  /**
   * Stop all scheduled jobs
   */
  stop() {
    if (!this.isRunning) {
      console.log('[Scheduler] Scheduler is not running');
      return;
    }

    console.log('[Scheduler] Stopping all scheduled jobs...');

    for (const [name, job] of this.jobs.entries()) {
      job.stop();
      console.log(`[Scheduler] Stopped job: ${name}`);
    }

    this.jobs.clear();
    this.isRunning = false;
    console.log('[Scheduler] All jobs stopped');
  }

  /**
   * Get status of all scheduled jobs
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      jobCount: this.jobs.size,
      jobs: Array.from(this.jobs.keys()),
      config: {
        autoTransitions: schedulerConfig.features.autoTransitions,
        overdueDetection: schedulerConfig.features.overdueDetection,
        autoLateFees: schedulerConfig.features.autoLateFees,
      },
    };
  }

  /**
   * Manually trigger a specific job
   */
  async runJob(jobName) {
    const { runBookingLifecycleJob } = require('../jobs/bookingLifecycleJob');
    const { runOverdueBookingsJob } = require('../jobs/overdueBookingsJob');

    switch (jobName) {
      case 'bookingLifecycle':
        return await runBookingLifecycleJob();
      case 'overdueBookings':
        return await runOverdueBookingsJob();
      default:
        throw new Error(`Unknown job: ${jobName}`);
    }
  }
}

// Export singleton instance
module.exports = new SchedulerService();
