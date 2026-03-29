const express = require('express');
const router = express.Router();
const goalController = require('../controllers/goalController');
const { protect } = require('../middleware/auth');
const { goalValidation } = require('../middleware/validation');

router.use(protect);

router.get('/', goalController.getGoals);
router.post('/', goalValidation.create, goalController.createGoal);
router.get('/:id', goalController.getGoal);
router.put('/:id', goalController.updateGoal);
router.delete('/:id', goalController.deleteGoal);

// Milestone routes (nested)
router.post('/:id/milestones', goalController.addMilestone);
router.put('/:goalId/milestones/:milestoneId', goalController.updateMilestone);
router.delete('/:goalId/milestones/:milestoneId', goalController.deleteMilestone);

module.exports = router;
