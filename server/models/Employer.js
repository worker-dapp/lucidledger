const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Employer = sequelize.define('Employer', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  first_name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  last_name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  phone_number: {
    type: DataTypes.STRING(30),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  wallet_address: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  street_address: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  country: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  state: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  zip_code: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  country_code: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'employer',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Employer;
