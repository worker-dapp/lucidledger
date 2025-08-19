import express from 'express';
import { signup, login, getMe, signupValidation, loginValidation } from '../controllers/authController.js';
import { upsertProfile, validateProfileUpdate } from '../controllers/profileController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/auth/signup
// @desc    Register a new user
// @access  Public
router.post('/signup', signupValidation, signup);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', loginValidation, login);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, getMe);

// @route   PUT /api/auth/profile
// @desc    Create or update profile for current user
// @access  Private
router.put('/profile', protect, validateProfileUpdate, upsertProfile);

export default router; 