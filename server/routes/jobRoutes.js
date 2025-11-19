const express = require('express');
const JobController = require('../controllers/jobController');
const verifyToken = require('../middleware/authMiddleware');

const router = express.Router();

// Job routes
router.post('/', verifyToken, JobController.createJob);
router.get('/', verifyToken, JobController.getAllJobs);
router.get('/employer/:employer_id', verifyToken, JobController.getJobsByEmployer);
router.get('/employer/:employer_id/applications', verifyToken, JobController.getJobsWithApplicationsByEmployer);
router.get('/status/:status', verifyToken, JobController.getJobsByStatus);
router.get('/company/:company_name', verifyToken, JobController.getJobsByCompany);
router.get('/:id/applications', verifyToken, JobController.getJobApplications);
router.get('/:id', verifyToken, JobController.getJobById);
router.put('/:id', verifyToken, JobController.updateJob);
router.patch('/:id/status', verifyToken, JobController.updateJobStatus);

module.exports = router;
