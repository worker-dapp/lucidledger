const express = require('express');
const router = express.Router();
const { verifyToken, requireApprovedEmployer, kioskAuth } = require('../middleware/authMiddleware');
const NfcOracleController = require('../controllers/nfcOracleController');

// Employer: NFC badge management
router.post('/nfc-badges', verifyToken, requireApprovedEmployer, NfcOracleController.registerBadge);
router.get('/nfc-badges', verifyToken, requireApprovedEmployer, NfcOracleController.listBadges);
router.patch('/nfc-badges/:id/assign', verifyToken, requireApprovedEmployer, NfcOracleController.assignBadge);
router.patch('/nfc-badges/:id/suspend', verifyToken, requireApprovedEmployer, NfcOracleController.suspendBadge);

// Kiosk: submit an NFC badge scan (kiosk device token auth, not Privy JWT)
router.post('/nfc-scans', kioskAuth, NfcOracleController.submitNfcScan);

module.exports = router;
