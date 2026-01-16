module.exports = (sequelize, DataTypes) => {
const PaymentTransaction = sequelize.define('PaymentTransaction', {
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
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING(10),
    defaultValue: 'USD'
  },
  payment_type: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  tx_hash: {
    type: DataTypes.STRING(66),
    allowNull: true,
    unique: true
  },
  block_number: {
    type: DataTypes.BIGINT,
    allowNull: true
  },
  from_address: {
    type: DataTypes.STRING(42),
    allowNull: true
  },
  to_address: {
    type: DataTypes.STRING(42),
    allowNull: true
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'pending'
  },
  processed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'payment_transactions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

// Define associations
PaymentTransaction.associate = function(models) {
  PaymentTransaction.belongsTo(models.DeployedContract, {
    foreignKey: 'deployed_contract_id',
    as: 'deployedContract'
  });
};

return PaymentTransaction;
};
