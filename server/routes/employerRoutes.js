const express = require('express');
const EmployerController = require('../controllers/employerController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Employer routes
//
// As with employeeRoutes: the read routes are gone. See the note there — the same
// verifyToken-only list and lookup endpoints exposed every employer profile to any
// authenticated caller. Self-lookup is GET /api/profile-status; admin listing is
// GET /api/admin/employers, which is gated by verifyAdmin.
router.post('/', verifyToken, EmployerController.createEmployer);
router.put('/:id', verifyToken, EmployerController.updateEmployer);

module.exports = router;
