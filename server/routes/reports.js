const express = require('express');
const router = express.Router();
const { getDailyReport, getMonthlyReport, getProjectReport, exportReport } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/daily', getDailyReport);
router.get('/monthly', getMonthlyReport);
router.get('/project', getProjectReport);
router.get('/export', exportReport);

module.exports = router;
