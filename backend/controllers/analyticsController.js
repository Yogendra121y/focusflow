const { Task, ProductivityLog, Journal, Goal, User } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');
const { Op, fn, col, literal, sequelize } = require('sequelize');

// @desc    Get dashboard stats
// @route   GET /api/analytics/dashboard
// @access  Private
exports.getDashboardStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const today = new Date().toISOString().split('T')[0];
  const todayStart = new Date(today);
  const todayEnd = new Date(today);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);

  const [
    todayCompleted, todayTotal, weekCompleted, weekTotal,
    activeGoals, totalJournals, user, recentLog
  ] = await Promise.all([
    Task.count({ where: { userId, status: 'completed', completedAt: { [Op.gte]: todayStart, [Op.lt]: todayEnd } } }),
    Task.count({ where: { userId, dueDate: { [Op.gte]: todayStart, [Op.lt]: todayEnd } } }),
    Task.count({ where: { userId, status: 'completed', completedAt: { [Op.gte]: weekStart } } }),
    Task.count({ where: { userId, createdAt: { [Op.gte]: weekStart } } }),
    Goal.count({ where: { userId, status: 'active' } }),
    Journal.count({ where: { userId } }),
    User.findByPk(userId, { attributes: ['streak', 'totalXp', 'name', 'lastActiveDate'] }),
    ProductivityLog.findOne({ where: { userId, date: today } }),
  ]);

  const todayScore = todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0;
  const weekScore = weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 100) : 0;

  res.json({
    success: true,
    stats: {
      today: { completed: todayCompleted, total: todayTotal, score: todayScore },
      week: { completed: weekCompleted, total: weekTotal, score: weekScore },
      streak: user?.streak || 0,
      totalXp: user?.totalXp || 0,
      activeGoals,
      totalJournals,
      productivityScore: recentLog?.score || todayScore,
    },
  });
});

// @desc    Get weekly report
// @route   GET /api/analytics/weekly
// @access  Private
exports.getWeeklyReport = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const days = 7;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days + 1);
  startDate.setHours(0, 0, 0, 0);

  const logs = await ProductivityLog.findAll({
    where: {
      userId,
      date: { [Op.gte]: startDate.toISOString().split('T')[0] },
    },
    order: [['date', 'ASC']],
  });

  // Fill missing days with zeros
  const result = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const log = logs.find(l => l.date === dateStr);
    result.push({
      date: dateStr,
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      completedTasks: log?.completedTasks || 0,
      totalTasks: log?.totalTasks || 0,
      score: log?.score || 0,
      journalWritten: log?.journalWritten || false,
      xpEarned: log?.xpEarned || 0,
    });
  }

  res.json({ success: true, report: result });
});

// @desc    Get monthly report
// @route   GET /api/analytics/monthly
// @access  Private
exports.getMonthlyReport = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { year, month } = req.query;
  const now = new Date();
  const targetYear = parseInt(year) || now.getFullYear();
  const targetMonth = parseInt(month) || now.getMonth() + 1;

  const startDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
  const endDate = new Date(targetYear, targetMonth, 0).toISOString().split('T')[0];

  const logs = await ProductivityLog.findAll({
    where: {
      userId,
      date: { [Op.gte]: startDate, [Op.lte]: endDate },
    },
    order: [['date', 'ASC']],
  });

  const totalCompleted = logs.reduce((sum, l) => sum + l.completedTasks, 0);
  const totalTasks = logs.reduce((sum, l) => sum + l.totalTasks, 0);
  const avgScore = logs.length > 0 ? Math.round(logs.reduce((sum, l) => sum + l.score, 0) / logs.length) : 0;
  const journalDays = logs.filter(l => l.journalWritten).length;
  const activeDays = logs.filter(l => l.totalTasks > 0).length;

  // Category breakdown
  const categoryBreakdown = await Task.findAll({
    attributes: ['category', [fn('COUNT', col('id')), 'count']],
    where: {
      userId,
      status: 'completed',
      completedAt: { [Op.gte]: startDate, [Op.lte]: endDate + 'T23:59:59Z' },
    },
    group: ['category'],
    raw: true,
  });

  res.json({
    success: true,
    report: {
      year: targetYear,
      month: targetMonth,
      totalCompleted,
      totalTasks,
      avgScore,
      journalDays,
      activeDays,
      dailyLogs: logs,
      categoryBreakdown,
    },
  });
});

// @desc    Get task category breakdown
// @route   GET /api/analytics/categories
// @access  Private
exports.getCategoryBreakdown = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { period = '30' } = req.query;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(period));

  const data = await Task.findAll({
    attributes: ['category', 'status', [fn('COUNT', col('id')), 'count']],
    where: { userId, createdAt: { [Op.gte]: startDate } },
    group: ['category', 'status'],
    raw: true,
  });

  res.json({ success: true, data });
});

// @desc    Get productivity trends
// @route   GET /api/analytics/trends
// @access  Private
exports.getProductivityTrends = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { days = 30 } = req.query;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));

  const logs = await ProductivityLog.findAll({
    where: {
      userId,
      date: { [Op.gte]: startDate.toISOString().split('T')[0] },
    },
    order: [['date', 'ASC']],
    attributes: ['date', 'score', 'completedTasks', 'totalTasks', 'xpEarned'],
  });

  res.json({ success: true, trends: logs });
});
