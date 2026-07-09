const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  theme: { type: String, enum: ['dark', 'light'], default: 'dark' },
  workingHours: {
    startTime: { type: String, default: '09:00' },
    endTime: { type: String, default: '18:00' },
    dailyTarget: { type: Number, default: 9 },      // hours
    weeklyTarget: { type: Number, default: 42 },    // hours
    monthlyTarget: { type: Number, default: 160 }   // hours
  },
  notifications: {
    dueTodayAlert: { type: Boolean, default: true },
    dailyReminder: { type: Boolean, default: false }
  },
  vociferCredentials: {
    email: { type: String, default: '' },
    password: { type: String, default: '' }
  }
});

module.exports = mongoose.model('Settings', settingsSchema);
