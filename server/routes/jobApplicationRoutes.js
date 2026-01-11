const express = require('express');
const router = express.Router();
const jobApplicationController = require('../controllers/jobApplicationController');
const { verifyToken } = require('../middleware/authMiddleware');

// Save/Unsave job routes
router.post('/save', verifyToken, jobApplicationController.saveJob);
router.post('/unsave', verifyToken, jobApplicationController.unsaveJob);

// Apply to job route
router.post('/apply', verifyToken, jobApplicationController.applyToJob);

// Get jobs by status for an employee
router.get('/saved/:employeeId', verifyToken, jobApplicationController.getSavedJobs);
router.get('/applied/:employeeId', verifyToken, jobApplicationController.getAppliedJobs);
router.get('/employee/:employeeId', verifyToken, jobApplicationController.getEmployeeApplications);

// Update application status
router.patch('/:applicationId/status', verifyToken, jobApplicationController.updateApplicationStatus);

module.exports = router;
