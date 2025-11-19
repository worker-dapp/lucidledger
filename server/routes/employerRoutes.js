const express = require('express');
const EmployerController = require('../controllers/employerController');
const verifyToken = require('../middleware/authMiddleware');

const router = express.Router();

// Employer routes
router.post('/', verifyToken, EmployerController.createEmployer);
router.get('/', verifyToken, EmployerController.getAllEmployers);
router.get('/:id', verifyToken, EmployerController.getEmployerById);
router.get('/email/:email', verifyToken, EmployerController.getEmployerByEmail);
router.get('/wallet/:wallet_address', verifyToken, EmployerController.getEmployerByWallet);
router.put('/:id', verifyToken, EmployerController.updateEmployer);

module.exports = router;
