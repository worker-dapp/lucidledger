import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/database.js';
import authRoutes from './routes/auth.js';
import jobRoutes from './routes/jobs.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Connect to database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Lucid Ledger Server is running',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'Lucid Ledger API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      api: 'GET /api',
      'auth/signup': 'POST /api/auth/signup',
      'auth/login': 'POST /api/auth/login',
      'auth/me': 'GET /api/auth/me',
      jobs: 'GET/POST /api/jobs',
      'jobs/:id': 'GET/PUT/DELETE /api/jobs/:id'
    }
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    error: 'Something went wrong!' 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Route not found' 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Lucid Ledger Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API docs: http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

export default app; 