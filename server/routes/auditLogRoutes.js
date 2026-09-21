const express = require('express');
const { getAuditLog } = require('../controllers/auditLogController');
const { verifyToken } = require('../middleware/authMiddleware');
const { declarePolicy } = require('../middleware/authorize');

const router = express.Router();

router.get('/', verifyToken, declarePolicy('scopedList'), getAuditLog);

module.exports = router;
