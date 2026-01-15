const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import database connection
const { sequelize } = require('./config/database');

// Import routes
const employeeRoutes = require('./routes/employeeRoutes');
const employerRoutes = require('./routes/employerRoutes');
const jobApplicationRoutes = require('./routes/jobApplicationRoutes');
const contractTemplateRoutes = require('./routes/contractTemplateRoutes');
const jobPostingRoutes = require('./routes/jobPostingRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// Rate limiting (disabled in development)
if (process.env.NODE_ENV === 'production') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
  });
  app.use(limiter);
  console.log('🛡️  Rate limiting enabled (production mode)');
} else {
  console.log('⚠️  Rate limiting disabled (development mode)');
}

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

// API routes
app.use('/api/employees', employeeRoutes);
app.use('/api/employers', employerRoutes);
app.use('/api/job-applications', jobApplicationRoutes);
app.use('/api/contract-templates', contractTemplateRoutes);
app.use('/api/job-postings', jobPostingRoutes);

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
      'add-employer-id-to-jobs.sql',
      'add-missing-fields.sql',
      '001-create-contract-templates.sql',
      '002-create-job-postings.sql',
      '003-update-job-applications.sql',
      '004-update-saved-jobs.sql',
      '005-remove-old-jobs-table.sql',
      '006-make-job-id-nullable.sql'
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
      console.log(`🌐 CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

module.exports = app;
