const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SavedJob = sequelize.define('SavedJob', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  employee_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'employees',
      key: 'id'
    }
  },
  job_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'jobs',
      key: 'id'
    }
  },
  saved_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'saved_jobs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['employee_id', 'job_id']
    }
  ]
});

module.exports = SavedJob;

