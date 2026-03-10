module.exports = (sequelize, DataTypes) => {
  const PresenceEvent = sequelize.define('PresenceEvent', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
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
    kiosk_device_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: 'kiosk_devices', key: 'id' }
    },
    event_type: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    client_timestamp: {
      type: DataTypes.DATE,
      allowNull: false
    },
    server_timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true
    },
    gps_accuracy_meters: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true
    },
    nonce: {
      type: DataTypes.STRING(64),
      allowNull: true,
      unique: true
    },
    oracle_verification_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: 'oracle_verifications', key: 'id' },
      onDelete: 'SET NULL'
    }
  }, {
    tableName: 'presence_events',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  PresenceEvent.associate = function (models) {
    PresenceEvent.belongsTo(models.DeployedContract, {
      foreignKey: 'deployed_contract_id',
      as: 'deployedContract'
    });
    PresenceEvent.belongsTo(models.Employee, {
      foreignKey: 'employee_id',
      as: 'employee'
    });
    PresenceEvent.belongsTo(models.KioskDevice, {
      foreignKey: 'kiosk_device_id',
      as: 'kioskDevice'
    });
    PresenceEvent.belongsTo(models.OracleVerification, {
      foreignKey: 'oracle_verification_id',
      as: 'oracleVerification'
    });
  };

  return PresenceEvent;
};
