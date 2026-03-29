const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const { taskValidation } = require('../middleware/validation');

router.use(protect);

router.get('/', taskController.getTasks);
router.get('/today', taskController.getTodayTasks);
router.patch('/bulk', taskController.bulkUpdateTasks);
router.get('/:id', taskController.getTask);
router.post('/', taskValidation.create, taskController.createTask);
router.put('/:id', taskValidation.update, taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

module.exports = router;
