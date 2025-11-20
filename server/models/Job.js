const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Job = sequelize.define('Job', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  company_name: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  location: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  location_type: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  salary: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true
  },
  currency: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  pay_frequency: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  job_type: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  notification_email: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  selected_oracles: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  verification_notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  responsibilities: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  skills: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  associated_skills: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  additional_compensation: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  employee_benefits: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  company_description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: 'draft'
  },
  employer_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
    references: {
      model: 'employer',
      key: 'id'
    },
    onDelete: 'CASCADE'
  }
}, {
  tableName: 'jobs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Job;
