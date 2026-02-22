const express = require('express');
const router = express.Router();
const jobApplicationController = require('../controllers/jobApplicationController');
const { verifyToken, requireApprovedEmployer } = require('../middleware/authMiddleware');

// Save/Unsave job routes
router.post('/save', verifyToken, jobApplicationController.saveJob);
router.post('/unsave', verifyToken, jobApplicationController.unsaveJob);

// Apply to job route
router.post('/apply', verifyToken, jobApplicationController.applyToJob);

// Get jobs by status for an employee
router.get('/saved/:employee_id', verifyToken, jobApplicationController.getSavedJobs);
router.get('/applied/:employee_id', verifyToken, jobApplicationController.getAppliedJobs);

// Employer application review
router.get('/employer/:employer_id', verifyToken, requireApprovedEmployer, jobApplicationController.getApplicationsByEmployer);
router.post('/bulk-status', verifyToken, requireApprovedEmployer, jobApplicationController.bulkUpdateApplicationStatus);

// Update application status
router.patch('/:applicationId/status', verifyToken, jobApplicationController.updateApplicationStatus);

module.exports = router;
