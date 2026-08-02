const express = require('express');
const RecruiterController = require('../controllers/recruiterController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Static routes must come before /:id to avoid shadowing
router.get('/check/:email', verifyToken, RecruiterController.checkRecruiterByEmail);
router.get('/fee-payments', verifyToken, RecruiterController.getFeePayments);
router.post('/fee-payments', verifyToken, RecruiterController.createFeePayment);

// Directory and self-signup
router.get('/', verifyToken, RecruiterController.getAllRecruiters);
router.post('/', verifyToken, RecruiterController.createRecruiter);

// Profile (/:id must come after all static routes)
router.get('/:id', verifyToken, RecruiterController.getRecruiterById);
router.put('/:id', verifyToken, RecruiterController.updateRecruiter);
router.get('/:id/assigned-jobs', verifyToken, RecruiterController.getAssignedJobs);

module.exports = router;
