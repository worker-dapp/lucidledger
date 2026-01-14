module.exports = (sequelize, DataTypes) => {
const JobPosting = sequelize.define('JobPosting', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  employer_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'employer',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  template_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
    references: {
      model: 'contract_templates',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  // Basic info
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  positions_available: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  positions_filled: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  application_deadline: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'draft'
  },
  // Job details
  job_type: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  location_type: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  // Compensation
  salary: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true
  },
  currency: {
    type: DataTypes.STRING(10),
    defaultValue: 'USD'
  },
  pay_frequency: {
    type: DataTypes.STRING(20),
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
  // Oracle verification
  selected_oracles: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Job content
  responsibilities: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  skills: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Company info
  company_name: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  company_description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Application tracking
  application_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  accepted_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'job_postings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Define associations
JobPosting.associate = function(models) {
  JobPosting.hasMany(models.SavedJob, {
    foreignKey: 'job_posting_id',
    as: 'savedJobs'
  });
  JobPosting.hasMany(models.JobApplication, {
    foreignKey: 'job_posting_id',
    as: 'applications'
  });
  JobPosting.belongsTo(models.Employer, {
    foreignKey: 'employer_id',
    as: 'employer'
  });
  JobPosting.belongsTo(models.ContractTemplate, {
    foreignKey: 'template_id',
    as: 'template'
  });
};

return JobPosting;
};
