const express = require('express');
const OracleVerificationController = require('../controllers/oracleVerificationController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Oracle verification routes
router.get('/', verifyToken, OracleVerificationController.getOracleVerificationsByContract);
router.post('/', verifyToken, OracleVerificationController.createOracleVerification);
router.get('/latest/:contract_id', verifyToken, OracleVerificationController.getLatestOracleVerifications);

module.exports = router;
