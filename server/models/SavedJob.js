module.exports = (sequelize, DataTypes) => {
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
  job_posting_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'job_postings',
      key: 'id'
    },
    onDelete: 'CASCADE'
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
      fields: ['employee_id', 'job_posting_id']
    }
  ]
});

// Define associations
SavedJob.associate = function(models) {
  SavedJob.belongsTo(models.JobPosting, {
    foreignKey: 'job_posting_id',
    as: 'job'
  });
  SavedJob.belongsTo(models.Employee, {
    foreignKey: 'employee_id',
    as: 'employee'
  });
};

return SavedJob;
};

