const express = require('express');
const JobController = require('../controllers/jobController');

const router = express.Router();

// Job routes
router.post('/', JobController.createJob);
router.get('/', JobController.getAllJobs);
router.get('/:id', JobController.getJobById);
router.get('/status/:status', JobController.getJobsByStatus);
router.get('/company/:company_name', JobController.getJobsByCompany);
router.put('/:id', JobController.updateJob);
router.patch('/:id/status', JobController.updateJobStatus);

module.exports = router;
