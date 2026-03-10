module.exports = (sequelize, DataTypes) => {
  const QrToken = sequelize.define('QrToken', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    token: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true
    },
    deployed_contract_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: 'deployed_contracts', key: 'id' },
      onDelete: 'CASCADE'
    },
    employee_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: 'employee', key: 'id' },
      onDelete: 'CASCADE'
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    used_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'qr_tokens',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  QrToken.associate = function (models) {
    QrToken.belongsTo(models.DeployedContract, {
      foreignKey: 'deployed_contract_id',
      as: 'deployedContract'
    });
    QrToken.belongsTo(models.Employee, {
      foreignKey: 'employee_id',
      as: 'employee'
    });
  };

  return QrToken;
};
