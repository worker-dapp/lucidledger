const { Mediator } = require('../models');
const { Op } = require('sequelize');

/**
 * Checks if the given email is an admin email.
 * Admin emails are configured via ADMIN_EMAILS environment variable.
 */
const isAdminEmail = (email) => {
  const adminEmails = process.env.ADMIN_EMAILS;
  if (!adminEmails || !email) {
    return false;
  }

  const adminList = adminEmails.split(',').map((item) => item.trim().toLowerCase());
  return adminList.includes(email.toLowerCase());
};

const pickAllowedFields = (payload, allowedFields) => {
  return Object.keys(payload).reduce((acc, key) => {
    if (allowedFields.includes(key)) {
      acc[key] = payload[key];
    }
    return acc;
  }, {});
};

class MediatorController {
  // Get all mediators (admin only)
  static async getAllMediators(req, res) {
    try {
      const mediators = await Mediator.findAll({
        order: [['created_at', 'DESC']]
      });
      res.status(200).json({
        success: true,
        data: mediators,
        count: mediators.length
      });
    } catch (error) {
      console.error('Error fetching mediators:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching mediators',
        error: error.message
      });
    }
  }

  // Get active mediators with wallet addresses (for contract deployment)
  static async getActiveMediators(req, res) {
    try {
      const mediators = await Mediator.findAll({
        where: {
          status: 'active',
          wallet_address: { [Op.ne]: null }
        },
        attributes: ['id', 'email', 'first_name', 'last_name', 'wallet_address'],
        order: [['created_at', 'ASC']]
      });

      res.status(200).json({
        success: true,
        data: mediators,
        count: mediators.length
      });
    } catch (error) {
      console.error('Error fetching active mediators:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching active mediators',
        error: error.message
      });
    }
  }

  // Create a new mediator (admin only)
  static async createMediator(req, res) {
    try {
      const { email, phone_number, first_name, last_name } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required'
        });
      }

      // Check if mediator already exists
      const existing = await Mediator.findOne({ where: { email: email.toLowerCase() } });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'A mediator with this email already exists'
        });
      }

      const mediator = await Mediator.create({
        email: email.toLowerCase(),
        phone_number,
        first_name,
        last_name,
        status: 'active'
      });

      res.status(201).json({
        success: true,
        data: mediator,
        message: 'Mediator created successfully'
      });
    } catch (error) {
      console.error('Error creating mediator:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating mediator',
        error: error.message
      });
    }
  }

  // Update mediator (admin only)
  static async updateMediator(req, res) {
    try {
      const { id } = req.params;

      const mediator = await Mediator.findByPk(id);
      if (!mediator) {
        return res.status(404).json({
          success: false,
          message: 'Mediator not found'
        });
      }

      // Whitelist allowed update fields to prevent mass assignment
      const allowedFields = ['email', 'phone_number', 'first_name', 'last_name', 'status', 'wallet_address'];
      const updates = pickAllowedFields(req.body, allowedFields);

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid fields provided for update'
        });
      }

      // Normalize email if being updated
      if (updates.email) {
        updates.email = updates.email.toLowerCase();
      }

      await mediator.update(updates);

      res.status(200).json({
        success: true,
        data: mediator,
        message: 'Mediator updated successfully'
      });
    } catch (error) {
      console.error('Error updating mediator:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating mediator',
        error: error.message
      });
    }
  }

  // Delete mediator (admin only)
  static async deleteMediator(req, res) {
    try {
      const { id } = req.params;

      const mediator = await Mediator.findByPk(id);
      if (!mediator) {
        return res.status(404).json({
          success: false,
          message: 'Mediator not found'
        });
      }

      await mediator.destroy();

      res.status(200).json({
        success: true,
        message: 'Mediator deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting mediator:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting mediator',
        error: error.message
      });
    }
  }

  // Check if email is an approved mediator (for MediatorResolution page)
  static async checkMediatorByEmail(req, res) {
    try {
      const { email } = req.params;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required'
        });
      }

      const mediator = await Mediator.findOne({
        where: {
          email: email.toLowerCase(),
          status: 'active'
        },
        attributes: ['id', 'email', 'first_name', 'last_name', 'wallet_address', 'status']
      });

      if (!mediator) {
        return res.status(404).json({
          success: false,
          isMediator: false,
          message: 'Not an approved mediator'
        });
      }

      res.status(200).json({
        success: true,
        isMediator: true,
        data: mediator
      });
    } catch (error) {
      console.error('Error checking mediator:', error);
      res.status(500).json({
        success: false,
        message: 'Error checking mediator status',
        error: error.message
      });
    }
  }

  // Update mediator's wallet address (called after first login)
  // Authorization: Only the mediator themselves or an admin can update
  static async updateMediatorWallet(req, res) {
    try {
      const { email } = req.params;
      const { wallet_address } = req.body;

      if (!wallet_address) {
        return res.status(400).json({
          success: false,
          message: 'Wallet address is required'
        });
      }

      // Authorization check: email is set by verifyToken middleware via Privy API
      const userEmail = req.user?.email;
      if (!userEmail) {
        return res.status(403).json({
          success: false,
          message: 'Unable to verify user identity'
        });
      }

      // Non-admins can only update their own wallet address
      if (!isAdminEmail(userEmail) && userEmail.toLowerCase() !== email.toLowerCase()) {
        return res.status(403).json({
          success: false,
          message: 'You can only update your own wallet address'
        });
      }

      const mediator = await Mediator.findOne({
        where: { email: email.toLowerCase() }
      });

      if (!mediator) {
        return res.status(404).json({
          success: false,
          message: 'Mediator not found'
        });
      }

      await mediator.update({ wallet_address });

      res.status(200).json({
        success: true,
        data: mediator,
        message: 'Wallet address updated successfully'
      });
    } catch (error) {
      console.error('Error updating mediator wallet:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating wallet address',
        error: error.message
      });
    }
  }
}

module.exports = MediatorController;
