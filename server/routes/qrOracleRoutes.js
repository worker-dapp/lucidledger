const express = require('express');
const router = express.Router();
const { verifyToken, requireApprovedEmployer, kioskAuth } = require('../middleware/authMiddleware');
const QrOracleController = require('../controllers/qrOracleController');

// Worker: generate a QR token for an active contract
router.post('/qr-tokens', verifyToken, QrOracleController.generateToken);

// Kiosk: submit a scan event (kiosk device token auth, not Privy JWT)
router.post('/presence-events', kioskAuth, QrOracleController.submitPresenceEvent);

// Worker or employer: fetch presence event history for a contract
router.get('/presence-events', verifyToken, QrOracleController.getPresenceEvents);

// Employer: kiosk device management
router.post('/kiosk-devices', verifyToken, requireApprovedEmployer, QrOracleController.registerKiosk);
router.get('/kiosk-devices', verifyToken, requireApprovedEmployer, QrOracleController.getKiosks);
router.patch('/kiosk-devices/:id/suspend', verifyToken, requireApprovedEmployer, QrOracleController.suspendKiosk);
router.post('/kiosk-devices/:id/regenerate-token', verifyToken, requireApprovedEmployer, QrOracleController.regenerateKioskToken);

module.exports = router;
