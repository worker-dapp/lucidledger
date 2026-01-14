const { JobPosting, ContractTemplate, Employer } = require('../models');
const { Op } = require('sequelize');

class JobPostingController {
  // Create a new job posting (optionally from template)
  static async createJobPosting(req, res) {
    try {
      const { template_id, employer_id, ...jobPostingData } = req.body;

      let postingData = { ...jobPostingData, employer_id };

      // If created from template, copy template data and increment usage
      if (template_id) {
        const template = await ContractTemplate.findByPk(template_id);

        if (!template) {
          return res.status(404).json({
            success: false,
            message: 'Template not found'
          });
        }

        // Verify template belongs to this employer (convert to string for comparison since Postgres bigint returns string)
        if (String(template.employer_id) !== String(employer_id)) {
          return res.status(403).json({
            success: false,
            message: 'Template does not belong to this employer'
          });
        }

        // Copy template data (but allow overrides from request body)
        postingData = {
          employer_id,
          template_id,
          title: jobPostingData.title || template.name,
          job_type: jobPostingData.job_type || template.job_type,
          location_type: jobPostingData.location_type || template.location_type,
          salary: jobPostingData.salary !== undefined ? jobPostingData.salary : template.base_salary,
          currency: jobPostingData.currency || template.currency,
          pay_frequency: jobPostingData.pay_frequency || template.pay_frequency,
          additional_compensation: jobPostingData.additional_compensation || template.additional_compensation,
          employee_benefits: jobPostingData.employee_benefits || template.employee_benefits,
          selected_oracles: jobPostingData.selected_oracles || template.selected_oracles,
          responsibilities: jobPostingData.responsibilities || template.responsibilities,
          skills: jobPostingData.skills || template.skills,
          ...jobPostingData
        };

        // Increment template usage
        await template.update({
          usage_count: template.usage_count + 1,
          last_used_at: new Date()
        });
      }

      // Get employer info to populate company fields
      const employer = await Employer.findByPk(employer_id);
      if (employer) {
        postingData.company_name = postingData.company_name || employer.company_name;
        postingData.company_description = postingData.company_description || employer.company_description;
      }

      const jobPosting = await JobPosting.create(postingData);

      res.status(201).json({
        success: true,
        data: jobPosting,
        message: 'Job posting created successfully'
      });
    } catch (error) {
      console.error('Error creating job posting:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating job posting',
        error: error.message
      });
    }
  }

  // Get all job postings for an employer
  static async getJobPostingsByEmployer(req, res) {
    try {
      const { employer_id, status } = req.query;

      if (!employer_id) {
        return res.status(400).json({
          success: false,
          message: 'employer_id is required'
        });
      }

      const whereClause = { employer_id };
      if (status) {
        whereClause.status = status;
      }

      const jobPostings = await JobPosting.findAll({
        where: whereClause,
        order: [['created_at', 'DESC']]
      });

      res.status(200).json({
        success: true,
        data: jobPostings,
        count: jobPostings.length
      });
    } catch (error) {
      console.error('Error fetching job postings:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching job postings',
        error: error.message
      });
    }
  }

  // Get a single job posting by ID
  static async getJobPostingById(req, res) {
    try {
      const { id } = req.params;

      const jobPosting = await JobPosting.findByPk(id);

      if (!jobPosting) {
        return res.status(404).json({
          success: false,
          message: 'Job posting not found'
        });
      }

      res.status(200).json({
        success: true,
        data: jobPosting
      });
    } catch (error) {
      console.error('Error fetching job posting:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching job posting',
        error: error.message
      });
    }
  }

  // Update a job posting
  static async updateJobPosting(req, res) {
    try {
      const { id } = req.params;
      const jobPosting = await JobPosting.findByPk(id);

      if (!jobPosting) {
        return res.status(404).json({
          success: false,
          message: 'Job posting not found'
        });
      }

      // Verify employer owns this posting
      if (req.body.employer_id && jobPosting.employer_id !== req.body.employer_id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this job posting'
        });
      }

      await jobPosting.update(req.body);

      res.status(200).json({
        success: true,
        data: jobPosting,
        message: 'Job posting updated successfully'
      });
    } catch (error) {
      console.error('Error updating job posting:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating job posting',
        error: error.message
      });
    }
  }

  // Delete a job posting
  static async deleteJobPosting(req, res) {
    try {
      const { id } = req.params;
      const jobPosting = await JobPosting.findByPk(id);

      if (!jobPosting) {
        return res.status(404).json({
          success: false,
          message: 'Job posting not found'
        });
      }

      await jobPosting.destroy();

      res.status(200).json({
        success: true,
        message: 'Job posting deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting job posting:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting job posting',
        error: error.message
      });
    }
  }

  // Close a job posting (no longer accepting applications)
  static async closeJobPosting(req, res) {
    try {
      const { id } = req.params;
      const jobPosting = await JobPosting.findByPk(id);

      if (!jobPosting) {
        return res.status(404).json({
          success: false,
          message: 'Job posting not found'
        });
      }

      await jobPosting.update({ status: 'closed' });

      res.status(200).json({
        success: true,
        data: jobPosting,
        message: 'Job posting closed successfully'
      });
    } catch (error) {
      console.error('Error closing job posting:', error);
      res.status(500).json({
        success: false,
        message: 'Error closing job posting',
        error: error.message
      });
    }
  }

  // Activate a job posting (make it live)
  static async activateJobPosting(req, res) {
    try {
      const { id } = req.params;
      const jobPosting = await JobPosting.findByPk(id);

      if (!jobPosting) {
        return res.status(404).json({
          success: false,
          message: 'Job posting not found'
        });
      }

      await jobPosting.update({ status: 'active' });

      res.status(200).json({
        success: true,
        data: jobPosting,
        message: 'Job posting activated successfully'
      });
    } catch (error) {
      console.error('Error activating job posting:', error);
      res.status(500).json({
        success: false,
        message: 'Error activating job posting',
        error: error.message
      });
    }
  }

  // Get active job postings for employees (with saved/applied status)
  static async getActiveJobPostings(req, res) {
    try {
      const { employee_id } = req.query;
      const { sequelize } = require('../config/database');

      let jobPostings;

      if (employee_id) {
        // If employee_id provided, include saved/applied status
        jobPostings = await sequelize.query(
          `SELECT jp.*,
                  CASE WHEN sj.id IS NOT NULL THEN true ELSE false END as is_saved,
                  ja.application_status,
                  jp.title as "jobTitle",
                  jp.company_name as "companyName"
           FROM job_postings jp
           LEFT JOIN job_applications ja ON jp.id = ja.job_posting_id AND ja.employee_id = :employeeId
           LEFT JOIN saved_jobs sj ON jp.id = sj.job_posting_id AND sj.employee_id = :employeeId
           WHERE jp.status = 'active'
           ORDER BY jp.created_at DESC`,
          {
            replacements: { employeeId: employee_id },
            type: sequelize.QueryTypes.SELECT
          }
        );
      } else {
        // No employee_id: show all active jobs for public/anonymous users
        jobPostings = await JobPosting.findAll({
          where: {
            status: 'active'
          },
          order: [['created_at', 'DESC']]
        });

        // Add field mappings for consistency
        jobPostings = jobPostings.map(posting => {
          const postingData = posting.toJSON();
          return {
            ...postingData,
            jobTitle: postingData.title,
            companyName: postingData.company_name
          };
        });
      }

      res.status(200).json({
        success: true,
        data: jobPostings,
        count: jobPostings.length
      });
    } catch (error) {
      console.error('Error fetching active job postings:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching active job postings',
        error: error.message
      });
    }
  }
}

module.exports = JobPostingController;
