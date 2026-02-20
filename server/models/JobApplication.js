module.exports = (sequelize, DataTypes) => {
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
  job_posting_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'job_postings',
      key: 'id'
    },
    onDelete: 'CASCADE'
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
  },
  offer_sent_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  offer_accepted_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  blockchain_deployment_status: {
    type: DataTypes.STRING(30),
    defaultValue: 'not_deployed'
    // 'not_deployed', 'pending_deployment', 'deploying', 'confirmed', 'failed'
  },
  offer_signature: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  offer_signed_at: {
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
      fields: ['employee_id', 'job_posting_id']
    }
  ]
});

// Define associations
JobApplication.associate = function(models) {
  JobApplication.belongsTo(models.JobPosting, {
    foreignKey: 'job_posting_id',
    as: 'job'
  });
  JobApplication.belongsTo(models.Employee, {
    foreignKey: 'employee_id',
    as: 'employee'
  });
};

return JobApplication;
};
