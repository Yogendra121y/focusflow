// ─── JOURNAL CONTROLLER ───────────────────────────────────────────────────────
const { Journal, Task, ProductivityLog, TimeBlock } = require('../models');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { Op, fn, col, literal } = require('sequelize');

// @desc    Get all journal entries
// @route   GET /api/journal
// @access  Private
exports.getJournals = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, mood, startDate, endDate } = req.query;
  const where = { userId: req.user.id };

  if (mood) where.mood = mood;
  if (search) {
    where[Op.or] = [
      { title: { [Op.like]: `%${search}%` } },
      { content: { [Op.like]: `%${search}%` } },
    ];
  }
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date[Op.gte] = startDate;
    if (endDate) where.date[Op.lte] = endDate;
  }

  const { count, rows: journals } = await Journal.findAndCountAll({
    where,
    order: [['date', 'DESC'], ['createdAt', 'DESC']],
    limit: parseInt(limit),
    offset: (parseInt(page) - 1) * parseInt(limit),
    attributes: { exclude: [] },
  });

  res.json({ success: true, count, totalPages: Math.ceil(count / parseInt(limit)), journals });
});

// @desc    Get journal entry by date
// @route   GET /api/journal/date/:date
// @access  Private
exports.getJournalByDate = asyncHandler(async (req, res) => {
  const journal = await Journal.findOne({
    where: { userId: req.user.id, date: req.params.date },
  });
  res.json({ success: true, journal });
});

// @desc    Create journal entry
// @route   POST /api/journal
// @access  Private
exports.createJournal = asyncHandler(async (req, res) => {
  const { title, content, mood, tags, date } = req.body;
  const entryDate = date || new Date().toISOString().split('T')[0];

  const existing = await Journal.findOne({ where: { userId: req.user.id, date: entryDate } });
  if (existing) throw new AppError('Journal entry for this date already exists. Use PUT to update.', 409);

  const journal = await Journal.create({
    userId: req.user.id,
    title, content, mood, tags,
    date: entryDate,
  });

  await ProductivityLog.upsert({
    userId: req.user.id,
    date: entryDate,
    journalWritten: true,
  }, { fields: ['journalWritten'] });

  res.status(201).json({ success: true, message: 'Journal entry created!', journal });
});

// @desc    Update journal entry
// @route   PUT /api/journal/:id
// @access  Private
exports.updateJournal = asyncHandler(async (req, res) => {
  const journal = await Journal.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!journal) throw new AppError('Journal entry not found', 404);

  const { title, content, mood, tags } = req.body;
  if (title !== undefined) journal.title = title;
  if (content !== undefined) journal.content = content;
  if (mood !== undefined) journal.mood = mood;
  if (tags !== undefined) journal.tags = tags;

  await journal.save();
  res.json({ success: true, message: 'Journal updated!', journal });
});

// @desc    Delete journal entry
// @route   DELETE /api/journal/:id
// @access  Private
exports.deleteJournal = asyncHandler(async (req, res) => {
  const journal = await Journal.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!journal) throw new AppError('Journal entry not found', 404);
  await journal.destroy();
  res.json({ success: true, message: 'Journal entry deleted' });
});

module.exports.journalController = {
  getJournals: exports.getJournals,
  getJournalByDate: exports.getJournalByDate,
  createJournal: exports.createJournal,
  updateJournal: exports.updateJournal,
  deleteJournal: exports.deleteJournal,
};
