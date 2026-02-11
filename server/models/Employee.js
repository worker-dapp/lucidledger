module.exports = (sequelize, DataTypes) => {
const Employee = sequelize.define('Employee', {
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
  street_address2: {
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
  },
  skills: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  work_experience: {
    type: DataTypes.JSONB,
    allowNull: true
  }
}, {
  tableName: 'employee',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Define associations
Employee.associate = function(models) {
  Employee.hasMany(models.SavedJob, {
    foreignKey: 'employee_id',
    as: 'savedJobs'
  });
  Employee.hasMany(models.JobApplication, {
    foreignKey: 'employee_id',
    as: 'applications'
  });
};

return Employee;
};
