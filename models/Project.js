const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('./User').sequelize;
const User = require('./User').User;

const Project = sequelize.define('Project', {
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  dueDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  }
});

User.hasMany(Project, { onDelete: 'CASCADE' });
Project.belongsTo(User);

module.exports = Project;

