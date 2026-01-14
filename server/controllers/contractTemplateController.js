const { ContractTemplate } = require('../models');
const { Op } = require('sequelize');

class ContractTemplateController {
  // Create a new contract template
  static async createTemplate(req, res) {
    try {
      const template = await ContractTemplate.create(req.body);
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

  // Get all templates for an employer
  static async getTemplatesByEmployer(req, res) {
    try {
      const { employer_id } = req.query;

      if (!employer_id) {
        return res.status(400).json({
          success: false,
          message: 'employer_id is required'
        });
      }

      const templates = await ContractTemplate.findAll({
        where: { employer_id },
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

  // Get a single template by ID
  static async getTemplateById(req, res) {
    try {
      const { id } = req.params;
      const template = await ContractTemplate.findByPk(id);

      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Template not found'
        });
      }

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

  // Update a template
  static async updateTemplate(req, res) {
    try {
      const { id } = req.params;
      const template = await ContractTemplate.findByPk(id);

      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Template not found'
        });
      }

      // Verify employer owns this template
      if (req.body.employer_id && template.employer_id !== req.body.employer_id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this template'
        });
      }

      await template.update(req.body);

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

  // Delete a template
  static async deleteTemplate(req, res) {
    try {
      const { id } = req.params;
      const template = await ContractTemplate.findByPk(id);

      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Template not found'
        });
      }

      await template.destroy();

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

  // Increment usage count when template is used
  static async incrementUsage(req, res) {
    try {
      const { id } = req.params;
      const template = await ContractTemplate.findByPk(id);

      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Template not found'
        });
      }

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
