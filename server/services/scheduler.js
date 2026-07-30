const cron = require('node-cron');
const User = require('../models/User');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { sendPendingTasksEmail } = require('./mailService');

/**
 * Main job logic to find users with pending tasks and notify them via email.
 */
const runDailyNotificationJob = async () => {
  console.log('[Scheduler] Running daily task notification job...');
  const results = [];
  try {
    const users = await User.find({});
    console.log(`[Scheduler] Found ${users.length} users to process.`);

    for (const user of users) {
      try {
        // Find tasks that are not completed and not cancelled
        const pendingTasks = await Task.find({
          userId: user._id,
          status: { $nin: ['completed', 'cancelled'] }
        }).populate('projectId');

        if (pendingTasks.length > 0) {
          // Validate email format and check for fake/placeholder domains
          const lowerEmail = user.email ? user.email.toLowerCase() : '';
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          const isFake = !user.email || 
                         !emailRegex.test(user.email) || 
                         lowerEmail.endsWith('example.com') || 
                         lowerEmail.endsWith('test.com') || 
                         lowerEmail.endsWith('fake.com') || 
                         lowerEmail.endsWith('temp.com') || 
                         lowerEmail.endsWith('invalid.com');

          if (isFake) {
            console.log(`[Scheduler] Skipping invalid/fake email address: ${user.email}`);
            results.push({ email: user.email, status: 'skipped (fake/invalid email)', taskCount: pendingTasks.length });
            continue;
          }

          console.log(`[Scheduler] User ${user.email} has ${pendingTasks.length} pending tasks. Sending email...`);
          try {
            await sendPendingTasksEmail(user.email, user.name, pendingTasks);
            results.push({ email: user.email, status: 'success', taskCount: pendingTasks.length });
          } catch (mailErr) {
            console.error(`[Scheduler] Failed to send email to ${user.email}:`, mailErr.message);
            results.push({ email: user.email, status: 'failed', error: mailErr.message, taskCount: pendingTasks.length });
          }
        } else {
          console.log(`[Scheduler] User ${user.email} has no pending tasks. Skipping.`);
          results.push({ email: user.email, status: 'skipped (no pending tasks)', taskCount: 0 });
        }
      } catch (userErr) {
        console.error(`[Scheduler] Error processing user ${user?.email || user?._id}:`, userErr.message);
        results.push({ email: user?.email || 'unknown', status: 'error', error: userErr.message, taskCount: 0 });
      }
    }
    console.log('[Scheduler] Daily task notification job finished.');
    return { success: true, results };
  } catch (err) {
    console.error('[Scheduler] Error in daily notification job:', err.message);
    return { success: false, error: err.message };
  }
};

const { getSystemSettings } = require('../config/systemConfig');

let scheduledJobs = [];

/**
 * Initializes the cron scheduler.
 */
const initScheduler = async () => {
  // Clear any existing cron jobs
  scheduledJobs.forEach(job => {
    if (job && typeof job.stop === 'function') {
      job.stop();
    }
  });
  scheduledJobs = [];

  try {
    const settings = await getSystemSettings();
    const times = settings.notificationTimes || ['06:00'];
    console.log(`⏰ [Scheduler] Initializing task email notifications for times: ${times.join(', ')}`);

    times.forEach(time => {
      const parts = time.split(':');
      if (parts.length === 2) {
        const hour = parseInt(parts[0], 10);
        const minute = parseInt(parts[1], 10);
        if (!isNaN(hour) && !isNaN(minute) && hour >= 0 && hour < 24 && minute >= 0 && minute < 60) {
          const cronExp = `${minute} ${hour} * * *`;
          const job = cron.schedule(cronExp, () => {
            console.log(`[Scheduler] Dynamic job triggered for scheduled time: ${time}`);
            runDailyNotificationJob();
          });
          scheduledJobs.push(job);
          console.log(`⏰ [Scheduler] Registered daily notification job for ${time} (${cronExp})`);
        } else {
          console.warn(`[Scheduler] Invalid time format ignored: ${time}`);
        }
      } else {
        console.warn(`[Scheduler] Invalid time pattern ignored: ${time}`);
      }
    });
  } catch (err) {
    console.error('[Scheduler] Failed to load settings or initialize schedules:', err.message);
  }
};

module.exports = {
  initScheduler,
  runDailyNotificationJob
};
