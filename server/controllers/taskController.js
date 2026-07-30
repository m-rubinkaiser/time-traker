const Task = require('../models/Task');
const TimeEntry = require('../models/TimeEntry');
const Settings = require('../models/Settings');
const VociferService = require('../services/vociferService');

const generateNextTaskNumber = async (userId) => {
  const count = await Task.countDocuments({ userId });
  let nextNum = count + 1;
  let taskNum = `TASK-${1000 + nextNum}`;
  let exists = await Task.findOne({ userId, taskNumber: taskNum });
  while (exists) {
    nextNum++;
    taskNum = `TASK-${1000 + nextNum}`;
    exists = await Task.findOne({ userId, taskNumber: taskNum });
  }
  return taskNum;
};

// @desc Get all tasks
// @route GET /api/tasks
const getTasks = async (req, res) => {
  try {
    const { projectId, status, priority, search, date } = req.query;
    const query = { userId: req.user._id };
    if (projectId === 'no-project' || projectId === 'null') {
      query.$or = [
        { projectId: null },
        { projectId: { $exists: false } }
      ];
    } else if (projectId) {
      query.projectId = projectId;
    }
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (search) query.title = { $regex: search, $options: 'i' };
    if (date) {
      const d = new Date(date);
      const startOfDay = new Date(d.setHours(0,0,0,0));
      const endOfDay = new Date(d.setHours(23,59,59,999));
      
      query.$or = [
        { createdAt: { $lte: endOfDay }, status: { $in: ['pending', 'in-progress'] } },
        { createdAt: { $lte: endOfDay }, status: { $in: ['completed', 'cancelled'] }, completedAt: { $gte: startOfDay } }
      ];
    }

    const tasks = await Task.find(query)
      .populate('projectId', 'name color status')
      .sort({ createdAt: -1 });

    // Attach total logged time per task
    const enriched = await Promise.all(
      tasks.map(async (t) => {
        const entries = await TimeEntry.find({ taskId: t._id });
        const totalMinutes = entries.reduce((sum, e) => sum + e.durationMinutes, 0);
        return { ...t.toObject(), totalMinutes };
      })
    );

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Get single task
// @route GET /api/tasks/:id
const getTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.user._id })
      .populate('projectId', 'name color');
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Create task
// @route POST /api/tasks
const createTask = async (req, res) => {
  try {
    const { projectId, title, description, priority, status, createdAt, developer, tester } = req.body;
    
    const taskNumber = await generateNextTaskNumber(req.user._id);
    const finalTitle = title && title.trim() ? title.trim() : taskNumber;

    const task = await Task.create({
      taskNumber,
      projectId: projectId || null,
      userId: req.user._id,
      title: finalTitle,
      description: description || '',
      priority: priority || 'medium',
      status: status || 'pending',
      createdAt: createdAt ? new Date(createdAt) : Date.now()
    });

    // Try Vocifer Integration
    try {
      const settings = await Settings.findOne({ userId: req.user._id });
      if (settings?.vociferCredentials?.email && settings?.vociferCredentials?.password) {
        const vocifer = new VociferService(settings.vociferCredentials.email, settings.vociferCredentials.password);
        if (await vocifer.initSession()) {
          const devTask = await vocifer.createDevTask(finalTitle, description, priority || 'medium', developer, tester);
          if (devTask && devTask.tkid) {
            task.vociferTaskId = devTask.tkid;
            await task.save();
          }
        }
      }
    } catch (vociferErr) {
      console.error('Vocifer integration error on create:', vociferErr.message);
    }

    const populated = await task.populate('projectId', 'name color');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Update task
// @route PUT /api/tasks/:id
const updateTask = async (req, res) => {
  try {
    if (['completed', 'cancelled'].includes(req.body.status) && !req.body.completedAt) {
      req.body.completedAt = new Date();
    } else if (['pending', 'in-progress'].includes(req.body.status)) {
      req.body.completedAt = null; // Reset if moved back from completed/cancelled
    }
    if (req.body.projectId === '') {
      req.body.projectId = null;
    }
    req.body.updatedAt = new Date();
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    ).populate('projectId', 'name color');
    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (task.status === 'completed' && task.vociferTaskId) {
      try {
        const settings = await Settings.findOne({ userId: req.user._id });
        if (settings?.vociferCredentials?.email && settings?.vociferCredentials?.password) {
          const vocifer = new VociferService(settings.vociferCredentials.email, settings.vociferCredentials.password);
          if (await vocifer.initSession()) {
            await vocifer.updateTaskTime(task.vociferTaskId, 0); // Optionally pass time
          }
        }
      } catch (vociferErr) {
        console.error('Vocifer integration error on update:', vociferErr.message);
      }
    }

    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Delete task
// @route DELETE /api/tasks/:id
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    await TimeEntry.deleteMany({ taskId: req.params.id });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Get Vocifer Employees
// @route GET /api/tasks/vocifer/employees
const getVociferEmployees = async (req, res) => {
  try {
    const settings = await Settings.findOne({ userId: req.user._id });
    if (!settings?.vociferCredentials?.email || !settings?.vociferCredentials?.password) {
      return res.json([]);
    }
    const vocifer = new VociferService(settings.vociferCredentials.email, settings.vociferCredentials.password);
    if (await vocifer.initSession()) {
      const employees = await vocifer.getEmployees();
      return res.json(employees);
    }
    res.json([]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getTasks, getTask, createTask, updateTask, deleteTask, getVociferEmployees };
