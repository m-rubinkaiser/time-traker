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

    const projects = await Project.find(query).sort({ createdAt: -1 });

    // Attach task counts
    const enriched = await Promise.all(
      projects.map(async (p) => {
        const totalTasks = await Task.countDocuments({ projectId: p._id });
        const completedTasks = await Task.countDocuments({ projectId: p._id, status: 'completed' });
        const timeEntries = await TimeEntry.find({ projectId: p._id });
        const totalMinutes = timeEntries.reduce((sum, e) => sum + e.durationMinutes, 0);
        return { ...p.toObject(), totalTasks, completedTasks, totalMinutes };
      })
    );

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
    const project = await Project.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Cascade delete tasks and time entries
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
