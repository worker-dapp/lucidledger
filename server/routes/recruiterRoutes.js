const express = require('express');
const RecruiterController = require('../controllers/recruiterController');
const { verifyToken, requireApprovedEmployer } = require('../middleware/authMiddleware');
const { declarePolicy } = require('../middleware/authorize');

const router = express.Router();

// Static routes must come before /:id to avoid shadowing
router.get('/me', verifyToken,
  declarePolicy('handlerEnforced', { reason: 'returns only the caller\'s own record, resolved by verified email' }),
  RecruiterController.getMyRecruiterProfile);
router.get('/fee-payments/employer', verifyToken, declarePolicy('scopedList'),
  RecruiterController.getEmployerFeePayments);
router.get('/fee-payments/recruiter', verifyToken, declarePolicy('scopedList'),
  RecruiterController.getRecruiterFeePayments);
router.get('/assigned-jobs', verifyToken, declarePolicy('scopedList'),
  RecruiterController.getAssignedJobs);
router.post('/fee-payments', verifyToken, RecruiterController.createFeePayment);

// Directory (approved employers, for assigning a recruiter) and self-signup
router.get('/', verifyToken, requireApprovedEmployer,
  declarePolicy('handlerEnforced', { reason: 'recruiter directory for approved employers; returns directory fields only' }),
  RecruiterController.getAllRecruiters);
router.post('/', verifyToken, declarePolicy('ownerFromCaller'), RecruiterController.createRecruiter);

// Profile (/:id must come after all static routes)
router.put('/:id', verifyToken, RecruiterController.updateRecruiter);

module.exports = router;
