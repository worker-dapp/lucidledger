const express = require('express');
const ContractTemplateController = require('../controllers/contractTemplateController');
const { ContractTemplate } = require('../models');
const { verifyToken } = require('../middleware/authMiddleware');
const { authorize, declarePolicy } = require('../middleware/authorize');

const router = express.Router();

// Contract templates are employer-owned. Every route here is either scoped to the caller,
// assigned to the caller, or guarded against the record's owner — none of them accept an
// employer id from the client (#152, GHSA-9vpg).

// The record does not exist yet; the handler assigns employer_id from the verified caller.
router.post('/', verifyToken, declarePolicy('ownerFromCaller'),
  ContractTemplateController.createTemplate);

// A list has no record to guard; the handler derives the filter via scopeToCaller().
router.get('/', verifyToken, declarePolicy('scopedList'),
  ContractTemplateController.getTemplatesByEmployer);

router.get('/:id', verifyToken,
  authorize('ownedByEmployer', { model: ContractTemplate }),
  ContractTemplateController.getTemplateById);

router.put('/:id', verifyToken,
  authorize('ownedByEmployer', { model: ContractTemplate }),
  ContractTemplateController.updateTemplate);

router.delete('/:id', verifyToken,
  authorize('ownedByEmployer', { model: ContractTemplate }),
  ContractTemplateController.deleteTemplate);

router.post('/:id/use', verifyToken,
  authorize('ownedByEmployer', { model: ContractTemplate }),
  ContractTemplateController.incrementUsage);

module.exports = router;
