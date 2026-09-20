const express = require('express');
const ReportController = require('../controllers/reportController');
const { verifyToken } = require('../middleware/authMiddleware');
const { declarePolicy } = require('../middleware/authorize');

const router = express.Router();

router.get('/overview',             verifyToken, declarePolicy('scopedList'), ReportController.getComplianceOverview);
router.get('/workforce-summary',    verifyToken, declarePolicy('scopedList'), ReportController.exportWorkforceSummary);
router.get('/payment-history',      verifyToken, declarePolicy('scopedList'), ReportController.exportPaymentHistory);
router.get('/oracle-verifications', verifyToken, declarePolicy('scopedList'), ReportController.exportOracleVerifications);
router.get('/dispute-report',       verifyToken, declarePolicy('scopedList'), ReportController.exportDisputeReport);

module.exports = router;
