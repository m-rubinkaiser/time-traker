const cron = require('node-cron');
const User = require('../models/User');
const Task = require('../models/Task');
const { sendPendingTasksEmail } = require('./mailService');

/**
 * Main job logic to find users with pending tasks and notify them via email.
 */
const runDailyNotificationJob = async () => {
  console.log('[Scheduler] Running daily task notification job...');
  try {
    const users = await User.find({});
    console.log(`[Scheduler] Found ${users.length} users to process.`);

    for (const user of users) {
      // Find tasks that are not completed and not cancelled
      const pendingTasks = await Task.find({
        userId: user._id,
        status: { $nin: ['completed', 'cancelled'] }
      }).populate('projectId');

      if (pendingTasks.length > 0) {
        console.log(`[Scheduler] User ${user.email} has ${pendingTasks.length} pending tasks. Sending email...`);
        try {
          await sendPendingTasksEmail(user.email, user.name, pendingTasks);
        } catch (mailErr) {
          console.error(`[Scheduler] Failed to send email to ${user.email}:`, mailErr.message);
        }
      } else {
        console.log(`[Scheduler] User ${user.email} has no pending tasks. Skipping.`);
      }
    }
    console.log('[Scheduler] Daily task notification job finished.');
  } catch (err) {
    console.error('[Scheduler] Error in daily notification job:', err.message);
  }
};

/**
 * Initializes the cron scheduler.
 */
const initScheduler = () => {
  // Cron schedule: 0 6 * * * -> 6:00 AM every day
  cron.schedule('0 6 * * *', () => {
    runDailyNotificationJob();
  });
  console.log('⏰ [Scheduler] Daily pending task email job registered for 6:00 AM.');
};

module.exports = {
  initScheduler,
  runDailyNotificationJob
};
