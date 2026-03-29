const express = require('express');
const router = express.Router();
const timePlannerController = require('../controllers/timePlannerController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/:date', timePlannerController.getTimeBlocks);
router.post('/', timePlannerController.createTimeBlock);
router.put('/:id', timePlannerController.updateTimeBlock);
router.delete('/:id', timePlannerController.deleteTimeBlock);

module.exports = router;
