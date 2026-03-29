// ─── Goal Model ───────────────────────────────────────────────────────────────
const GoalModel = (sequelize, DataTypes) => {
  const Goal = sequelize.define('Goal', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: { len: [2, 255], notEmpty: true },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    category: {
      type: DataTypes.ENUM('career', 'health', 'finance', 'education', 'personal', 'relationships', 'other'),
      defaultValue: 'personal',
    },
    status: {
      type: DataTypes.ENUM('active', 'completed', 'paused', 'cancelled'),
      defaultValue: 'active',
    },
    deadline: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    progress: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      validate: { min: 0, max: 100 },
    },
    targetValue: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    currentValue: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    unit: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    color: {
      type: DataTypes.STRING(7),
      defaultValue: '#6366f1',
    },
    icon: {
      type: DataTypes.STRING(50),
      defaultValue: 'target',
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'goals',
    indexes: [
      { fields: ['userId'] },
      { fields: ['status'] },
      { fields: ['deadline'] },
    ],
  });
  return Goal;
};

// ─── Milestone Model ──────────────────────────────────────────────────────────
const MilestoneModel = (sequelize, DataTypes) => {
  const Milestone = sequelize.define('Milestone', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    goalId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'goals', key: 'id' },
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: { len: [1, 255] },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'in_progress', 'completed'),
      defaultValue: 'pending',
    },
    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  }, {
    tableName: 'milestones',
    indexes: [
      { fields: ['goalId'] },
      { fields: ['status'] },
    ],
  });
  return Milestone;
};

// ─── Journal Model ────────────────────────────────────────────────────────────
const JournalModel = (sequelize, DataTypes) => {
  const Journal = sequelize.define('Journal', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: { len: [1, 50000] },
    },
    mood: {
      type: DataTypes.ENUM('great', 'good', 'neutral', 'bad', 'terrible'),
      allowNull: true,
    },
    tags: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    wordCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    isPrivate: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  }, {
    tableName: 'journals',
    indexes: [
      { fields: ['userId'] },
      { fields: ['date'] },
      { fields: ['userId', 'date'] },
    ],
    hooks: {
      beforeSave: (journal) => {
        if (journal.content) {
          journal.wordCount = journal.content.trim().split(/\s+/).filter(Boolean).length;
        }
      },
    },
  });
  return Journal;
};

// ─── ProductivityLog Model ────────────────────────────────────────────────────
const ProductivityLogModel = (sequelize, DataTypes) => {
  const ProductivityLog = sequelize.define('ProductivityLog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    completedTasks: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    totalTasks: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    score: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      validate: { min: 0, max: 100 },
    },
    focusMinutes: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    journalWritten: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    xpEarned: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    streak: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    insights: {
      type: DataTypes.JSON,
      defaultValue: {},
    },
  }, {
    tableName: 'productivity_logs',
    indexes: [
      { fields: ['userId'] },
      { fields: ['date'] },
      { unique: true, fields: ['userId', 'date'] },
    ],
  });
  return ProductivityLog;
};

// ─── TimeBlock Model ──────────────────────────────────────────────────────────
const TimeBlockModel = (sequelize, DataTypes) => {
  const TimeBlock = sequelize.define('TimeBlock', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    taskId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'tasks', key: 'id' },
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    startTime: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    endTime: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    color: {
      type: DataTypes.STRING(7),
      defaultValue: '#6366f1',
    },
    category: {
      type: DataTypes.ENUM('work', 'study', 'personal', 'health', 'break', 'other'),
      defaultValue: 'work',
    },
    isCompleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  }, {
    tableName: 'time_blocks',
    indexes: [
      { fields: ['userId'] },
      { fields: ['date'] },
      { fields: ['userId', 'date'] },
    ],
  });
  return TimeBlock;
};

module.exports = { GoalModel, MilestoneModel, JournalModel, ProductivityLogModel, TimeBlockModel };
