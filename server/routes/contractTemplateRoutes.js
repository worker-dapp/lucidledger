const express = require('express');
const ContractTemplateController = require('../controllers/contractTemplateController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Contract template routes - All protected (employer-only)
router.post('/', verifyToken, ContractTemplateController.createTemplate);
router.get('/', verifyToken, ContractTemplateController.getTemplatesByEmployer);
router.get('/:id', verifyToken, ContractTemplateController.getTemplateById);
router.put('/:id', verifyToken, ContractTemplateController.updateTemplate);
router.delete('/:id', verifyToken, ContractTemplateController.deleteTemplate);
router.post('/:id/use', verifyToken, ContractTemplateController.incrementUsage);

module.exports = router;
