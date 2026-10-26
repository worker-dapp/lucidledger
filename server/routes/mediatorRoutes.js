const express = require('express');
const MediatorController = require('../controllers/mediatorController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');
const { declarePolicy } = require('../middleware/authorize');

const router = express.Router();

// Is the caller an approved mediator? Used by MediatorResolution page to verify access
router.get('/me', verifyToken,
  declarePolicy('handlerEnforced', { reason: 'returns only the caller\'s own record, resolved by verified email' }),
  MediatorController.getMyMediatorProfile);

// Update mediator's wallet address after first login
router.put('/wallet/:email', verifyToken, MediatorController.updateMediatorWallet);

// Admin-only routes for mediator management
router.get('/', verifyToken, verifyAdmin, MediatorController.getAllMediators);
router.post('/', verifyToken, verifyAdmin, MediatorController.createMediator);
router.put('/:id', verifyToken, verifyAdmin, MediatorController.updateMediator);
router.delete('/:id', verifyToken, verifyAdmin, MediatorController.deleteMediator);

module.exports = router;
