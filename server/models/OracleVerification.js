module.exports = (sequelize, DataTypes) => {
const OracleVerification = sequelize.define('OracleVerification', {
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
  oracle_type: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  verification_status: {
    type: DataTypes.STRING(50),
    defaultValue: 'pending'
  },
  verified_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  verified_by: {
    type: DataTypes.BIGINT,
    allowNull: true,
    references: {
      model: 'employee',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true
  },
  location_name: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  gps_accuracy_meters: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  image_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  image_hash: {
    type: DataTypes.STRING(66),
    allowNull: true
  },
  weight_recorded: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  weight_unit: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  clock_in_time: {
    type: DataTypes.DATE,
    allowNull: true
  },
  clock_out_time: {
    type: DataTypes.DATE,
    allowNull: true
  },
  hours_worked: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  tx_hash: {
    type: DataTypes.STRING(66),
    allowNull: true
  },
  block_number: {
    type: DataTypes.BIGINT,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'oracle_verifications',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

// Define associations
OracleVerification.associate = function(models) {
  OracleVerification.belongsTo(models.DeployedContract, {
    foreignKey: 'deployed_contract_id',
    as: 'deployedContract'
  });
  OracleVerification.belongsTo(models.Employee, {
    foreignKey: 'verified_by',
    as: 'verifiedBy'
  });
};

return OracleVerification;
};
