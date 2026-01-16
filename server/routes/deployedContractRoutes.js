const express = require('express');
const DeployedContractController = require('../controllers/deployedContractController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Deployed contract routes
router.get('/employee/:employee_id', verifyToken, DeployedContractController.getDeployedContractsByEmployee);
router.get('/', verifyToken, DeployedContractController.getDeployedContractsByEmployer);
router.post('/', verifyToken, DeployedContractController.createDeployedContract);
router.patch('/:id/status', verifyToken, DeployedContractController.updateDeployedContractStatus);
router.get('/:id', verifyToken, DeployedContractController.getDeployedContractById);

module.exports = router;
