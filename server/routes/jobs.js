import express from 'express';
import { getJobs, getJobById, createJob, updateJob, deleteJob } from '../controllers/jobController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// GET /api/jobs - Get all jobs
router.get('/', getJobs);

// GET /api/jobs/:id - Get job by ID
router.get('/:id', getJobById);

// POST /api/jobs - Create new job (employer only)
router.post('/', authorize('employer'), createJob);

// PUT /api/jobs/:id - Update job (employer only)
router.put('/:id', authorize('employer'), updateJob);

// DELETE /api/jobs/:id - Delete job (employer only)
router.delete('/:id', authorize('employer'), deleteJob);

export default router; 