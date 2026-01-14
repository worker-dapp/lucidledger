const express = require('express');
const JobController = require('../controllers/jobController');
const { verifyToken, optionalAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// Job routes
router.post('/', verifyToken, JobController.createJob); // Protected: Only employers can create jobs
router.get('/', optionalAuth, JobController.getAllJobs); // Public: Allow browsing jobs without auth
router.get('/employer/:employer_id', verifyToken, JobController.getJobsByEmployer); // Protected: Employer-specific
router.get('/employer/:employer_id/applications', verifyToken, JobController.getJobsWithApplicationsByEmployer); // Protected: Employer-specific
router.get('/status/:status', verifyToken, JobController.getJobsByStatus); // Protected: Internal use
router.get('/company/:company_name', verifyToken, JobController.getJobsByCompany); // Protected: Internal use
router.get('/:id/applications', verifyToken, JobController.getJobApplications); // Protected: Employer-specific
router.get('/:id', optionalAuth, JobController.getJobById); // Public: Allow viewing individual jobs without auth
router.put('/:id', verifyToken, JobController.updateJob); // Protected: Only employers can update
router.patch('/:id/status', verifyToken, JobController.updateJobStatus); // Protected: Only employers can update status

module.exports = router;
