const express = require('express');
const JobPostingController = require('../controllers/jobPostingController');
const { JobPosting } = require('../models');
const { authorize } = require('../middleware/authorize');
const { verifyToken, optionalAuth, requireApprovedEmployer } = require('../middleware/authMiddleware');

const router = express.Router();

// Job posting routes
router.post('/', verifyToken, requireApprovedEmployer, JobPostingController.createJobPosting);
router.get('/', verifyToken, JobPostingController.getJobPostingsByEmployer);
router.get('/active', optionalAuth, JobPostingController.getActiveJobPostings);
router.get('/:id', optionalAuth, JobPostingController.getJobPostingById);
// Exemplar conversion (#153 PR A). The ownership check used to live in the handler and
// compared against req.body.employer_id — a value the caller supplies. It is now a
// guard on the route, checked against the verified caller, and visible here.
router.put('/:id', verifyToken, requireApprovedEmployer,
  authorize('ownedByEmployer', { model: JobPosting }),
  JobPostingController.updateJobPosting);
router.delete('/:id', verifyToken, requireApprovedEmployer, JobPostingController.deleteJobPosting);
router.post('/:id/close', verifyToken, requireApprovedEmployer, JobPostingController.closeJobPosting);
router.post('/:id/activate', verifyToken, requireApprovedEmployer, JobPostingController.activateJobPosting);
router.patch('/:id/recruiter', verifyToken, requireApprovedEmployer, JobPostingController.assignRecruiter);

module.exports = router;
