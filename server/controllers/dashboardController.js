const TimeEntry = require('../models/TimeEntry');
const Task = require('../models/Task');
const Project = require('../models/Project');

// @desc Dashboard stats
// @route GET /api/dashboard/stats
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    // Today range
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 86400000);

    // This week (Mon–Sun)
    const dayOfWeek = now.getDay() || 7;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - dayOfWeek + 1);
    weekStart.setHours(0, 0, 0, 0);

    // This month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalProjects, activeProjects, completedTasks, pendingTasks,
      todayEntries, weekEntries, monthEntries, allEntries
    ] = await Promise.all([
      Project.countDocuments({ createdBy: userId }),
      Project.countDocuments({ createdBy: userId, status: 'active' }),
      Task.countDocuments({ userId, status: 'completed' }),
      Task.countDocuments({ userId, status: { $in: ['pending', 'in-progress'] } }),
      TimeEntry.find({ userId, date: { $gte: todayStart, $lt: todayEnd } }),
      TimeEntry.find({ userId, date: { $gte: weekStart } }),
      TimeEntry.find({ userId, date: { $gte: monthStart } }),
      TimeEntry.find({ userId })
    ]);

    const sumMin = (entries) => entries.reduce((s, e) => s + e.durationMinutes, 0);

    res.json({
      totalProjects,
      activeProjects,
      completedTasks,
      pendingTasks,
      todayMinutes: sumMin(todayEntries),
      weekMinutes: sumMin(weekEntries),
      monthMinutes: sumMin(monthEntries),
      totalMinutes: sumMin(allEntries)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Daily chart data (last 30 days)
// @route GET /api/dashboard/daily-chart
const getDailyChart = async (req, res) => {
  try {
    const userId = req.user._id;
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const entries = await TimeEntry.find({ userId, date: { $gte: startDate } });

    // Group by date
    const map = {};
    entries.forEach(e => {
      const key = e.date.toISOString().split('T')[0];
      map[key] = (map[key] || 0) + e.durationMinutes;
    });

    // Fill in zeros for missing days
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      result.push({ date: key, minutes: map[key] || 0 });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Monthly chart data (12 months)
// @route GET /api/dashboard/monthly-chart
const getMonthlyChart = async (req, res) => {
  try {
    const userId = req.user._id;
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const start = new Date(year, 0, 1);
    const end = new Date(year + 1, 0, 1);

    const entries = await TimeEntry.find({ userId, date: { $gte: start, $lt: end } });

    const months = Array(12).fill(0);
    entries.forEach(e => {
      months[e.date.getMonth()] += e.durationMinutes;
    });

    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    res.json(monthNames.map((m, i) => ({ month: m, minutes: months[i] })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Project-wise time chart
// @route GET /api/dashboard/project-chart
const getProjectChart = async (req, res) => {
  try {
    const userId = req.user._id;
    const projects = await Project.find({ createdBy: userId });

    const data = await Promise.all(
      projects.map(async (p) => {
        const entries = await TimeEntry.find({ userId, projectId: p._id });
        const minutes = entries.reduce((s, e) => s + e.durationMinutes, 0);
        return { name: p.name, minutes, color: p.color };
      })
    );

    res.json(data.filter(d => d.minutes > 0));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Recent activity
// @route GET /api/dashboard/recent
const getRecentActivity = async (req, res) => {
  try {
    const userId = req.user._id;

    const [recentEntries, recentTasks] = await Promise.all([
      TimeEntry.find({ userId })
        .sort({ createdAt: -1 }).limit(5)
        .populate('taskId', 'title')
        .populate('projectId', 'name color'),
      Task.find({ userId })
        .sort({ createdAt: -1 }).limit(5)
        .populate('projectId', 'name color')
    ]);

    res.json({ recentEntries, recentTasks });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getDashboardStats, getDailyChart, getMonthlyChart, getProjectChart, getRecentActivity };
