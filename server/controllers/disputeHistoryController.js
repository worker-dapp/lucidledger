const { DisputeHistory, DeployedContract, Employee, Employer, Mediator, JobPosting } = require('../models');
const { Op } = require('sequelize');

class DisputeHistoryController {
  // Create a dispute record
  static async createDispute(req, res) {
    try {
      const {
        deployed_contract_id,
        raised_by_employee_id,
        raised_by_employer_id,
        raised_by_role,
        reason
      } = req.body;

      if (!deployed_contract_id || !raised_by_role || !reason) {
        return res.status(400).json({
          success: false,
          message: 'deployed_contract_id, raised_by_role, and reason are required'
        });
      }

      if (raised_by_role === 'employee' && !raised_by_employee_id) {
        return res.status(400).json({
          success: false,
          message: 'raised_by_employee_id is required when role is employee'
        });
      }

      if (raised_by_role === 'employer' && !raised_by_employer_id) {
        return res.status(400).json({
          success: false,
          message: 'raised_by_employer_id is required when role is employer'
        });
      }

      const dispute = await DisputeHistory.create({
        deployed_contract_id,
        raised_by_employee_id,
        raised_by_employer_id,
        raised_by_role,
        reason,
        raised_at: new Date()
      });

      res.status(201).json({
        success: true,
        data: dispute,
        message: 'Dispute recorded successfully'
      });
    } catch (error) {
      console.error('Error creating dispute record:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating dispute record',
        error: error.message
      });
    }
  }

  // Get all disputes for an employer (for compliance view)
  static async getDisputesByEmployer(req, res) {
    try {
      const { employerId } = req.params;

      const disputes = await DisputeHistory.findAll({
        include: [
          {
            model: DeployedContract,
            as: 'deployedContract',
            where: { employer_id: employerId },
            include: [
              { model: JobPosting, as: 'jobPosting', attributes: ['id', 'title'] }
            ]
          },
          {
            model: Employee,
            as: 'raisedByEmployee',
            attributes: ['id', 'first_name', 'last_name', 'email']
          },
          {
            model: Employer,
            as: 'raisedByEmployer',
            attributes: ['id', 'company_name']
          },
          {
            model: Mediator,
            as: 'mediator',
            attributes: ['id', 'first_name', 'last_name', 'email']
          }
        ],
        order: [['raised_at', 'DESC']]
      });

      res.status(200).json({
        success: true,
        data: disputes,
        count: disputes.length
      });
    } catch (error) {
      console.error('Error fetching disputes:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching disputes',
        error: error.message
      });
    }
  }

  // Get dispute by contract ID
  static async getDisputesByContract(req, res) {
    try {
      const { contractId } = req.params;

      const disputes = await DisputeHistory.findAll({
        where: { deployed_contract_id: contractId },
        include: [
          {
            model: Employee,
            as: 'raisedByEmployee',
            attributes: ['id', 'first_name', 'last_name', 'email']
          },
          {
            model: Employer,
            as: 'raisedByEmployer',
            attributes: ['id', 'company_name']
          },
          {
            model: Mediator,
            as: 'mediator',
            attributes: ['id', 'first_name', 'last_name', 'email']
          }
        ],
        order: [['raised_at', 'DESC']]
      });

      res.status(200).json({
        success: true,
        data: disputes,
        count: disputes.length
      });
    } catch (error) {
      console.error('Error fetching disputes for contract:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching disputes',
        error: error.message
      });
    }
  }

  // Update dispute (assign mediator, resolve, etc.)
  static async updateDispute(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const dispute = await DisputeHistory.findByPk(id);

      if (!dispute) {
        return res.status(404).json({
          success: false,
          message: 'Dispute not found'
        });
      }

      // If assigning mediator, set the assignment timestamp
      if (updates.mediator_id && !dispute.mediator_id) {
        updates.mediator_assigned_at = new Date();
      }

      // If resolving, set the resolution timestamp
      if (updates.resolution && !dispute.resolved_at) {
        updates.resolved_at = new Date();
      }

      await dispute.update(updates);

      res.status(200).json({
        success: true,
        data: dispute,
        message: 'Dispute updated successfully'
      });
    } catch (error) {
      console.error('Error updating dispute:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating dispute',
        error: error.message
      });
    }
  }
}

module.exports = DisputeHistoryController;
