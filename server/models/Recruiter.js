module.exports = (sequelize, DataTypes) => {
  const Recruiter = sequelize.define('Recruiter', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
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
    wallet_address: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true
    },
    agency_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'active'
    }
  }, {
    tableName: 'recruiters',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Recruiter.associate = function(models) {
    Recruiter.hasMany(models.JobPosting, {
      foreignKey: 'recruiter_id',
      as: 'assignedJobs'
    });
    Recruiter.hasMany(models.RecruiterFeePayment, {
      foreignKey: 'recruiter_id',
      as: 'feePayments'
    });
  };

  return Recruiter;
};
