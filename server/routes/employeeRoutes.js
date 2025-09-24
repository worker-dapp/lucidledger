const express = require('express');
const EmployeeController = require('../controllers/employeeController');

const router = express.Router();

// Employee routes
router.post('/', EmployeeController.createEmployee);
router.get('/', EmployeeController.getAllEmployees);
router.get('/:id', EmployeeController.getEmployeeById);
router.get('/email/:email', EmployeeController.getEmployeeByEmail);
router.get('/wallet/:wallet_address', EmployeeController.getEmployeeByWallet);
router.put('/:id', EmployeeController.updateEmployee);

module.exports = router;
