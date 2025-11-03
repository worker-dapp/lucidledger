const express = require('express');
const router = express.Router();
const jobApplicationController = require('../controllers/jobApplicationController');

// Save/Unsave job routes
router.post('/save', jobApplicationController.saveJob);
router.post('/unsave', jobApplicationController.unsaveJob);

// Apply to job route
router.post('/apply', jobApplicationController.applyToJob);

// Get jobs by status for an employee
router.get('/saved/:employeeId', jobApplicationController.getSavedJobs);
router.get('/applied/:employeeId', jobApplicationController.getAppliedJobs);
router.get('/employee/:employeeId', jobApplicationController.getEmployeeApplications);

// Update application status
router.patch('/:applicationId/status', jobApplicationController.updateApplicationStatus);

module.exports = router;
