module.exports = (sequelize, DataTypes) => {
  const AuditLog = sequelize.define('AuditLog', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    actor_type: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    actor_id: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    actor_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    action_type: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    action_description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    entity_type: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    entity_id: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    entity_identifier: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    old_value: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    new_value: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    employer_id: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'audit_log',
    timestamps: false
  });

  return AuditLog;
};
