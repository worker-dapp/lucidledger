const express = require('express');
const DisputeHistoryController = require('../controllers/disputeHistoryController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Dispute history routes
router.post('/', verifyToken, DisputeHistoryController.createDispute);
router.get('/employer/:employerId', verifyToken, DisputeHistoryController.getDisputesByEmployer);
router.get('/contract/:contractId', verifyToken, DisputeHistoryController.getDisputesByContract);
router.put('/:id', verifyToken, DisputeHistoryController.updateDispute);

module.exports = router;
