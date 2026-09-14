module.exports = (sequelize, DataTypes) => {
const Employer = sequelize.define('Employer', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  first_name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  last_name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  phone_number: {
    type: DataTypes.STRING(30),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  wallet_address: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true
  },
  // Auth provider's stable subject identifier (verified JWT `sub`). Canonical identity
  // link — authorization resolves the record by this, and by nothing else.
  // Provider-neutral name so it applies regardless of the auth backend.
  //
  // NOT NULL (migration 033): a record with no bound identity could not be authorized,
  // and the mechanism that previously filled it in after the fact matched on a
  // client-supplied wallet address, which let any caller claim an unbound row. Writing
  // it at creation from the verified token keeps that state from ever existing.
  auth_subject: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  street_address: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  street_address2: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  country: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  state: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  zip_code: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  country_code: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  company_name: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  company_description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  industry: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  company_size: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  website: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  linkedin: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  approval_status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'pending'
  },
  approved_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  approved_by: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  rejection_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'employer',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Define associations
Employer.associate = function(models) {
  Employer.hasMany(models.JobPosting, {
    foreignKey: 'employer_id',
    as: 'jobPostings'
  });
  Employer.hasMany(models.ContractTemplate, {
    foreignKey: 'employer_id',
    as: 'contractTemplates'
  });
};

return Employer;
};
