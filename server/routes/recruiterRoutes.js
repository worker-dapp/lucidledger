const express = require('express');
const RecruiterController = require('../controllers/recruiterController');
const { verifyToken } = require('../middleware/authMiddleware');
const { declarePolicy } = require('../middleware/authorize');

const router = express.Router();

// Static routes must come before /:id to avoid shadowing
router.get('/check/:email', verifyToken, RecruiterController.checkRecruiterByEmail);
router.get('/fee-payments/employer', verifyToken, declarePolicy('scopedList'),
  RecruiterController.getEmployerFeePayments);
router.get('/fee-payments/recruiter', verifyToken, declarePolicy('scopedList'),
  RecruiterController.getRecruiterFeePayments);
router.get('/assigned-jobs', verifyToken, declarePolicy('scopedList'),
  RecruiterController.getAssignedJobs);
router.post('/fee-payments', verifyToken, RecruiterController.createFeePayment);

// Directory and self-signup
router.get('/', verifyToken, RecruiterController.getAllRecruiters);
router.post('/', verifyToken, RecruiterController.createRecruiter);

// Profile (/:id must come after all static routes)
router.get('/:id', verifyToken, RecruiterController.getRecruiterById);
router.put('/:id', verifyToken, RecruiterController.updateRecruiter);

module.exports = router;
