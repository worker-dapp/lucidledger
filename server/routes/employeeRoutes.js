const express = require('express');
const EmployeeController = require('../controllers/employeeController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Employee routes
//
// There is deliberately no read route here. The list, by-id, by-email, by-wallet and
// by-phone lookups that used to live here were gated by verifyToken alone, so any
// authenticated user could enumerate or fetch any worker's profile — name, address,
// phone, email (GHSA-whmf-p32v-hjrg / #151). Every caller of them was asking "find me",
// which is what GET /api/profile-status answers, resolving off the verified JWT subject.
// A caller has no legitimate reason to name a profile other than its own, so the route
// that would let it do so does not exist.
router.post('/', verifyToken, EmployeeController.createEmployee);
router.put('/:id', verifyToken, EmployeeController.updateEmployee);

module.exports = router;
