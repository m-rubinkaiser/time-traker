const express = require('express');
const router = express.Router();
const { getTasks, getTask, createTask, updateTask, deleteTask, getVociferEmployees } = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.route('/').get(getTasks).post(createTask);
router.get('/vocifer/employees', getVociferEmployees);
router.route('/:id').get(getTask).put(updateTask).delete(deleteTask);

module.exports = router;
