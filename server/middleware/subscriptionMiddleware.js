const Subscription = require('../models/Subscription');

const checkSubscription = async (req, res, next) => {
  // Allow admins to bypass subscription checks
  if (req.user && req.user.role === 'admin') {
    return next();
  }

  // Exempt routes
  const exemptPaths = [
    '/api/auth',
    '/api/subscription',
    '/api/health'
  ];

  if (exemptPaths.some(path => req.originalUrl.startsWith(path))) {
    return next();
  }

  try {
    const activeSub = await Subscription.findOne({
      userId: req.user._id,
      status: 'active',
      expiryDate: { $gte: new Date() }
    });

    if (!activeSub) {
      // If there's no active subscription, allow GET requests to succeed but return empty lists/zeros
      if (req.method === 'GET') {
        const url = req.originalUrl;
        
        if (url.startsWith('/api/projects')) {
          return res.json([]);
        }
        if (url.startsWith('/api/tasks')) {
          return res.json([]);
        }
        if (url.startsWith('/api/time-entries')) {
          return res.json([]);
        }
        if (url.startsWith('/api/reports')) {
          return res.json([]);
        }
        if (url.startsWith('/api/dashboard/stats')) {
          return res.json({
            totalProjects: 0,
            activeProjects: 0,
            completedTasks: 0,
            pendingTasks: 0,
            todayMinutes: 0,
            weekMinutes: 0,
            monthMinutes: 0,
            totalMinutes: 0
          });
        }
        if (
          url.startsWith('/api/dashboard/daily-chart') ||
          url.startsWith('/api/dashboard/monthly-chart') ||
          url.startsWith('/api/dashboard/project-chart')
        ) {
          return res.json([]);
        }
        if (url.startsWith('/api/dashboard/recent')) {
          return res.json({ recentEntries: [], recentTasks: [] });
        }
        
        // Default empty list response for other potential dashboard / data queries
        return res.json([]);
      }

      // Block writing actions (creating projects, tasks, logging time)
      return res.status(403).json({
        code: 'PAYMENT_REQUIRED',
        message: 'Subscription required to create projects, tasks, or log time entries.'
      });
    }

    next();
  } catch (err) {
    res.status(500).json({ message: 'Error checking subscription status' });
  }
};

module.exports = checkSubscription;
