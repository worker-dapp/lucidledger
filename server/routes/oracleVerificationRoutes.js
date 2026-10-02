const express = require('express');
const OracleVerificationController = require('../controllers/oracleVerificationController');
const { DeployedContract } = require('../models');
const { verifyToken } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/authorize');

const router = express.Router();

// Oracle verifications belong to a deployed contract and carry no owner of their own, so
// every route here is guarded against the contract named by the request (#152, GHSA-9vpg).
// None of them had any ownership check before.
const onNamedContract = (from, paramName) =>
  authorize('contractParty', { model: DeployedContract, paramName, from });

router.get('/', verifyToken, onNamedContract('query', 'contract_id'),
  OracleVerificationController.getOracleVerificationsByContract);

router.post('/', verifyToken, onNamedContract('body', 'deployed_contract_id'),
  OracleVerificationController.createOracleVerification);

router.get('/latest/:contract_id', verifyToken, onNamedContract('params', 'contract_id'),
  OracleVerificationController.getLatestOracleVerifications);

module.exports = router;
