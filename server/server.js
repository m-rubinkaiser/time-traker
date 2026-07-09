require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { initScheduler } = require('./services/scheduler');

const app = express();

// Connect to MongoDB
connectDB();

// Initialize Daily Cron Scheduler locally (Vercel will use cron endpoint instead)
if (process.env.NODE_ENV !== 'production') {
  initScheduler();
}

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
// Routes
const { protect } = require('./middleware/auth');
const checkSubscription = require('./middleware/subscriptionMiddleware');

// Health check (Public)
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Debug route to manually trigger pending task daily email notification (Public)
app.get('/api/health/test-email', async (req, res) => {
  const { runDailyNotificationJob } = require('./services/scheduler');
  try {
    await runDailyNotificationJob();
    res.json({ message: 'Daily notification job triggered. Check server console for logs.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Exempt/Public APIs
app.use('/api/auth', require('./routes/auth'));
app.use('/api/subscription', require('./routes/subscription'));

// Authenticate all following routes
app.use(protect);

// Apply subscription checking gate
app.use(checkSubscription);

// Protected routes
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/time-entries', require('./routes/timeEntries'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/admin', require('./routes/admin'));

// 404 handler
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Server Error' });
});

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
