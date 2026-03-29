const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User, ProductivityLog } = require('../models');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');
const { sendPasswordResetEmail } = require('../utils/email');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const token = generateToken(user.id);
  res.status(statusCode).json({
    success: true,
    message,
    token,
    user: user.toSafeJSON ? user.toSafeJSON() : user,
  });
};

// @desc    Register user
// @route   POST /api/auth/register
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
  if (existingUser) throw new AppError('An account with this email already exists.', 409);

  const user = await User.create({ name, email: email.toLowerCase(), password });

  await ProductivityLog.create({
    userId: user.id,
    date: new Date().toISOString().split('T')[0],
    completedTasks: 0,
    totalTasks: 0,
    score: 0,
  });

  sendTokenResponse(user, 201, res, 'Account created successfully!');
});

// @desc    Login user
// @route   POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ where: { email: email.toLowerCase() } });
  if (!user || !user.isActive) throw new AppError('Invalid email or password.', 401);

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new AppError('Invalid email or password.', 401);

  const today     = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (user.lastActiveDate === yesterday) user.streak += 1;
  else if (user.lastActiveDate !== today) user.streak = 1;
  user.lastActiveDate = today;
  await user.save();

  sendTokenResponse(user, 200, res, 'Logged in successfully!');
});

// @desc    Get current user
// @route   GET /api/auth/me
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id, {
    attributes: { exclude: ['password'] },
  });
  res.json({ success: true, user });
});

// @desc    Update profile
// @route   PUT /api/auth/profile
exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, timezone, preferences, avatar } = req.body;
  const user = await User.findByPk(req.user.id);

  if (name)        user.name     = name;
  if (timezone)    user.timezone = timezone;
  if (avatar)      user.avatar   = avatar;
  if (preferences) user.preferences = { ...user.preferences, ...preferences };

  await user.save();
  res.json({ success: true, message: 'Profile updated', user: user.toSafeJSON() });
});

// @desc    Change password
// @route   PUT /api/auth/password
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findByPk(req.user.id);

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw new AppError('Current password is incorrect.', 401);

  user.password = newPassword;
  await user.save();

  res.json({ success: true, message: 'Password updated successfully' });
});

// @desc    Delete account
// @route   DELETE /api/auth/account
exports.deleteAccount = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id);
  user.isActive = false;
  await user.save();
  res.json({ success: true, message: 'Account deactivated successfully' });
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new AppError('Email is required.', 400);

  const user = await User.findOne({ where: { email: email.toLowerCase(), isActive: true } });

  if (!user) {
    return res.json({
      success: true,
      message: 'If an account with that email exists, a reset link has been sent.',
    });
  }

  const resetToken  = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  user.resetPasswordToken   = hashedToken;
  user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save();

  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;

  try {
    await sendPasswordResetEmail({ to: user.email, name: user.name, resetUrl });
  } catch (emailError) {
    user.resetPasswordToken   = null;
    user.resetPasswordExpires = null;
    await user.save();
    console.error('❌ Failed to send reset email:', emailError.message);
    throw new AppError('Failed to send reset email. Please try again later.', 500);
  }

  res.json({
    success: true,
    message: 'If an account with that email exists, a reset link has been sent.',
  });
});

// @desc    Reset password
// @route   POST /api/auth/reset-password
exports.resetPassword = asyncHandler(async (req, res) => {
  const { token, email, password } = req.body;
  if (!token || !email || !password) throw new AppError('Token, email, and new password are required.', 400);
  if (password.length < 8) throw new AppError('Password must be at least 8 characters.', 400);

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    where: {
      email: email.toLowerCase(),
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { [Op.gt]: new Date() },
      isActive: true,
    },
  });

  if (!user) throw new AppError('Reset link is invalid or has expired. Please request a new one.', 400);

  user.password             = password;
  user.resetPasswordToken   = null;
  user.resetPasswordExpires = null;
  await user.save();

  sendTokenResponse(user, 200, res, 'Password reset successfully! You are now logged in.');
});