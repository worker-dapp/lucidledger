const express = require('express');
const PaymentTransactionController = require('../controllers/paymentTransactionController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Payment transaction routes
router.get('/', verifyToken, PaymentTransactionController.getPaymentTransactionsByContract);
router.post('/', verifyToken, PaymentTransactionController.createPaymentTransaction);
router.get('/pending', verifyToken, PaymentTransactionController.getPendingPaymentTransactions);
router.get('/employee/:employeeId', verifyToken, PaymentTransactionController.getPaymentTransactionsByEmployee);

module.exports = router;
