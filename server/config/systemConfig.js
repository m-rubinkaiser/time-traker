const SystemSettings = require('../models/SystemSettings');

let cachedSettings = null;

const getSystemSettings = async () => {
  if (cachedSettings) return cachedSettings;
  try {
    let settings = await SystemSettings.findOne({});
    if (!settings) {
      settings = await SystemSettings.create({
        jwtSecret: process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production',
        tokenExpiry: '7d',
        subscriptionTrialDays: 14,
        subscriptionAmount: 50,
        activationToken: 'RUBIN-ACTIVATE',
        notificationTimes: ['06:00']
      });
    }
    cachedSettings = settings;
    return settings;
  } catch (err) {
    console.error('Failed to get system settings:', err.message);
    // Return a dummy object if DB connection fails temporarily
    return {
      jwtSecret: process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production',
      tokenExpiry: '7d',
      subscriptionTrialDays: 14,
      subscriptionAmount: 50,
      activationToken: 'RUBIN-ACTIVATE',
      notificationTimes: ['06:00']
    };
  }
};

const refreshSystemSettings = async () => {
  cachedSettings = null;
  return await getSystemSettings();
};

module.exports = {
  getSystemSettings,
  refreshSystemSettings
};
