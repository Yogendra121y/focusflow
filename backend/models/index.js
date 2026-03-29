const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  dbConfig
);

// Import models
const User = require('./User')(sequelize, Sequelize.DataTypes);
const Task = require('./Task')(sequelize, Sequelize.DataTypes);
const Goal = require('./Goal')(sequelize, Sequelize.DataTypes);
const Milestone = require('./Milestone')(sequelize, Sequelize.DataTypes);
const Journal = require('./Journal')(sequelize, Sequelize.DataTypes);
const ProductivityLog = require('./ProductivityLog')(sequelize, Sequelize.DataTypes);
const TimeBlock = require('./TimeBlock')(sequelize, Sequelize.DataTypes);

// ─── Associations ─────────────────────────────────────────────────────────────

// User → Tasks
User.hasMany(Task, { foreignKey: 'userId', as: 'tasks', onDelete: 'CASCADE' });
Task.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User → Goals
User.hasMany(Goal, { foreignKey: 'userId', as: 'goals', onDelete: 'CASCADE' });
Goal.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Goal → Milestones
Goal.hasMany(Milestone, { foreignKey: 'goalId', as: 'milestones', onDelete: 'CASCADE' });
Milestone.belongsTo(Goal, { foreignKey: 'goalId', as: 'goal' });

// Task → Goal (optional link)
Task.belongsTo(Goal, { foreignKey: 'goalId', as: 'goal', constraints: false });
Goal.hasMany(Task, { foreignKey: 'goalId', as: 'linkedTasks', constraints: false });

// User → Journals
User.hasMany(Journal, { foreignKey: 'userId', as: 'journals', onDelete: 'CASCADE' });
Journal.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User → ProductivityLogs
User.hasMany(ProductivityLog, { foreignKey: 'userId', as: 'productivityLogs', onDelete: 'CASCADE' });
ProductivityLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User → TimeBlocks
User.hasMany(TimeBlock, { foreignKey: 'userId', as: 'timeBlocks', onDelete: 'CASCADE' });
TimeBlock.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Task → TimeBlock
Task.hasOne(TimeBlock, { foreignKey: 'taskId', as: 'timeBlock', constraints: false });
TimeBlock.belongsTo(Task, { foreignKey: 'taskId', as: 'task', constraints: false });

module.exports = {
  sequelize,
  Sequelize,
  User,
  Task,
  Goal,
  Milestone,
  Journal,
  ProductivityLog,
  TimeBlock,
};
