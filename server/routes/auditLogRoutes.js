const express = require('express');
const { getAuditLog } = require('../controllers/auditLogController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', verifyToken, getAuditLog);

module.exports = router;
