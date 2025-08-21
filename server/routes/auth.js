import express from 'express';
import { getMe } from '../controllers/authController.js';
import { upsertProfile, validateProfileUpdate } from '../controllers/profileController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Signup and login routes removed; authentication is handled by Dynamic.

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, getMe);

// @route   PUT /api/auth/profile
// @desc    Create or update profile for current user
// @access  Private
router.put('/profile', protect, validateProfileUpdate, upsertProfile);

export default router; 