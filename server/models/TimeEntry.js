const mongoose = require('mongoose');

const timeEntrySchema = new mongoose.Schema({
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: false, default: null },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  startTime: { type: String, default: null },   // "HH:mm" format
  endTime: { type: String, default: null },     // "HH:mm" format
  durationMinutes: { type: Number, required: true, min: 0 },
  entryType: { type: String, enum: ['auto', 'manual'], default: 'manual' },
  remarks: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TimeEntry', timeEntrySchema);
