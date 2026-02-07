const { Employer, JobPosting } = require('../models');
const { Op } = require('sequelize');

class AdminEmployerController {
  // Get all pending employers
  static async getPendingEmployers(req, res) {
    try {
      const employers = await Employer.findAll({
        where: { approval_status: 'pending' },
        order: [['created_at', 'DESC']]
      });

      res.status(200).json({
        success: true,
        data: employers,
        count: employers.length
      });
    } catch (error) {
      console.error('Error fetching pending employers:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching pending employers',
        error: error.message
      });
    }
  }

  // Get all employers with optional status filter and counts
  static async getAllEmployersForAdmin(req, res) {
    try {
      const { status } = req.query;

      // Build where clause
      const whereClause = {};
      if (status && ['pending', 'approved', 'rejected'].includes(status)) {
        whereClause.approval_status = status;
      }

      // Fetch employers
      const employers = await Employer.findAll({
        where: whereClause,
        order: [['created_at', 'DESC']]
      });

      // Get counts for each status
      const counts = await Employer.findAll({
        attributes: [
          'approval_status',
          [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
        ],
        group: ['approval_status']
      });

      const statusCounts = {
        pending: 0,
        approved: 0,
        rejected: 0
      };

      counts.forEach(c => {
        const status = c.getDataValue('approval_status');
        const count = parseInt(c.getDataValue('count'), 10);
        if (statusCounts.hasOwnProperty(status)) {
          statusCounts[status] = count;
        }
      });

      res.status(200).json({
        success: true,
        data: employers,
        count: employers.length,
        statusCounts
      });
    } catch (error) {
      console.error('Error fetching employers for admin:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching employers',
        error: error.message
      });
    }
  }

  // Approve an employer
  static async approveEmployer(req, res) {
    try {
      const { id } = req.params;
      const adminEmail = req.adminEmail || 'admin';

      const employer = await Employer.findByPk(id);

      if (!employer) {
        return res.status(404).json({
          success: false,
          message: 'Employer not found'
        });
      }

      await employer.update({
        approval_status: 'approved',
        approved_at: new Date(),
        approved_by: adminEmail,
        rejection_reason: null
      });

      res.status(200).json({
        success: true,
        data: employer,
        message: 'Employer approved successfully'
      });
    } catch (error) {
      console.error('Error approving employer:', error);
      res.status(500).json({
        success: false,
        message: 'Error approving employer',
        error: error.message
      });
    }
  }

  // Reject an employer
  static async rejectEmployer(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const adminEmail = req.adminEmail || 'admin';

      if (!reason) {
        return res.status(400).json({
          success: false,
          message: 'Rejection reason is required'
        });
      }

      const employer = await Employer.findByPk(id);

      if (!employer) {
        return res.status(404).json({
          success: false,
          message: 'Employer not found'
        });
      }

      // Update employer status
      await employer.update({
        approval_status: 'rejected',
        rejection_reason: reason,
        approved_by: adminEmail
      });

      // Pause all their job postings
      await JobPosting.update(
        { status: 'paused' },
        { where: { employer_id: id } }
      );

      res.status(200).json({
        success: true,
        data: employer,
        message: 'Employer rejected and their job postings have been paused'
      });
    } catch (error) {
      console.error('Error rejecting employer:', error);
      res.status(500).json({
        success: false,
        message: 'Error rejecting employer',
        error: error.message
      });
    }
  }
}

module.exports = AdminEmployerController;
