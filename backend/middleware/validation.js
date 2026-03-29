const { body, param, query, validationResult } = require('express-validator');

// Reusable validation error handler
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({ field: err.path, message: err.msg })),
    });
  }
  next();
};

// Auth validations
const authValidation = {
  register: [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain uppercase, lowercase, and a number'),
    validate,
  ],
  login: [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    validate,
  ],
};

// Task validations
const taskValidation = {
  create: [
    body('title').trim().isLength({ min: 1, max: 255 }).withMessage('Title is required (max 255 chars)'),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
    body('status').optional().isIn(['todo', 'in_progress', 'completed', 'cancelled']).withMessage('Invalid status'),
    body('category').optional().isIn(['work', 'study', 'personal', 'health', 'finance', 'other']).withMessage('Invalid category'),
    body('dueDate').optional().isISO8601().withMessage('Invalid date format'),
    body('estimatedMinutes').optional().isInt({ min: 1, max: 1440 }).withMessage('Estimated minutes must be 1-1440'),
    validate,
  ],
  update: [
    param('id').isUUID().withMessage('Invalid task ID'),
    body('title').optional().trim().isLength({ min: 1, max: 255 }).withMessage('Title must be 1-255 chars'),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
    body('status').optional().isIn(['todo', 'in_progress', 'completed', 'cancelled']).withMessage('Invalid status'),
    body('category').optional().isIn(['work', 'study', 'personal', 'health', 'finance', 'other']).withMessage('Invalid category'),
    validate,
  ],
};

// Goal validations
const goalValidation = {
  create: [
    body('title').trim().isLength({ min: 2, max: 255 }).withMessage('Title must be 2-255 characters'),
    body('category').optional().isIn(['career', 'health', 'finance', 'education', 'personal', 'relationships', 'other']),
    body('deadline').optional().isISO8601().withMessage('Invalid date format'),
    body('progress').optional().isFloat({ min: 0, max: 100 }).withMessage('Progress must be 0-100'),
    validate,
  ],
};

// Journal validations
const journalValidation = {
  create: [
    body('content').trim().isLength({ min: 1, max: 50000 }).withMessage('Content is required (max 50000 chars)'),
    body('mood').optional().isIn(['great', 'good', 'neutral', 'bad', 'terrible']).withMessage('Invalid mood'),
    body('date').optional().isISO8601().withMessage('Invalid date format'),
    validate,
  ],
};

module.exports = { validate, authValidation, taskValidation, goalValidation, journalValidation };
