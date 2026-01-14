module.exports = (sequelize, DataTypes) => {
  const ContractTemplate = sequelize.define('ContractTemplate', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
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
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // Job details
    job_type: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    location_type: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    // Compensation
    base_salary: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    currency: {
      type: DataTypes.STRING(10),
      defaultValue: 'USD'
    },
    pay_frequency: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    additional_compensation: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    employee_benefits: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // Oracle verification
    selected_oracles: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // Job content
    responsibilities: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    skills: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // Usage tracking
    usage_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    last_used_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'contract_templates',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  ContractTemplate.associate = function(models) {
    ContractTemplate.belongsTo(models.Employer, {
      foreignKey: 'employer_id',
      as: 'employer'
    });
  };

  return ContractTemplate;
};
