const express = require('express');
const EmployeeController = require('../controllers/employeeController');
const verifyToken = require('../middleware/authMiddleware');

const router = express.Router();

// Employee routes
router.post('/', verifyToken, EmployeeController.createEmployee);
router.get('/', verifyToken, EmployeeController.getAllEmployees);
router.get('/:id', verifyToken, EmployeeController.getEmployeeById);
router.get('/email/:email', verifyToken, EmployeeController.getEmployeeByEmail);
router.get('/wallet/:wallet_address', verifyToken, EmployeeController.getEmployeeByWallet);
router.put('/:id', verifyToken, EmployeeController.updateEmployee);

module.exports = router;
