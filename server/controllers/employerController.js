const { Employer } = require('../models');
const { resolveEmployer } = require('../services/identityService');

const pickAllowedFields = (payload, allowedFields) => {
  return Object.keys(payload).reduce((acc, key) => {
    if (allowedFields.includes(key)) {
      acc[key] = payload[key];
    }
    return acc;
  }, {});
};

// Fields an employer may set on their own profile. Deliberately excludes
// approval_status/approved_at/approved_by/rejection_reason — those are admin-controlled
// via /api/admin/employers/:id/approve|reject, never settable by a self-update.
const ALLOWED_UPDATE_FIELDS = [
  'first_name', 'last_name', 'phone_number', 'email', 'wallet_address',
  'street_address', 'street_address2', 'country', 'state', 'zip_code', 'city',
  'country_code', 'company_name', 'company_description', 'industry',
  'company_size', 'website', 'linkedin'
];

class EmployerController {
  // Create a new employer
  static async createEmployer(req, res) {
    try {
      // Bind the new record to the verified identity.
      // Allowlist the body. Spreading req.body directly let a client set ANY column:
      // approval_status, which is deliberately excluded from the update allowlist, was
      // settable here via the body spread — minting a pre-approved employer and bypassing
      // the admin gate that requireApprovedEmployer protects.
      // auth_subject is applied after the allowlist and is not in it, so it can only ever
      // come from the verified token.
      const employer = await Employer.create({
        ...pickAllowedFields(req.body, ALLOWED_UPDATE_FIELDS),
        auth_subject: req.authSubject
      });
      res.status(201).json({
        success: true,
        data: employer,
        message: 'Employer created successfully'
      });
    } catch (error) {
      console.error('Error creating employer:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating employer',
        error: error.message
      });
    }
  }

  // Get all employers
  static async getAllEmployers(req, res) {
    try {
      const employers = await Employer.findAll({
        order: [['created_at', 'DESC']]
      });
      res.status(200).json({
        success: true,
        data: employers,
        count: employers.length
      });
    } catch (error) {
      console.error('Error fetching employers:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching employers',
        error: error.message
      });
    }
  }

  // Get employer by ID
  static async getEmployerById(req, res) {
    try {
      const { id } = req.params;
      const employer = await Employer.findByPk(id);
      
      if (!employer) {
        return res.status(404).json({
          success: false,
          message: 'Employer not found'
        });
      }

      res.status(200).json({
        success: true,
        data: employer
      });
    } catch (error) {
      console.error('Error fetching employer:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching employer',
        error: error.message
      });
    }
  }

  // Get employer by email
  static async getEmployerByEmail(req, res) {
    try {
      const { email } = req.params;
      const employer = await Employer.findOne({
        where: { email }
      });
      
      if (!employer) {
        return res.status(404).json({
          success: false,
          message: 'Employer not found'
        });
      }

      res.status(200).json({
        success: true,
        data: employer
      });
    } catch (error) {
      console.error('Error fetching employer:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching employer',
        error: error.message
      });
    }
  }

  // Get employer by wallet address
  static async getEmployerByWallet(req, res) {
    try {
      const { wallet_address } = req.params;
      const employer = await Employer.findOne({
        where: { wallet_address }
      });
      
      if (!employer) {
        return res.status(404).json({
          success: false,
          message: 'Employer not found'
        });
      }

      res.status(200).json({
        success: true,
        data: employer
      });
    } catch (error) {
      console.error('Error fetching employer:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching employer',
        error: error.message
      });
    }
  }

  // Get employer by phone number
  static async getEmployerByPhone(req, res) {
    try {
      const { phone_number } = req.params;
      const employer = await Employer.findOne({
        where: { phone_number }
      });
      
      if (!employer) {
        return res.status(404).json({
          success: false,
          message: 'Employer not found'
        });
      }

      res.status(200).json({
        success: true,
        data: employer
      });
    } catch (error) {
      console.error('Error fetching employer:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching employer',
        error: error.message
      });
    }
  }

  // Update employer
  static async updateEmployer(req, res) {
    try {
      const { id } = req.params;

      // First fetch the current employer to check status
      const currentEmployer = await Employer.findByPk(id);
      if (!currentEmployer) {
        return res.status(404).json({
          success: false,
          message: 'Employer not found'
        });
      }

      // Authorize off the verified identity.
      const callingEmployer = await resolveEmployer(req);
      if (!callingEmployer || String(callingEmployer.id) !== String(id)) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to update this employer profile'
        });
      }

      // Prepare update data — allowlisted fields only, approval fields are never client-settable
      let updateData = pickAllowedFields(req.body, ALLOWED_UPDATE_FIELDS);

      // If employer was rejected and is updating their profile, reset to pending for re-review
      if (currentEmployer.approval_status === 'rejected') {
        updateData.approval_status = 'pending';
        updateData.rejection_reason = null;
      }

      const [updatedRowsCount, updatedEmployer] = await Employer.update(updateData, {
        where: { id },
        returning: true
      });

      if (updatedRowsCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Employer not found'
        });
      }

      res.status(200).json({
        success: true,
        data: updatedEmployer[0],
        message: 'Employer updated successfully'
      });
    } catch (error) {
      console.error('Error updating employer:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating employer',
        error: error.message
      });
    }
  }

}

module.exports = EmployerController;
