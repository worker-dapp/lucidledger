module.exports = (sequelize, DataTypes) => {
const DeployedContract = sequelize.define('DeployedContract', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
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
  employee_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'employee',
      key: 'id'
    },
    onDelete: 'CASCADE'
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
  contract_address: {
    type: DataTypes.STRING(42),
    allowNull: false,
    unique: true
  },
  deployment_tx_hash: {
    type: DataTypes.STRING(66),
    allowNull: true
  },
  deployed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'active'
  },
  started_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  expected_end_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  actual_end_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  payment_amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  payment_currency: {
    type: DataTypes.STRING(10),
    defaultValue: 'USD'
  },
  payment_frequency: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  last_payment_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  next_payment_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  total_paid: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  selected_oracles: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  contract_version: {
    type: DataTypes.SMALLINT,
    defaultValue: 1
  },
  oracle_addresses: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  verification_status: {
    type: DataTypes.STRING(50),
    defaultValue: 'pending'
  },
  last_verification_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  mediator_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
    references: {
      model: 'mediators',
      key: 'id'
    }
  }
}, {
  tableName: 'deployed_contracts',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['job_posting_id', 'employee_id']
    }
  ]
});

// Define associations
DeployedContract.associate = function(models) {
  DeployedContract.belongsTo(models.JobPosting, {
    foreignKey: 'job_posting_id',
    as: 'jobPosting'
  });
  DeployedContract.belongsTo(models.Employee, {
    foreignKey: 'employee_id',
    as: 'employee'
  });
  DeployedContract.belongsTo(models.Employer, {
    foreignKey: 'employer_id',
    as: 'employer'
  });
  DeployedContract.belongsTo(models.Mediator, {
    foreignKey: 'mediator_id',
    as: 'mediator'
  });
  DeployedContract.hasMany(models.OracleVerification, {
    foreignKey: 'deployed_contract_id',
    as: 'oracleVerifications'
  });
  DeployedContract.hasMany(models.PaymentTransaction, {
    foreignKey: 'deployed_contract_id',
    as: 'paymentTransactions'
  });
};

return DeployedContract;
};
