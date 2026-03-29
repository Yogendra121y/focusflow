module.exports = (sequelize, DataTypes) => {
  const Task = sequelize.define('Task', {
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
    goalId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'goals', key: 'id' },
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: { len: [1, 255], notEmpty: true },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      defaultValue: 'medium',
    },
    status: {
      type: DataTypes.ENUM('todo', 'in_progress', 'completed', 'cancelled'),
      defaultValue: 'todo',
    },
    category: {
      type: DataTypes.ENUM('work', 'study', 'personal', 'health', 'finance', 'other'),
      defaultValue: 'personal',
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    estimatedMinutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: { min: 1, max: 1440 },
    },
    actualMinutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    tags: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    xpReward: {
      type: DataTypes.INTEGER,
      defaultValue: 10,
    },
    isRecurring: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    recurringPattern: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  }, {
    tableName: 'tasks',
    indexes: [
      { fields: ['userId'] },
      { fields: ['status'] },
      { fields: ['priority'] },
      { fields: ['category'] },
      { fields: ['dueDate'] },
      { fields: ['userId', 'status'] },
      { fields: ['userId', 'dueDate'] },
    ],
    hooks: {
      beforeUpdate: async (task) => {
        if (task.changed('status') && task.status === 'completed' && !task.completedAt) {
          task.completedAt = new Date();
        }
        if (task.changed('status') && task.status !== 'completed') {
          task.completedAt = null;
        }
      },
    },
  });

  return Task;
};
