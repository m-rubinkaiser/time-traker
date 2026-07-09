const express = require('express');
const router = express.Router();
const { getDashboardStats, getDailyChart, getMonthlyChart, getProjectChart, getRecentActivity } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/stats', getDashboardStats);
router.get('/daily-chart', getDailyChart);
router.get('/monthly-chart', getMonthlyChart);
router.get('/project-chart', getProjectChart);
router.get('/recent', getRecentActivity);

module.exports = router;
