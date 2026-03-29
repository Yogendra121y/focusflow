require('dotenv').config();
const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const compression = require('compression');
const morgan      = require('morgan');
const rateLimit   = require('express-rate-limit');
const { sequelize }      = require('./models');
const errorHandler       = require('./middleware/errorHandler');
const { verifyEmailConfig } = require('./utils/email');

const authRoutes        = require('./routes/auth');
const taskRoutes        = require('./routes/tasks');
const goalRoutes        = require('./routes/goals');
const journalRoutes     = require('./routes/journal');
const analyticsRoutes   = require('./routes/analytics');
const timePlannerRoutes = require('./routes/timePlanner');

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many authentication attempts.' },
});

app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);

app.use(compression());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'FocusFlow API is running', timestamp: new Date() });
});

app.use('/api/auth',        authRoutes);
app.use('/api/tasks',       taskRoutes);
app.use('/api/goals',       goalRoutes);
app.use('/api/journal',     journalRoutes);
app.use('/api/analytics',   analyticsRoutes);
app.use('/api/time-planner', timePlannerRoutes);

app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

app.use(errorHandler);

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('✅ Database models synchronized');
    }

    app.listen(PORT, () => {
      console.log(`🚀 FocusFlow API running on port ${PORT}`);
      console.log(`📡 Environment: ${process.env.NODE_ENV}`);
      verifyEmailConfig();
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
module.exports = app;