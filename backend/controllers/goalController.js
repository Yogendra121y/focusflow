const { Goal, Milestone, Task } = require('../models');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

// @desc    Get all goals
// @route   GET /api/goals
// @access  Private
exports.getGoals = asyncHandler(async (req, res) => {
  const { status, category } = req.query;
  const where = { userId: req.user.id };
  if (status) where.status = status;
  if (category) where.category = category;

  const goals = await Goal.findAll({
    where,
    include: [
      { model: Milestone, as: 'milestones', order: [['order', 'ASC']] },
      { model: Task, as: 'linkedTasks', attributes: ['id', 'status'], required: false },
    ],
    order: [['createdAt', 'DESC']],
  });

  // Auto-calculate progress from milestones
  const goalsWithProgress = goals.map(goal => {
    const g = goal.toJSON();
    if (g.milestones?.length > 0) {
      const completed = g.milestones.filter(m => m.status === 'completed').length;
      g.progress = Math.round((completed / g.milestones.length) * 100);
    }
    return g;
  });

  res.json({ success: true, goals: goalsWithProgress });
});

// @desc    Get single goal
// @route   GET /api/goals/:id
// @access  Private
exports.getGoal = asyncHandler(async (req, res) => {
  const goal = await Goal.findOne({
    where: { id: req.params.id, userId: req.user.id },
    include: [
      { model: Milestone, as: 'milestones', order: [['order', 'ASC']] },
      { model: Task, as: 'linkedTasks', order: [['dueDate', 'ASC']] },
    ],
  });
  if (!goal) throw new AppError('Goal not found', 404);
  res.json({ success: true, goal });
});

// @desc    Create goal
// @route   POST /api/goals
// @access  Private
exports.createGoal = asyncHandler(async (req, res) => {
  const { title, description, category, deadline, targetValue, unit, color, icon, milestones } = req.body;

  const goal = await Goal.create({
    userId: req.user.id,
    title, description, category,
    deadline: deadline ? new Date(deadline) : null,
    targetValue, unit, color, icon,
  });

  // Create milestones if provided
  if (milestones?.length > 0) {
    const milestoneData = milestones.map((m, idx) => ({
      goalId: goal.id,
      title: m.title,
      description: m.description,
      dueDate: m.dueDate,
      order: idx,
    }));
    await Milestone.bulkCreate(milestoneData);
  }

  const goalWithMilestones = await Goal.findByPk(goal.id, {
    include: [{ model: Milestone, as: 'milestones' }],
  });

  res.status(201).json({ success: true, message: 'Goal created!', goal: goalWithMilestones });
});

// @desc    Update goal
// @route   PUT /api/goals/:id
// @access  Private
exports.updateGoal = asyncHandler(async (req, res) => {
  const goal = await Goal.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!goal) throw new AppError('Goal not found', 404);

  const allowedFields = ['title', 'description', 'category', 'status', 'deadline', 'progress', 'targetValue', 'currentValue', 'unit', 'color', 'icon'];
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) goal[field] = req.body[field];
  });

  if (goal.progress === 100 && goal.status === 'active') {
    goal.status = 'completed';
    goal.completedAt = new Date();
  }

  await goal.save();
  res.json({ success: true, message: 'Goal updated!', goal });
});

// @desc    Delete goal
// @route   DELETE /api/goals/:id
// @access  Private
exports.deleteGoal = asyncHandler(async (req, res) => {
  const goal = await Goal.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!goal) throw new AppError('Goal not found', 404);
  await goal.destroy();
  res.json({ success: true, message: 'Goal deleted' });
});

// ─── Milestone Controllers ─────────────────────────────────────────────────────

// @desc    Add milestone to goal
// @route   POST /api/goals/:id/milestones
// @access  Private
exports.addMilestone = asyncHandler(async (req, res) => {
  const goal = await Goal.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!goal) throw new AppError('Goal not found', 404);

  const { title, description, dueDate, order } = req.body;
  const milestone = await Milestone.create({ goalId: goal.id, title, description, dueDate, order: order || 0 });

  res.status(201).json({ success: true, message: 'Milestone added!', milestone });
});

// @desc    Update milestone
// @route   PUT /api/goals/:goalId/milestones/:milestoneId
// @access  Private
exports.updateMilestone = asyncHandler(async (req, res) => {
  const goal = await Goal.findOne({ where: { id: req.params.goalId, userId: req.user.id } });
  if (!goal) throw new AppError('Goal not found', 404);

  const milestone = await Milestone.findOne({ where: { id: req.params.milestoneId, goalId: goal.id } });
  if (!milestone) throw new AppError('Milestone not found', 404);

  const { title, description, status, dueDate, order } = req.body;
  if (title !== undefined) milestone.title = title;
  if (description !== undefined) milestone.description = description;
  if (status !== undefined) {
    milestone.status = status;
    if (status === 'completed') milestone.completedAt = new Date();
  }
  if (dueDate !== undefined) milestone.dueDate = dueDate;
  if (order !== undefined) milestone.order = order;

  await milestone.save();

  // Recalculate goal progress
  const allMilestones = await Milestone.findAll({ where: { goalId: goal.id } });
  const completedCount = allMilestones.filter(m => m.status === 'completed').length;
  goal.progress = Math.round((completedCount / allMilestones.length) * 100);
  if (goal.progress === 100) { goal.status = 'completed'; goal.completedAt = new Date(); }
  await goal.save();

  res.json({ success: true, message: 'Milestone updated!', milestone, goalProgress: goal.progress });
});

// @desc    Delete milestone
// @route   DELETE /api/goals/:goalId/milestones/:milestoneId
// @access  Private
exports.deleteMilestone = asyncHandler(async (req, res) => {
  const goal = await Goal.findOne({ where: { id: req.params.goalId, userId: req.user.id } });
  if (!goal) throw new AppError('Goal not found', 404);

  const milestone = await Milestone.findOne({ where: { id: req.params.milestoneId, goalId: goal.id } });
  if (!milestone) throw new AppError('Milestone not found', 404);

  await milestone.destroy();
  res.json({ success: true, message: 'Milestone deleted' });
});
