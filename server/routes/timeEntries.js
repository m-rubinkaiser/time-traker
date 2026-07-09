const express = require('express');
const router = express.Router();
const { getTimeEntries, createTimeEntry, updateTimeEntry, deleteTimeEntry } = require('../controllers/timeEntryController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.route('/').get(getTimeEntries).post(createTimeEntry);
router.route('/:id').put(updateTimeEntry).delete(deleteTimeEntry);

module.exports = router;
