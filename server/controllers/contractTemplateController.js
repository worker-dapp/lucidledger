const { ContractTemplate } = require('../models');
const { scopeToCaller } = require('../middleware/authorize');
const { pickAllowedFields } = require('../utils/fields');

// Exactly the fields a client may write. employer_id is absent by design: ownership is
// assigned from the verified caller at creation and never changes. id, usage_count and
// last_used_at are server-managed — usage_count is incremented by its own endpoint, and
// letting a client set it would make the "most used template" ordering a client opinion.
const ALLOWED_TEMPLATE_FIELDS = [
  'name', 'description', 'job_type', 'location_type', 'base_salary', 'currency',
  'pay_frequency', 'additional_compensation', 'employee_benefits', 'selected_oracles',
  'responsibilities', 'skills'
];

class ContractTemplateController {
  // Create a new contract template
  // Create a template owned by the calling employer.
  //
  // employer_id comes from the verified caller, not from the body: previously the client
  // chose it, so a caller could create templates into another employer's library (#152).
  static async createTemplate(req, res) {
    try {
      const scope = await scopeToCaller(req, { allowAdmin: false });
      if (!scope) {
        return res.status(403).json({ success: false, message: 'Employer profile not found' });
      }

      const template = await ContractTemplate.create({
        ...pickAllowedFields(req.body, ALLOWED_TEMPLATE_FIELDS),
        employer_id: scope.employer_id
      });
      res.status(201).json({
        success: true,
        data: template,
        message: 'Contract template created successfully'
      });
    } catch (error) {
      console.error('Error creating contract template:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating contract template',
        error: error.message
      });
    }
  }

  // Get all templates belonging to the calling employer.
  //
  // Exemplar conversion (#153 PR A) for the list mechanism. This used to read
  // req.query.employer_id and use it directly as the where clause, so any authenticated
  // caller could list any employer's templates by changing one number in the URL. The
  // filter is now derived from the verified caller and req.query is not consulted.
  static async getTemplatesByEmployer(req, res) {
    try {
      const scope = await scopeToCaller(req);
      if (!scope) {
        // Not an employer (and not an admin). There is no set of templates to return.
        return res.status(403).json({
          success: false,
          message: 'Employer profile not found'
        });
      }

      const templates = await ContractTemplate.findAll({
        where: { ...scope },
        order: [['created_at', 'DESC']]
      });

      res.status(200).json({
        success: true,
        data: templates,
        count: templates.length
      });
    } catch (error) {
      console.error('Error fetching templates:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching templates',
        error: error.message
      });
    }
  }

  // Get a single template by ID.
  // authorize('ownedByEmployer') loaded it and proved the caller owns it.
  static async getTemplateById(req, res) {
    try {
      const template = req.resource;

      res.status(200).json({
        success: true,
        data: template
      });
    } catch (error) {
      console.error('Error fetching template:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching template',
        error: error.message
      });
    }
  }

  // Update a template.
  //
  // The check this replaced compared template.employer_id against req.body.employer_id —
  // a value the caller supplies, so sending the true owner id passed it and omitting the
  // field skipped the check entirely. Ownership is now established by the route guard, and
  // the payload is allowlisted so employer_id cannot be written at all.
  static async updateTemplate(req, res) {
    try {
      const template = req.resource;

      await template.update(pickAllowedFields(req.body, ALLOWED_TEMPLATE_FIELDS));

      res.status(200).json({
        success: true,
        data: template,
        message: 'Template updated successfully'
      });
    } catch (error) {
      console.error('Error updating template:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating template',
        error: error.message
      });
    }
  }

  // Delete a template. Ownership proved by the route guard.
  //
  // This had no ownership check of any kind: any authenticated caller could delete any
  // employer's template by id (#152).
  static async deleteTemplate(req, res) {
    try {
      await req.resource.destroy();

      res.status(200).json({
        success: true,
        message: 'Template deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting template:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting template',
        error: error.message
      });
    }
  }

  // Increment usage count when template is used. Ownership proved by the route guard.
  static async incrementUsage(req, res) {
    try {
      const template = req.resource;

      await template.update({
        usage_count: template.usage_count + 1,
        last_used_at: new Date()
      });

      res.status(200).json({
        success: true,
        data: template,
        message: 'Template usage updated'
      });
    } catch (error) {
      console.error('Error updating template usage:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating template usage',
        error: error.message
      });
    }
  }
}

module.exports = ContractTemplateController;
