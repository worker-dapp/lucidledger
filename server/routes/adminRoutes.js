const express = require('express');
const router = express.Router();
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

// GET /api/admin/check — verify caller is an admin
router.get('/check', verifyToken, verifyAdmin, (req, res) => {
  res.json({ success: true, isAdmin: true, email: req.adminEmail });
});

module.exports = router;
