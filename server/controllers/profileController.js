import { body, validationResult } from 'express-validator';
import Profile from '../models/Profile.js';

export const validateProfileUpdate = [
  body('email').optional().isEmail().withMessage('Invalid email'),
  body('role').optional().isIn(['user', 'employer', 'employee', 'admin']).withMessage('Invalid role'),
  body('first_name').optional().isString().trim(),
  body('last_name').optional().isString().trim(),
  body('phone_number').optional().isString().trim(),
  body('country_code').optional().isString().trim(),
  body('country').optional().isString().trim(),
  body('zip_code').optional().isString().trim(),
  body('state').optional().isString().trim(),
  body('city').optional().isString().trim(),
];

export const upsertProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() });
    }

    const userId = req.user.id;
    const data = {
      email: req.body.email || req.user.email,
      role: req.body.role || req.user.role,
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      phone_number: req.body.phone_number,
      country_code: req.body.country_code,
      country: req.body.country,
      zip_code: req.body.zip_code,
      state: req.body.state,
      city: req.body.city,
    };

    const profile = await Profile.upsertByUserId(userId, data);
    return res.json({ success: true, data: profile });
  } catch (error) {
    console.error('Profile upsert error:', error);
    return res.status(500).json({ success: false, error: 'Server error updating profile' });
  }
};


