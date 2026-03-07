const express = require('express');
const ReportController = require('../controllers/reportController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/overview',             verifyToken, ReportController.getComplianceOverview);
router.get('/workforce-summary',    verifyToken, ReportController.exportWorkforceSummary);
router.get('/payment-history',      verifyToken, ReportController.exportPaymentHistory);
router.get('/oracle-verifications', verifyToken, ReportController.exportOracleVerifications);

module.exports = router;
