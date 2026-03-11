module.exports = (sequelize, DataTypes) => {
  const KioskDevice = sequelize.define('KioskDevice', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    device_id: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true
    },
    device_token_hash: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true
    },
    employer_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: 'employer', key: 'id' },
      onDelete: 'CASCADE'
    },
    site_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'active'
    }
  }, {
    tableName: 'kiosk_devices',
    timestamps: true,
    createdAt: 'registered_at',
    updatedAt: false
  });

  KioskDevice.associate = function (models) {
    KioskDevice.belongsTo(models.Employer, {
      foreignKey: 'employer_id',
      as: 'employer'
    });
    KioskDevice.hasMany(models.PresenceEvent, {
      foreignKey: 'kiosk_device_id',
      as: 'presenceEvents'
    });
  };

  return KioskDevice;
};
