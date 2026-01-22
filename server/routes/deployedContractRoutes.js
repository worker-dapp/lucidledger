const express = require('express');
const DeployedContractController = require('../controllers/deployedContractController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// Deployed contract routes
router.get('/employee/:employee_id', verifyToken, DeployedContractController.getDeployedContractsByEmployee);
router.get('/disputed', verifyToken, verifyAdmin, DeployedContractController.getDisputedContractsForAdmin);
router.get('/mediator/:mediatorId/disputed', verifyToken, DeployedContractController.getDisputedContractsByMediator);
router.get('/', verifyToken, DeployedContractController.getDeployedContractsByEmployer);
router.post('/', verifyToken, DeployedContractController.createDeployedContract);
router.patch('/:id/mediator', verifyToken, verifyAdmin, DeployedContractController.assignMediatorToDeployedContract);
router.patch('/:id/status', verifyToken, DeployedContractController.updateDeployedContractStatus);
router.put('/:id', verifyToken, DeployedContractController.updateDeployedContract);
router.get('/:id', verifyToken, DeployedContractController.getDeployedContractById);

module.exports = router;
