const express = require('express');
const DisputeHistoryController = require('../controllers/disputeHistoryController');
const { DeployedContract, DisputeHistory } = require('../models');
const { verifyToken } = require('../middleware/authMiddleware');
const { authorize, declarePolicy } = require('../middleware/authorize');

const router = express.Router();

// Disputes belong to a deployed contract and carry no party columns of their own, so the
// record routes are guarded against that contract (#152, GHSA-9vpg). None of them had any
// ownership check before: any authenticated caller could raise a dispute in another
// party's name, read any employer's dispute history, or resolve any dispute outright.

// Raising a dispute names its contract in the body. Which party raised it is then derived
// from that contract, not declared by the caller.
router.post('/', verifyToken,
  authorize('contractParty', {
    model: DeployedContract, paramName: 'deployed_contract_id', from: 'body'
  }),
  DisputeHistoryController.createDispute);

router.get('/employer', verifyToken, declarePolicy('scopedList'),
  DisputeHistoryController.getDisputesByEmployer);

router.get('/contract/:contractId', verifyToken,
  authorize('contractParty', { model: DeployedContract, paramName: 'contractId' }),
  DisputeHistoryController.getDisputesByContract);

// The guard admits any party to the contract; the handler narrows resolution to the
// assigned mediator, because raising a dispute and deciding it are different acts.
router.put('/:id', verifyToken,
  authorize('contractParty', {
    model: DisputeHistory,
    via: { model: DeployedContract, key: 'deployed_contract_id' }
  }),
  DisputeHistoryController.updateDispute);

module.exports = router;
