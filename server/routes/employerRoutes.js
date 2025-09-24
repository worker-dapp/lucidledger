const express = require('express');
const EmployerController = require('../controllers/employerController');

const router = express.Router();

// Employer routes
router.post('/', EmployerController.createEmployer);
router.get('/', EmployerController.getAllEmployers);
router.get('/:id', EmployerController.getEmployerById);
router.get('/email/:email', EmployerController.getEmployerByEmail);
router.get('/wallet/:wallet_address', EmployerController.getEmployerByWallet);
router.put('/:id', EmployerController.updateEmployer);

module.exports = router;
