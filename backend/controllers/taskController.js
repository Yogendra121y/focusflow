const { Task, Goal, User, ProductivityLog } = require('../models');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

// @desc    Get all tasks for user
// @route   GET /api/tasks
// @access  Private
exports.getTasks = asyncHandler(async (req, res) => {
  const {
    status, priority, category, search,
    sortBy = 'createdAt', sortOrder = 'DESC',
    page = 1, limit = 50,
    dueDate, goalId,
  } = req.query;

  const where = { userId: req.user.id };

  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (category) where.category = category;
  if (goalId) where.goalId = goalId;
  if (dueDate) {
    const start = new Date(dueDate);
    const end = new Date(dueDate);
    end.setDate(end.getDate() + 1);
    where.dueDate = { [Op.gte]: start, [Op.lt]: end };
  }
  if (search) {
    where[Op.or] = [
      { title: { [Op.like]: `%${search}%` } },
      { description: { [Op.like]: `%${search}%` } },
    ];
  }

  const validSortFields = ['createdAt', 'dueDate', 'priority', 'title', 'status', 'order'];
  const orderField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
  const orderDir = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const offset = (parseInt(page) - 1) * parseInt(limit);

  const { count, rows: tasks } = await Task.findAndCountAll({
    where,
    include: [{ model: Goal, as: 'goal', attributes: ['id', 'title', 'color'], required: false }],
    order: [[orderField, orderDir]],
    limit: parseInt(limit),
    offset,
  });

  res.json({
    success: true,
    count,
    page: parseInt(page),
    totalPages: Math.ceil(count / parseInt(limit)),
    tasks,
  });
});

// @desc    Get today's tasks
// @route   GET /api/tasks/today
// @access  Private
exports.getTodayTasks = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const tasks = await Task.findAll({
    where: {
      userId: req.user.id,
      [Op.or]: [
        { dueDate: { [Op.gte]: today, [Op.lt]: tomorrow } },
        { status: { [Op.in]: ['todo', 'in_progress'] }, dueDate: { [Op.lt]: today } },
      ],
    },
    include: [{ model: Goal, as: 'goal', attributes: ['id', 'title', 'color'], required: false }],
    order: [['priority', 'DESC'], ['order', 'ASC']],
  });

  const completed = tasks.filter(t => t.status === 'completed').length;
  const total = tasks.length;

  res.json({ success: true, tasks, stats: { total, completed, pending: total - completed } });
});

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
exports.getTask = asyncHandler(async (req, res) => {
  const task = await Task.findOne({
    where: { id: req.params.id, userId: req.user.id },
    include: [{ model: Goal, as: 'goal', attributes: ['id', 'title', 'color'] }],
  });
  if (!task) throw new AppError('Task not found', 404);
  res.json({ success: true, task });
});

// @desc    Create task
// @route   POST /api/tasks
// @access  Private
exports.createTask = asyncHandler(async (req, res) => {
  const { title, description, priority, category, dueDate, estimatedMinutes, goalId, tags } = req.body;

  // Validate goal belongs to user
  if (goalId) {
    const goal = await Goal.findOne({ where: { id: goalId, userId: req.user.id } });
    if (!goal) throw new AppError('Goal not found', 404);
  }

  const task = await Task.create({
    userId: req.user.id,
    title, description, priority, category,
    dueDate: dueDate ? new Date(dueDate) : null,
    estimatedMinutes, goalId, tags,
  });

  await updateDailyProductivityLog(req.user.id);

  res.status(201).json({ success: true, message: 'Task created!', task });
});

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!task) throw new AppError('Task not found', 404);

  const wasCompleted = task.status === 'completed';
  const allowedFields = ['title', 'description', 'priority', 'status', 'category', 'dueDate', 'estimatedMinutes', 'actualMinutes', 'goalId', 'tags', 'order'];

  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      task[field] = req.body[field];
    }
  });

  await task.save();

  // Award XP on completion
  if (!wasCompleted && task.status === 'completed') {
    const xpMap = { low: 10, medium: 20, high: 30, urgent: 50 };
    const xp = xpMap[task.priority] || 10;
    await User.increment('totalXp', { by: xp, where: { id: req.user.id } });
    task.xpReward = xp;
    await updateDailyProductivityLog(req.user.id);
  }

  res.json({ success: true, message: 'Task updated!', task });
});

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
exports.deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!task) throw new AppError('Task not found', 404);
  await task.destroy();
  await updateDailyProductivityLog(req.user.id);
  res.json({ success: true, message: 'Task deleted' });
});

// @desc    Bulk update tasks (reorder, bulk complete)
// @route   PATCH /api/tasks/bulk
// @access  Private
exports.bulkUpdateTasks = asyncHandler(async (req, res) => {
  const { taskIds, updates } = req.body;
  if (!taskIds?.length) throw new AppError('No task IDs provided', 400);

  await Task.update(updates, {
    where: { id: { [Op.in]: taskIds }, userId: req.user.id },
  });

  res.json({ success: true, message: `${taskIds.length} tasks updated` });
});

// Helper: update daily productivity log
const updateDailyProductivityLog = async (userId) => {
  const today = new Date().toISOString().split('T')[0];
  const todayStart = new Date(today);
  const todayEnd = new Date(today);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const [completed, total] = await Promise.all([
    Task.count({ where: { userId, status: 'completed', completedAt: { [Op.gte]: todayStart, [Op.lt]: todayEnd } } }),
    Task.count({ where: { userId, createdAt: { [Op.gte]: todayStart, [Op.lt]: todayEnd } } }),
  ]);

  const score = total > 0 ? Math.round((completed / total) * 100) : 0;

  await ProductivityLog.upsert({
    userId, date: today,
    completedTasks: completed,
    totalTasks: total,
    score,
  });
};
