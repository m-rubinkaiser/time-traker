const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  client: { type: String, trim: true, default: '' },
  description: { type: String, default: '' },
  status: { type: String, enum: ['active', 'completed', 'archived'], default: 'active' },
  color: { type: String, default: '#6366f1' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
