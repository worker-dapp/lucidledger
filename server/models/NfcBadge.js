module.exports = (sequelize, DataTypes) => {
  const NfcBadge = sequelize.define('NfcBadge', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    badge_uid: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    employer_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: { model: 'employer', key: 'id' },
      onDelete: 'CASCADE'
    },
    employee_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: 'employee', key: 'id' },
      onDelete: 'SET NULL'
    },
    label: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'active'
    }
  }, {
    tableName: 'nfc_badges',
    timestamps: true,
    createdAt: 'registered_at',
    updatedAt: false
  });

  NfcBadge.associate = function (models) {
    NfcBadge.belongsTo(models.Employer, {
      foreignKey: 'employer_id',
      as: 'employer'
    });
    NfcBadge.belongsTo(models.Employee, {
      foreignKey: 'employee_id',
      as: 'employee'
    });
  };

  return NfcBadge;
};
