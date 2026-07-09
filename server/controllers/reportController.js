const TimeEntry = require('../models/TimeEntry');
const Task = require('../models/Task');
const Project = require('../models/Project');
const ExcelJS = require('exceljs');

const getDateRange = (filter, year, month) => {
  const now = new Date();
  let start, end;

  switch (filter) {
    case 'day':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(start.getTime() + 86400000);
      break;
    case 'week': {
      const dow = now.getDay() || 7;
      start = new Date(now); start.setDate(now.getDate() - dow + 1); start.setHours(0,0,0,0);
      end = new Date(start); end.setDate(start.getDate() + 7);
      break;
    }
    case 'month':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      break;
    case 'year':
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear() + 1, 0, 1);
      break;
    default:
      start = new Date(2000, 0, 1);
      end = new Date(now.getFullYear() + 1, 0, 1);
  }

  if (year && month) {
    start = new Date(parseInt(year), parseInt(month) - 1, 1);
    end = new Date(parseInt(year), parseInt(month), 1);
  } else if (year) {
    start = new Date(parseInt(year), 0, 1);
    end = new Date(parseInt(year) + 1, 0, 1);
  }

  return { start, end };
};

// @desc Daily report
// @route GET /api/reports/daily
const getDailyReport = async (req, res) => {
  try {
    const userId = req.user._id;
    const { filter, year, month, projectId, taskId, status, startDate, endDate } = req.query;

    let dateQuery;
    if (startDate && endDate) {
      dateQuery = { $gte: new Date(startDate), $lte: new Date(endDate) };
    } else {
      const { start, end } = getDateRange(filter || 'month', year, month);
      dateQuery = { $gte: start, $lt: end };
    }

    const query = { userId, date: dateQuery };
    if (projectId) query.projectId = projectId;
    if (taskId) query.taskId = taskId;

    let entries = await TimeEntry.find(query)
      .populate('taskId', 'title status priority')
      .populate('projectId', 'name color')
      .sort({ date: 1 });

    if (status) {
      entries = entries.filter(e => e.taskId && e.taskId.status === status);
    }

    res.json(entries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Monthly report
// @route GET /api/reports/monthly
const getMonthlyReport = async (req, res) => {
  try {
    const userId = req.user._id;
    const { year, month, projectId, filter, startDate, endDate } = req.query;
    
    let dateQuery;
    if (startDate && endDate) {
      dateQuery = { $gte: new Date(startDate), $lte: new Date(endDate) };
    } else {
      const { start, end } = getDateRange(filter || 'month', year, month);
      dateQuery = { $gte: start, $lt: end };
    }

    const query = { userId, date: dateQuery };
    if (projectId) query.projectId = projectId;

    const entries = await TimeEntry.find(query)
      .populate('projectId', 'name color')
      .populate('taskId', 'title status');

    // Group by date
    const grouped = {};
    entries.forEach(e => {
      const key = e.date.toISOString().split('T')[0];
      if (!grouped[key]) grouped[key] = { date: key, entries: [], totalMinutes: 0, completedTasks: new Set(), pendingTasks: new Set() };
      grouped[key].entries.push(e);
      grouped[key].totalMinutes += e.durationMinutes;
      if (e.taskId) {
        if (e.taskId.status === 'completed') grouped[key].completedTasks.add(e.taskId._id.toString());
        else grouped[key].pendingTasks.add(e.taskId._id.toString());
      }
    });

    const result = Object.values(grouped).map(g => ({
      ...g,
      completedTasks: g.completedTasks.size,
      pendingTasks: g.pendingTasks.size
    })).sort((a, b) => a.date.localeCompare(b.date));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Project report
// @route GET /api/reports/project
const getProjectReport = async (req, res) => {
  try {
    const userId = req.user._id;
    const { projectId, filter, year, month } = req.query;

    const { start, end } = getDateRange(filter || 'all', year, month);
    const query = { userId };
    if (projectId) query.projectId = projectId;

    const projects = projectId
      ? await Project.find({ _id: projectId, createdBy: userId })
      : await Project.find({ createdBy: userId });

    const result = await Promise.all(
      projects.map(async (p) => {
        const tasks = await Task.find({ projectId: p._id, userId });
        const entries = await TimeEntry.find({ projectId: p._id, userId, date: { $gte: start, $lt: end } });

        return {
          project: { _id: p._id, name: p.name, color: p.color, status: p.status },
          totalTasks: tasks.length,
          completedTasks: tasks.filter(t => t.status === 'completed').length,
          pendingTasks: tasks.filter(t => t.status !== 'completed').length,
          totalMinutes: entries.reduce((s, e) => s + e.durationMinutes, 0)
        };
      })
    );

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Export report as Excel
// @route GET /api/reports/export
const exportReport = async (req, res) => {
  try {
    const userId = req.user._id;
    const { type, format, filter, year, month, startDate, endDate } = req.query;

    const { start, end } = startDate && endDate
      ? { start: new Date(startDate), end: new Date(endDate) }
      : getDateRange(filter || 'month', year, month);

    const entries = await TimeEntry.find({ userId, date: { $gte: start, $lt: end } })
      .populate('taskId', 'title status priority')
      .populate('projectId', 'name')
      .sort({ date: 1 });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Time Report');

    sheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Project', key: 'project', width: 25 },
      { header: 'Task', key: 'task', width: 35 },
      { header: 'Start Time', key: 'startTime', width: 12 },
      { header: 'End Time', key: 'endTime', width: 12 },
      { header: 'Duration (hrs)', key: 'duration', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Type', key: 'type', width: 10 },
      { header: 'Remarks', key: 'remarks', width: 30 }
    ];

    // Style header row
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6366F1' } };

    entries.forEach(e => {
      sheet.addRow({
        date: e.date.toLocaleDateString('en-IN'),
        project: e.projectId?.name || '-',
        task: e.taskId?.title || '-',
        startTime: e.startTime || '-',
        endTime: e.endTime || '-',
        duration: (e.durationMinutes / 60).toFixed(2),
        status: e.taskId?.status || '-',
        type: e.entryType,
        remarks: e.remarks || ''
      });
    });

    // Add total row
    const totalHrs = entries.reduce((s, e) => s + e.durationMinutes, 0) / 60;
    const totalRow = sheet.addRow({ date: 'TOTAL', duration: totalHrs.toFixed(2) });
    totalRow.font = { bold: true };
    totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E7FF' } };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=time_report_${Date.now()}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getDailyReport, getMonthlyReport, getProjectReport, exportReport };
