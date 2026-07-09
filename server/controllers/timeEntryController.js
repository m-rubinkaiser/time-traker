const TimeEntry = require('../models/TimeEntry');
const Task = require('../models/Task');

// Parse "HH:mm" and compute difference in minutes
const calcDuration = (start, end) => {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return (eh * 60 + em) - (sh * 60 + sm);
};

// @desc Get time entries
// @route GET /api/time-entries
const getTimeEntries = async (req, res) => {
  try {
    const { taskId, projectId, date, startDate, endDate } = req.query;
    const query = { userId: req.user._id };
    if (taskId) query.taskId = taskId;
    if (projectId) query.projectId = projectId;
    if (date) {
      const d = new Date(date);
      query.date = { $gte: d, $lt: new Date(d.getTime() + 86400000) };
    }
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const entries = await TimeEntry.find(query)
      .populate('taskId', 'title status')
      .populate('projectId', 'name color')
      .sort({ date: -1, createdAt: -1 });

    res.json(entries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Create time entry (manual or auto)
// @route POST /api/time-entries
const createTimeEntry = async (req, res) => {
  try {
    const { taskId, projectId, date, startTime, endTime, durationMinutes, entryType, remarks } = req.body;

    if (!taskId || !date) {
      return res.status(400).json({ message: 'Task and date are required' });
    }

    let duration = durationMinutes;
    if (!duration && startTime && endTime) {
      duration = calcDuration(startTime, endTime);
    }
    if (!duration || duration <= 0) {
      return res.status(400).json({ message: 'Invalid duration or time range' });
    }

    // Verify task belongs to user
    const task = await Task.findOne({ _id: taskId, userId: req.user._id });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const entry = await TimeEntry.create({
      taskId, projectId: projectId || task.projectId,
      userId: req.user._id, date: new Date(date),
      startTime, endTime, durationMinutes: duration,
      entryType: entryType || 'manual', remarks
    });

    const populated = await entry.populate([
      { path: 'taskId', select: 'title' },
      { path: 'projectId', select: 'name color' }
    ]);

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Update time entry
// @route PUT /api/time-entries/:id
const updateTimeEntry = async (req, res) => {
  try {
    const { startTime, endTime, durationMinutes } = req.body;

    if (startTime && endTime && !durationMinutes) {
      req.body.durationMinutes = calcDuration(startTime, endTime);
    }

    const entry = await TimeEntry.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    ).populate([
      { path: 'taskId', select: 'title' },
      { path: 'projectId', select: 'name color' }
    ]);

    if (!entry) return res.status(404).json({ message: 'Entry not found' });
    res.json(entry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Delete time entry
// @route DELETE /api/time-entries/:id
const deleteTimeEntry = async (req, res) => {
  try {
    const entry = await TimeEntry.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!entry) return res.status(404).json({ message: 'Entry not found' });
    res.json({ message: 'Time entry deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getTimeEntries, createTimeEntry, updateTimeEntry, deleteTimeEntry };
