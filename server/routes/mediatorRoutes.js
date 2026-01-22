const express = require('express');
const MediatorController = require('../controllers/mediatorController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// Public route - check if email is an approved mediator
// Used by MediatorResolution page to verify access
router.get('/check/:email', verifyToken, MediatorController.checkMediatorByEmail);

// Get active mediators with wallet addresses (for contract deployment)
router.get('/active', verifyToken, MediatorController.getActiveMediators);

// Update mediator's wallet address after first login
router.put('/wallet/:email', verifyToken, MediatorController.updateMediatorWallet);

// Admin-only routes for mediator management
router.get('/', verifyToken, verifyAdmin, MediatorController.getAllMediators);
router.post('/', verifyToken, verifyAdmin, MediatorController.createMediator);
router.put('/:id', verifyToken, verifyAdmin, MediatorController.updateMediator);
router.delete('/:id', verifyToken, verifyAdmin, MediatorController.deleteMediator);

module.exports = router;
