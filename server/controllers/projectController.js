const Project = require('../models/Project');
const Task = require('../models/Task');
const TimeEntry = require('../models/TimeEntry');

// @desc Get all projects for user
// @route GET /api/projects
const getProjects = async (req, res) => {
  try {
    const { status, search } = req.query;
    const query = { createdBy: req.user._id };
    if (status) query.status = status;
    if (search) query.name = { $regex: search, $options: 'i' };

    const projects = await Project.find(query).sort({ createdAt: -1 }).lean();
    if (projects.length === 0) return res.json([]);

    const projectIds = projects.map(p => p._id);

    const [taskCounts, timeEntrySums] = await Promise.all([
      Task.aggregate([
        { $match: { projectId: { $in: projectIds } } },
        {
          $group: {
            _id: '$projectId',
            totalTasks: { $sum: 1 },
            completedTasks: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }
          }
        }
      ]),
      TimeEntry.aggregate([
        { $match: { projectId: { $in: projectIds } } },
        {
          $group: {
            _id: '$projectId',
            totalMinutes: { $sum: '$durationMinutes' }
          }
        }
      ])
    ]);

    const taskMap = {};
    taskCounts.forEach(t => { taskMap[t._id.toString()] = t; });

    const timeMap = {};
    timeEntrySums.forEach(t => { timeMap[t._id.toString()] = t.totalMinutes; });

    const enriched = projects.map(p => {
      const pId = p._id.toString();
      const tStats = taskMap[pId] || { totalTasks: 0, completedTasks: 0 };
      return {
        ...p,
        totalTasks: tStats.totalTasks || 0,
        completedTasks: tStats.completedTasks || 0,
        totalMinutes: timeMap[pId] || 0
      };
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Get single project
// @route GET /api/projects/:id
const getProject = async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Create project
// @route POST /api/projects
const createProject = async (req, res) => {
  try {
    const { name, client, description, status, color } = req.body;
    if (!name) return res.status(400).json({ message: 'Project name is required' });

    const project = await Project.create({
      name, client, description, status: status || 'active',
      color: color || '#6366f1', createdBy: req.user._id
    });
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Update project
// @route PUT /api/projects/:id
const updateProject = async (req, res) => {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Delete project
// @route DELETE /api/projects/:id
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const taskCount = await Task.countDocuments({ projectId: req.params.id });
    if (taskCount > 0 && req.query.force !== 'true') {
      return res.status(400).json({
        message: `Cannot delete project "${project.name}" because it is currently assigned to ${taskCount} task(s). Please delete or reassign its tasks first.`
      });
    }

    await Project.deleteOne({ _id: req.params.id });

    // Cascade delete tasks and time entries if forced
    const tasks = await Task.find({ projectId: req.params.id });
    const taskIds = tasks.map(t => t._id);
    await TimeEntry.deleteMany({ taskId: { $in: taskIds } });
    await Task.deleteMany({ projectId: req.params.id });

    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getProjects, getProject, createProject, updateProject, deleteProject };
