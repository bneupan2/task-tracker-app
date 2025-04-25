const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('./User').sequelize;
const Project = require('./Project');

const Task = sequelize.define('Task', {
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    isDone: {
      type: DataTypes.BOOLEAN,
      defaultValue: false // ✅ New field for marking completion
    }
  });

// Relation: One Project has many Tasks
Project.hasMany(Task, { onDelete: 'CASCADE' });
Task.belongsTo(Project);

module.exports = Task;
