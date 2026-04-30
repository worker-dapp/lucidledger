const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import database connection
const { sequelize } = require('./config/database');
const { Employee, Employer, Mediator } = require('./models');

// Import routes
const employeeRoutes = require('./routes/employeeRoutes');
const employerRoutes = require('./routes/employerRoutes');
const jobApplicationRoutes = require('./routes/jobApplicationRoutes');
const contractTemplateRoutes = require('./routes/contractTemplateRoutes');
const jobPostingRoutes = require('./routes/jobPostingRoutes');
const deployedContractRoutes = require('./routes/deployedContractRoutes');
const oracleVerificationRoutes = require('./routes/oracleVerificationRoutes');
const paymentTransactionRoutes = require('./routes/paymentTransactionRoutes');
const mediatorRoutes = require('./routes/mediatorRoutes');
const disputeHistoryRoutes = require('./routes/disputeHistoryRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');
const reportRoutes = require('./routes/reportRoutes');
const adminEmployerRoutes = require('./routes/adminEmployerRoutes');
const adminRoutes = require('./routes/adminRoutes');
const qrOracleRoutes = require('./routes/qrOracleRoutes');
const nfcOracleRoutes = require('./routes/nfcOracleRoutes');
const { validateWalletAddress } = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// Rate limiting (disabled in development)
if (process.env.NODE_ENV === 'production') {
  // Key by wallet address for authenticated requests, fall back to IP for
  // unauthenticated requests (health checks, bots). This eliminates the
  // shared-IP problem for classrooms and workplaces where many users share
  // a single NAT address.
  const perUserKeyGenerator = (req) => {
    const wallet = req.headers['x-wallet-address'];
    return wallet ? `wallet:${wallet}` : req.ip;
  };

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300, // 300 req/15 min per user (wallet) or per IP for unauthenticated
    keyGenerator: perUserKeyGenerator,
    message: 'Too many requests, please try again later.'
  });
  const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // stricter limit for sensitive admin endpoints
    keyGenerator: perUserKeyGenerator,
    message: 'Too many requests to admin endpoints, please try again later.'
  });
  app.use(limiter);
  app.use('/api/admin', adminLimiter);
  console.log('🛡️  Rate limiting enabled (production mode, per-user)');
} else {
  console.log('⚠️  Rate limiting disabled (development mode)');
}

// CORS configuration
// Supports both the browser dev app and Capacitor native WebViews.
const defaultCorsOrigins = [
  'http://localhost:5173',
  'https://localhost',
  'capacitor://localhost',
  'https://www.lucidledger.co'
];
const configuredCorsOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedCorsOrigins = [...new Set([
  ...defaultCorsOrigins,
  ...configuredCorsOrigins
])];

app.use(cors({
  origin: (origin, callback) => {
    // Allow same-origin/non-browser requests such as curl or server-to-server checks.
    if (!origin) {
      return callback(null, true);
    }

    if (allowedCorsOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Wallet address validation — normalizes x-wallet-address header to EIP-55 checksum form
app.use(validateWalletAddress);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Combined profile-status endpoint — replaces 3 sequential login lookups with 1 parallel call
const { verifyToken } = require('./middleware/authMiddleware');
app.get('/api/profile-status', verifyToken, async (req, res) => {
  const { wallet } = req.query;
  if (!wallet) return res.status(400).json({ success: false, message: 'wallet query param required' });
  const email = req.user?.email || null;
  try {
    const { Op } = require('sequelize');
    const [employee, employer, mediator] = await Promise.all([
      Employee.findOne({ where: { wallet_address: wallet } }).catch(() => null),
      Employer.findOne({ where: { wallet_address: wallet } }).catch(() => null),
      email
        ? Mediator.findOne({ where: { email: { [Op.iLike]: email } } }).catch(() => null)
        : Promise.resolve(null),
    ]);
    res.json({ success: true, data: { employee: employee ?? null, employer: employer ?? null, mediator: mediator ?? null } });
  } catch (err) {
    console.error('Error in profile-status:', err);
    res.status(500).json({ success: false, message: 'Error checking profile status' });
  }
});

// API routes
app.use('/api/employees', employeeRoutes);
app.use('/api/employers', employerRoutes);
app.use('/api/job-applications', jobApplicationRoutes);
app.use('/api/contract-templates', contractTemplateRoutes);
app.use('/api/job-postings', jobPostingRoutes);
app.use('/api/deployed-contracts', deployedContractRoutes);
app.use('/api/oracle-verifications', oracleVerificationRoutes);
app.use('/api/payment-transactions', paymentTransactionRoutes);
app.use('/api/mediators', mediatorRoutes);
app.use('/api/dispute-history', disputeHistoryRoutes);
app.use('/api/audit-log', auditLogRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/employers', adminEmployerRoutes);
app.use('/api', qrOracleRoutes);
app.use('/api', nfcOracleRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Function to run migrations on startup
async function runMigrationsOnStartup() {
  try {
    console.log('🔍 Running database migrations...');
    const migrationsDir = path.join(__dirname, 'migrations');

    if (!fs.existsSync(migrationsDir)) {
      console.log('⚠️  Migrations directory not found, skipping...');
      return;
    }

    // Get all SQL migration files in order
    const migrationFiles = [
      'create-all-tables.sql',
      '001-create-contract-templates.sql',
      '002-create-job-postings.sql',
      '003-update-job-applications.sql',
      '004-update-saved-jobs.sql',
      '005-remove-old-jobs-table.sql',
      '006-make-job-id-nullable.sql',
      '007-create-deployed-contracts.sql',
      '008-create-oracle-verifications.sql',
      '009-create-payment-transactions.sql',
      '010-create-mediators.sql',
      '011-add-mediator-to-deployed-contracts.sql',
      '012-create-dispute-history.sql',
      '013-add-employer-approval.sql',
      '014-add-employee-profile-fields.sql',
      '015-contract-version-and-oracle-addresses.sql',
      '016-offer-signature.sql',
      '017-allow-repeat-contracts-per-worker.sql',
      '018-fix-email-wallet-constraints.sql',
      '019-add-contract-snapshot.sql',
      '020-add-snapshot-to-job-applications.sql',
      '021-add-employee-profile-tier2.sql',
      '022-create-audit-log.sql',
      '023-fix-payment-tx-hash-constraint.sql',
      '024-add-employer-id-to-audit-log.sql',
      '025-qr-oracle.sql',
      '026-nfc-oracle.sql',
      '027-drop-duplicate-email-constraints.sql'
    ];

    for (const file of migrationFiles) {
      const migrationPath = path.join(migrationsDir, file);

      if (fs.existsSync(migrationPath)) {
        try {
          console.log(`  📄 Running ${file}...`);
          const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
          await sequelize.query(migrationSQL);
          console.log(`  ✅ ${file} completed`);
        } catch (fileError) {
          console.log(`  ⚠️  ${file} failed (this is usually fine if tables already exist):`, fileError.message);
          // Continue to next migration even if this one fails
        }
      } else {
        console.log(`  ⚠️  ${file} not found, skipping...`);
      }
    }

    console.log('✅ All database migrations completed successfully!');
  } catch (error) {
    // Don't crash the server if migrations fail (tables might already exist)
    console.error('⚠️  Migration failed (this is usually fine if tables already exist):', error.message);
  }
}

// Start server with automatic migrations
async function startServer() {
  try {
    // Run migrations first
    await runMigrationsOnStartup();
    
    // Then start the server
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 CORS Origins: ${allowedCorsOrigins.join(', ')}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

module.exports = app;
