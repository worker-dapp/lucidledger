const express = require('express');
const router = express.Router();
const AdminEmployerController = require('../controllers/adminEmployerController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

// All routes require admin authentication
router.use(verifyToken);
router.use(verifyAdmin);

// GET /api/admin/employers/pending - Get pending employers
router.get('/pending', AdminEmployerController.getPendingEmployers);

// GET /api/admin/employers - Get all employers with optional status filter
router.get('/', AdminEmployerController.getAllEmployersForAdmin);

// POST /api/admin/employers/:id/approve - Approve an employer
router.post('/:id/approve', AdminEmployerController.approveEmployer);

// POST /api/admin/employers/:id/reject - Reject an employer
router.post('/:id/reject', AdminEmployerController.rejectEmployer);

module.exports = router;
