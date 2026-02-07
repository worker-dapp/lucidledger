module.exports = (sequelize, DataTypes) => {
  const DisputeHistory = sequelize.define('DisputeHistory', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    deployed_contract_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'deployed_contracts',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    raised_by_employee_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'employee',
        key: 'id'
      },
      onDelete: 'SET NULL'
    },
    raised_by_employer_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'employer',
        key: 'id'
      },
      onDelete: 'SET NULL'
    },
    raised_by_role: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [['employee', 'employer']]
      }
    },
    raised_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    mediator_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'mediators',
        key: 'id'
      },
      onDelete: 'SET NULL'
    },
    mediator_assigned_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    resolved_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    resolution: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: {
        isIn: [['worker_paid', 'employer_refunded', 'split', 'cancelled']]
      }
    },
    resolution_notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    resolution_tx_hash: {
      type: DataTypes.STRING(66),
      allowNull: true
    }
  }, {
    tableName: 'dispute_history',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  // Define associations
  DisputeHistory.associate = function(models) {
    DisputeHistory.belongsTo(models.DeployedContract, {
      foreignKey: 'deployed_contract_id',
      as: 'deployedContract'
    });
    DisputeHistory.belongsTo(models.Employee, {
      foreignKey: 'raised_by_employee_id',
      as: 'raisedByEmployee'
    });
    DisputeHistory.belongsTo(models.Employer, {
      foreignKey: 'raised_by_employer_id',
      as: 'raisedByEmployer'
    });
    DisputeHistory.belongsTo(models.Mediator, {
      foreignKey: 'mediator_id',
      as: 'mediator'
    });
  };

  return DisputeHistory;
};
