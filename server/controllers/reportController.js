const TimeEntry = require('../models/TimeEntry');
const Task = require('../models/Task');
const Project = require('../models/Project');
const ExcelJS = require('exceljs');

const parseDateRange = (query) => {
  const { filter, startDate, endDate, year, month } = query;
  
  if (startDate && endDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    return { start, end, dateQuery: { $gte: start, $lte: end } };
  }

  const now = new Date();
  let start, end;

  switch (filter) {
    case 'today':
    case 'day':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      break;
    case 'yesterday': {
      const y = new Date(now);
      y.setDate(now.getDate() - 1);
      start = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 0, 0, 0, 0);
      end = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59, 999);
      break;
    }
    case 'week': {
      const dow = now.getDay() || 7;
      start = new Date(now); start.setDate(now.getDate() - dow + 1); start.setHours(0,0,0,0);
      end = new Date(start); end.setDate(start.getDate() + 6); end.setHours(23,59,59,999);
      break;
    }
    case 'last-month':
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;
    case 'this-month':
    case 'month':
      if (year && month) {
        start = new Date(parseInt(year), parseInt(month) - 1, 1, 0, 0, 0, 0);
        end = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
      } else {
        start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      }
      break;
    case 'this-year':
    case 'year': {
      const yVal = year ? parseInt(year) : now.getFullYear();
      start = new Date(yVal, 0, 1, 0, 0, 0, 0);
      end = new Date(yVal, 11, 31, 23, 59, 59, 999);
      break;
    }
    default:
      start = new Date(2000, 0, 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear() + 5, 11, 31, 23, 59, 59, 999);
      break;
  }

  return { start, end, dateQuery: { $gte: start, $lte: end } };
};

// @desc Daily report
// @route GET /api/reports/daily
const getDailyReport = async (req, res) => {
  try {
    const userId = req.user._id;
    const { projectId, taskId, status } = req.query;
    const { dateQuery } = parseDateRange(req.query);

    const query = { userId, date: dateQuery };
    if (projectId === 'no-project' || projectId === 'null') {
      query.$or = [{ projectId: null }, { projectId: { $exists: false } }];
    } else if (projectId) {
      query.projectId = projectId;
    }
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
    const { projectId } = req.query;
    const { dateQuery } = parseDateRange(req.query);

    const query = { userId, date: dateQuery };
    if (projectId === 'no-project' || projectId === 'null') {
      query.$or = [{ projectId: null }, { projectId: { $exists: false } }];
    } else if (projectId) {
      query.projectId = projectId;
    }

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
    const { projectId } = req.query;
    const { start, end } = parseDateRange(req.query);

    const query = { userId };
    if (projectId) query.projectId = projectId;

    const projects = projectId
      ? await Project.find({ _id: projectId, createdBy: userId })
      : await Project.find({ createdBy: userId });

    const result = await Promise.all(
      projects.map(async (p) => {
        const tasks = await Task.find({ projectId: p._id, userId });
        const entries = await TimeEntry.find({ projectId: p._id, userId, date: { $gte: start, $lte: end } });

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
    const { dateQuery } = parseDateRange(req.query);

    const entries = await TimeEntry.find({ userId, date: dateQuery })
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
        project: e.projectId?.name || 'No Project',
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
