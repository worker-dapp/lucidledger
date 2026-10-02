const express = require('express');
const PaymentTransactionController = require('../controllers/paymentTransactionController');
const { DeployedContract } = require('../models');
const { verifyToken } = require('../middleware/authMiddleware');
const { authorize, declarePolicy } = require('../middleware/authorize');

const router = express.Router();

// Payment transactions belong to a deployed contract. Every route is guarded against the
// contract named by the request, scoped to the caller, or admin-only (#152, GHSA-9vpg).
const onNamedContract = (from, paramName) =>
  authorize('contractParty', { model: DeployedContract, paramName, from });

router.get('/', verifyToken, onNamedContract('query', 'contract_id'),
  PaymentTransactionController.getPaymentTransactionsByContract);

router.post('/', verifyToken, onNamedContract('body', 'deployed_contract_id'),
  PaymentTransactionController.createPaymentTransaction);

// "All pending payments" cannot be scoped to a caller — that is the question it answers.
// An operations endpoint, so admin only.
router.get('/pending', verifyToken, authorize('admin'),
  PaymentTransactionController.getPendingPaymentTransactions);

router.get('/employee', verifyToken, declarePolicy('scopedList'),
  PaymentTransactionController.getPaymentTransactionsByEmployee);

module.exports = router;
