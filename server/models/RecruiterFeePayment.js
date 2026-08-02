module.exports = (sequelize, DataTypes) => {
  const RecruiterFeePayment = sequelize.define('RecruiterFeePayment', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    job_posting_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: 'job_postings', key: 'id' },
      onDelete: 'CASCADE'
    },
    recruiter_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: 'recruiters', key: 'id' },
      onDelete: 'CASCADE'
    },
    employer_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: 'employer', key: 'id' },
      onDelete: 'CASCADE'
    },
    fee_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },
    fee_currency: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'USD'
    },
    payment_status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'pending'
    },
    tx_hash: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    payment_reference_id: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    paid_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'recruiter_fee_payments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  RecruiterFeePayment.associate = function(models) {
    RecruiterFeePayment.belongsTo(models.JobPosting, {
      foreignKey: 'job_posting_id',
      as: 'jobPosting'
    });
    RecruiterFeePayment.belongsTo(models.Recruiter, {
      foreignKey: 'recruiter_id',
      as: 'recruiter'
    });
    RecruiterFeePayment.belongsTo(models.Employer, {
      foreignKey: 'employer_id',
      as: 'employer'
    });
  };

  return RecruiterFeePayment;
};
