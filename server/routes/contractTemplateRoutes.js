const express = require('express');
const ContractTemplateController = require('../controllers/contractTemplateController');
const { verifyToken } = require('../middleware/authMiddleware');
const { declarePolicy } = require('../middleware/authorize');

const router = express.Router();

// Contract template routes - All protected (employer-only)
router.post('/', verifyToken, ContractTemplateController.createTemplate);
// Exemplar conversion (#153 PR A) for the list mechanism. A list route cannot be
// guarded — there is no record to load — so the scoping happens in the handler via
// scopeToCaller() and the route declares that it does.
router.get('/', verifyToken, declarePolicy('scopedList'),
  ContractTemplateController.getTemplatesByEmployer);
router.get('/:id', verifyToken, ContractTemplateController.getTemplateById);
router.put('/:id', verifyToken, ContractTemplateController.updateTemplate);
router.delete('/:id', verifyToken, ContractTemplateController.deleteTemplate);
router.post('/:id/use', verifyToken, ContractTemplateController.incrementUsage);

module.exports = router;
