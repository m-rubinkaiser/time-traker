const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const TimeEntry = require('../models/TimeEntry');
const Subscription = require('../models/Subscription');
const Settings = require('../models/Settings');
const SystemSettings = require('../models/SystemSettings');
const { refreshSystemSettings, getSystemSettings } = require('../config/systemConfig');
const crypto = require('crypto');

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
const getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({});
    const activeUsers = await User.countDocuments({ isSuspended: false });
    const totalProjects = await Project.countDocuments({});
    const totalTasks = await Task.countDocuments({});
    const completedTasks = await Task.countDocuments({ status: 'completed' });
    const pendingTasks = await Task.countDocuments({ status: { $in: ['pending', 'in-progress'] } });

    // Sum working hours
    const entries = await TimeEntry.find({});
    const totalMinutes = entries.reduce((sum, e) => sum + e.durationMinutes, 0);
    const totalWorkingHours = (totalMinutes / 60).toFixed(1);

    // Active & Expired Subscriptions
    const now = new Date();
    const activeSubscriptions = await Subscription.countDocuments({
      status: 'active',
      expiryDate: { $gte: now }
    });
    const expiredSubscriptions = await Subscription.countDocuments({
      $or: [
        { expiryDate: { $lt: now } },
        { status: 'expired' }
      ]
    });

    // Sum Monthly Revenue (from paid subscriptions created this month)
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyRevenuePaid = await Subscription.find({
      planName: { $ne: 'Free Trial' },
      paymentStatus: 'completed',
      createdAt: { $gte: firstDayOfMonth }
    });
    const monthlyRevenue = monthlyRevenuePaid.reduce((sum, s) => sum + s.amount, 0);

    // User-wise Working Hours
    const users = await User.find({ role: 'user' });
    const userWiseHours = await Promise.all(
      users.map(async (u) => {
        const userEntries = await TimeEntry.find({ userId: u._id });
        const minutes = userEntries.reduce((sum, e) => sum + e.durationMinutes, 0);
        return {
          name: u.name,
          email: u.email,
          hours: parseFloat((minutes / 60).toFixed(1))
        };
      })
    );

    // Daily activity (last 7 days of time entries)
    const dailyActivity = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const start = new Date(d.setHours(0,0,0,0));
      const end = new Date(d.setHours(23,59,59,999));
      const dayEntries = await TimeEntry.find({ createdAt: { $gte: start, $lte: end } });
      const minutes = dayEntries.reduce((sum, e) => sum + e.durationMinutes, 0);
      dailyActivity.push({
        date: start.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' }),
        minutes
      });
    }

    // New user registrations (last 30 days)
    const newRegistrations = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const start = new Date(d.setHours(0,0,0,0));
      const end = new Date(d.setHours(23,59,59,999));
      const count = await User.countDocuments({ createdAt: { $gte: start, $lte: end } });
      newRegistrations.push({
        date: start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count
      });
    }

    res.json({
      totalUsers,
      activeUsers,
      totalProjects,
      totalTasks,
      completedTasks,
      pendingTasks,
      totalWorkingHours,
      activeSubscriptions,
      expiredSubscriptions,
      monthlyRevenue,
      userWiseHours,
      dailyActivity,
      newRegistrations
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    View all users / search users
// @route   GET /api/admin/users
const getUsers = async (req, res) => {
  try {
    const { search } = req.query;
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    
    // Enrich users with subscription status
    const enriched = await Promise.all(
      users.map(async (u) => {
        const activeSub = await Subscription.findOne({
          userId: u._id,
          status: 'active',
          expiryDate: { $gte: new Date() }
        });
        return {
          ...u.toObject(),
          subscription: activeSub ? {
            planName: activeSub.planName,
            expiryDate: activeSub.expiryDate,
            status: activeSub.status
          } : null
        };
      })
    );

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Edit user details
// @route   PUT /api/admin/users/:id
const editUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.role = req.body.role || user.role;
    user.isSuspended = req.body.isSuspended !== undefined ? req.body.isSuspended : user.isSuspended;

    await user.save();
    res.json({ message: 'User updated successfully', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Suspend or activate user
// @route   PUT /api/admin/users/:id/suspend
const toggleUserSuspension = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isSuspended = !user.isSuspended;
    // If we suspend a user, increment tokenVersion to force logout immediately
    if (user.isSuspended) {
      user.tokenVersion += 1;
    }

    await user.save();
    res.json({ message: `User ${user.isSuspended ? 'suspended' : 'activated'} successfully`, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Delete user and all associated data
// @route   DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    await User.findByIdAndDelete(userId);
    await Project.deleteMany({ userId });
    await Task.deleteMany({ userId });
    await TimeEntry.deleteMany({ userId });
    await Settings.deleteMany({ userId });
    await Subscription.deleteMany({ userId });

    res.json({ message: 'User and all associated data deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Reset user password
// @route   PUT /api/admin/users/:id/reset-password
const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.password = password;
    user.tokenVersion += 1; // Log out of active sessions
    await user.save();

    res.json({ message: 'Password reset successfully. Active sessions invalidated.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    View all projects across all users
// @route   GET /api/admin/projects
const getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find({}).populate('userId', 'name email').sort({ createdAt: -1 });
    
    const enriched = await Promise.all(
      projects.map(async (p) => {
        const totalTasks = await Task.countDocuments({ projectId: p._id });
        const pendingTasks = await Task.countDocuments({ projectId: p._id, status: { $in: ['pending', 'in-progress'] } });
        return {
          ...p.toObject(),
          totalTasks,
          pendingTasks
        };
      })
    );

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Delete inappropriate project
// @route   DELETE /api/admin/projects/:id
const deleteProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const project = await Project.findByIdAndDelete(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Cascade delete tasks and time entries
    await Task.deleteMany({ projectId });
    await TimeEntry.deleteMany({ projectId });

    res.json({ message: 'Project and all associated tasks/time entries deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    View all tasks in a project
// @route   GET /api/admin/projects/:id/tasks
const getProjectTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ projectId: req.params.id }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get API token configuration
const getTokenConfig = async (req, res) => {
  try {
    const config = await getSystemSettings();
    // Expose only masked key or key metadata for safety
    const maskedSecret = config.jwtSecret.slice(0, 4) + '...' + config.jwtSecret.slice(-4);
    res.json({
      maskedSecret,
      tokenExpiry: config.tokenExpiry,
      subscriptionTrialDays: config.subscriptionTrialDays,
      subscriptionAmount: config.subscriptionAmount,
      activationToken: config.activationToken
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Update system settings (Token duration, subscriptions)
// @route   PUT /api/admin/token-config
const updateTokenConfig = async (req, res) => {
  try {
    const { tokenExpiry, subscriptionTrialDays, subscriptionAmount, activationToken } = req.body;
    let config = await SystemSettings.findOne({});
    if (!config) {
      config = await SystemSettings.create({});
    }

    if (tokenExpiry) config.tokenExpiry = tokenExpiry;
    if (subscriptionTrialDays !== undefined) config.subscriptionTrialDays = subscriptionTrialDays;
    if (subscriptionAmount !== undefined) config.subscriptionAmount = subscriptionAmount;
    if (activationToken !== undefined) config.activationToken = activationToken;
    config.updatedAt = Date.now();

    await config.save();
    await refreshSystemSettings();

    res.json({ message: 'System settings updated successfully', config });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Regenerate API signing secret (force logs out all users)
// @route   POST /api/admin/regenerate-secret
const regenerateSigningKey = async (req, res) => {
  try {
    let config = await SystemSettings.findOne({});
    if (!config) {
      config = await SystemSettings.create({});
    }

    // Generate a strong random secret
    const newSecret = crypto.randomBytes(32).toString('hex');
    config.jwtSecret = newSecret;
    config.updatedAt = Date.now();
    await config.save();
    
    // Invalidate everyone's token by incrementing their tokenVersion
    await User.updateMany({}, { $inc: { tokenVersion: 1 } });
    
    await refreshSystemSettings();

    res.json({ message: 'Global JWT key regenerated. All active users have been logged out.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Revoke specific user session (force logout individual)
// @route   POST /api/admin/users/:id/revoke-token
const revokeUserToken = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.tokenVersion += 1;
    await user.save();

    res.json({ message: `Session revoked for user ${user.email}. User has been logged out.` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Force logout of all users
// @route   POST /api/admin/force-logout-all
const forceLogoutAll = async (req, res) => {
  try {
    await User.updateMany({}, { $inc: { tokenVersion: 1 } });
    res.json({ message: 'Successfully invalidated all active user sessions.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Admin Manage Subscriptions - Extend trial or paid plan
// @route   PUT /api/admin/users/:id/subscription/extend
const extendSubscription = async (req, res) => {
  try {
    const { days } = req.body;
    if (!days || isNaN(days)) return res.status(400).json({ message: 'Valid number of days required' });

    let activeSub = await Subscription.findOne({
      userId: req.params.id,
      status: 'active',
      expiryDate: { $gte: new Date() }
    });

    if (!activeSub) {
      // Create a new subscription if expired or missing
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + parseInt(days));
      activeSub = await Subscription.create({
        userId: req.params.id,
        planName: 'Paid Plan (Extended)',
        amount: 0,
        startDate: new Date(),
        expiryDate,
        paymentStatus: 'completed',
        status: 'active'
      });
    } else {
      const newExpiry = new Date(activeSub.expiryDate);
      newExpiry.setDate(newExpiry.getDate() + parseInt(days));
      activeSub.expiryDate = newExpiry;
      await activeSub.save();
    }

    res.json({ message: 'Subscription extended successfully', subscription: activeSub });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Admin Manage Subscriptions - Cancel/Deactivate subscription
// @route   PUT /api/admin/users/:id/subscription/cancel
const cancelSubscription = async (req, res) => {
  try {
    const sub = await Subscription.findOneAndUpdate(
      { userId: req.params.id, status: 'active' },
      { status: 'deactivated', expiryDate: new Date() },
      { new: true }
    );

    if (!sub) return res.status(404).json({ message: 'No active subscription found to cancel' });
    res.json({ message: 'Subscription cancelled/deactivated successfully', subscription: sub });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Admin view all subscriptions
// @route   GET /api/admin/subscriptions
const getAllSubscriptions = async (req, res) => {
  try {
    const subs = await Subscription.find({}).populate('userId', 'name email').sort({ createdAt: -1 });
    res.json(subs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getStats,
  getUsers,
  editUser,
  toggleUserSuspension,
  deleteUser,
  resetPassword,
  getAllProjects,
  deleteProject,
  getProjectTasks,
  getTokenConfig,
  updateTokenConfig,
  regenerateSigningKey,
  revokeUserToken,
  forceLogoutAll,
  extendSubscription,
  cancelSubscription,
  getAllSubscriptions
};
