const { TimeBlock, Task } = require('../models');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

// @desc    Get time blocks for a date
// @route   GET /api/time-planner/:date
// @access  Private
exports.getTimeBlocks = asyncHandler(async (req, res) => {
  const { date } = req.params;
  const blocks = await TimeBlock.findAll({
    where: { userId: req.user.id, date },
    include: [{ model: Task, as: 'task', attributes: ['id', 'title', 'status', 'priority'], required: false }],
    order: [['startTime', 'ASC']],
  });
  res.json({ success: true, blocks });
});

// @desc    Create time block
// @route   POST /api/time-planner
// @access  Private
exports.createTimeBlock = asyncHandler(async (req, res) => {
  const { title, description, date, startTime, endTime, color, category, taskId } = req.body;

  if (!title || !date || !startTime || !endTime) {
    throw new AppError('Title, date, startTime, and endTime are required', 400);
  }

  if (startTime >= endTime) throw new AppError('Start time must be before end time', 400);

  // Check for overlap
  const overlap = await TimeBlock.findOne({
    where: {
      userId: req.user.id,
      date,
      [Op.or]: [
        { startTime: { [Op.between]: [startTime, endTime] } },
        { endTime: { [Op.between]: [startTime, endTime] } },
        {
          startTime: { [Op.lte]: startTime },
          endTime: { [Op.gte]: endTime },
        },
      ],
    },
  });

  if (overlap) throw new AppError('Time slot overlaps with an existing block', 409);

  const block = await TimeBlock.create({
    userId: req.user.id,
    title, description, date, startTime, endTime, color, category, taskId,
  });

  res.status(201).json({ success: true, message: 'Time block created!', block });
});

// @desc    Update time block
// @route   PUT /api/time-planner/:id
// @access  Private
exports.updateTimeBlock = asyncHandler(async (req, res) => {
  const block = await TimeBlock.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!block) throw new AppError('Time block not found', 404);

  const { title, description, startTime, endTime, color, category, isCompleted, taskId } = req.body;
  if (title !== undefined) block.title = title;
  if (description !== undefined) block.description = description;
  if (startTime !== undefined) block.startTime = startTime;
  if (endTime !== undefined) block.endTime = endTime;
  if (color !== undefined) block.color = color;
  if (category !== undefined) block.category = category;
  if (isCompleted !== undefined) block.isCompleted = isCompleted;
  if (taskId !== undefined) block.taskId = taskId;

  await block.save();
  res.json({ success: true, message: 'Time block updated!', block });
});

// @desc    Delete time block
// @route   DELETE /api/time-planner/:id
// @access  Private
exports.deleteTimeBlock = asyncHandler(async (req, res) => {
  const block = await TimeBlock.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!block) throw new AppError('Time block not found', 404);
  await block.destroy();
  res.json({ success: true, message: 'Time block deleted' });
});
