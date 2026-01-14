const express = require('express');
const JobPostingController = require('../controllers/jobPostingController');
const { verifyToken, optionalAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// Job posting routes
router.post('/', verifyToken, JobPostingController.createJobPosting); // Protected: Only employers
router.get('/', verifyToken, JobPostingController.getJobPostingsByEmployer); // Protected: Employer-specific
router.get('/active', optionalAuth, JobPostingController.getActiveJobPostings); // Public: Active jobs for employees
router.get('/:id', optionalAuth, JobPostingController.getJobPostingById); // Public: Allow viewing
router.put('/:id', verifyToken, JobPostingController.updateJobPosting); // Protected: Only employers
router.delete('/:id', verifyToken, JobPostingController.deleteJobPosting); // Protected: Only employers
router.post('/:id/close', verifyToken, JobPostingController.closeJobPosting); // Protected: Only employers
router.post('/:id/activate', verifyToken, JobPostingController.activateJobPosting); // Protected: Only employers

module.exports = router;
