const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
  tokenExpiry: {
    type: String,
    default: '7d'
  },
  jwtSecret: {
    type: String,
    default: 'your_super_secret_jwt_key_change_this_in_production' // Fallback
  },
  subscriptionTrialDays: {
    type: Number,
    default: 14
  },
  subscriptionAmount: {
    type: Number,
    default: 50
  },
  activationToken: {
    type: String,
    default: 'RUBIN-ACTIVATE'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
