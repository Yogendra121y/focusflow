const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/dashboard', analyticsController.getDashboardStats);
router.get('/weekly', analyticsController.getWeeklyReport);
router.get('/monthly', analyticsController.getMonthlyReport);
router.get('/categories', analyticsController.getCategoryBreakdown);
router.get('/trends', analyticsController.getProductivityTrends);

module.exports = router;
