const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const JobApplication = sequelize.define('JobApplication', {
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
  is_saved: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  application_status: {
    type: DataTypes.TEXT,
    allowNull: true,
    // null = not applied, 'applied' = applied, 'accepted' = accepted, 'rejected' = rejected
    defaultValue: null
  },
  applied_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'job_applications',
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

module.exports = JobApplication;
