const express = require('express');
const JobPostingController = require('../controllers/jobPostingController');
const { verifyToken, optionalAuth, requireApprovedEmployer } = require('../middleware/authMiddleware');

const router = express.Router();

// Job posting routes
router.post('/', verifyToken, requireApprovedEmployer, JobPostingController.createJobPosting);
router.get('/', verifyToken, JobPostingController.getJobPostingsByEmployer);
router.get('/active', optionalAuth, JobPostingController.getActiveJobPostings);
router.get('/:id', optionalAuth, JobPostingController.getJobPostingById);
router.put('/:id', verifyToken, requireApprovedEmployer, JobPostingController.updateJobPosting);
router.delete('/:id', verifyToken, requireApprovedEmployer, JobPostingController.deleteJobPosting);
router.post('/:id/close', verifyToken, requireApprovedEmployer, JobPostingController.closeJobPosting);
router.post('/:id/activate', verifyToken, requireApprovedEmployer, JobPostingController.activateJobPosting);

module.exports = router;
