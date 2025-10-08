const Job = require('../models/Job');
const JobApplication = require('../models/JobApplication');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

class JobController {
  // Create a new job
  static async createJob(req, res) {
    try {
      const job = await Job.create(req.body);
      res.status(201).json({
        success: true,
        data: job,
        message: 'Job created successfully'
      });
    } catch (error) {
      console.error('Error creating job:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating job',
        error: error.message
      });
    }
  }

  // Get all jobs
  static async getAllJobs(req, res) {
    try {
      const { employee_id } = req.query;
      
      let jobs;
      
      if (employee_id) {
        // If employee_id is provided, include application status
        jobs = await sequelize.query(
          `SELECT j.*, 
                  ja.is_saved, 
                  ja.application_status,
                  j.title as "jobTitle",
                  j.company_name as "companyName"
           FROM jobs j
           LEFT JOIN job_applications ja ON j.id = ja.job_id AND ja.employee_id = :employeeId
           ORDER BY j.created_at DESC`,
          {
            replacements: { employeeId: employee_id },
            type: sequelize.QueryTypes.SELECT
          }
        );
      } else {
        // If no employee_id, just get all jobs
        jobs = await Job.findAll({
          order: [['created_at', 'DESC']]
        });
        
        // Add field mappings for consistency
        jobs = jobs.map(job => {
          const jobData = job.toJSON();
          return {
            ...jobData,
            jobTitle: jobData.title,
            companyName: jobData.company_name
          };
        });
      }
      
      res.status(200).json({
        success: true,
        data: jobs,
        count: jobs.length
      });
    } catch (error) {
      console.error('Error fetching jobs:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching jobs',
        error: error.message
      });
    }
  }

  // Get job by ID
  static async getJobById(req, res) {
    try {
      const { id } = req.params;
      const job = await Job.findByPk(id);
      
      if (!job) {
        return res.status(404).json({
          success: false,
          message: 'Job not found'
        });
      }

      res.status(200).json({
        success: true,
        data: job
      });
    } catch (error) {
      console.error('Error fetching job:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching job',
        error: error.message
      });
    }
  }

  // Get jobs by status
  static async getJobsByStatus(req, res) {
    try {
      const { status } = req.params;
      const jobs = await Job.findAll({
        where: { status },
        order: [['created_at', 'DESC']]
      });
      
      res.status(200).json({
        success: true,
        data: jobs,
        count: jobs.length
      });
    } catch (error) {
      console.error('Error fetching jobs by status:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching jobs by status',
        error: error.message
      });
    }
  }

  // Get jobs by company
  static async getJobsByCompany(req, res) {
    try {
      const { company_name } = req.params;
      const jobs = await Job.findAll({
        where: {
          company_name: {
            [Op.iLike]: `%${company_name}%`
          }
        },
        order: [['created_at', 'DESC']]
      });
      
      res.status(200).json({
        success: true,
        data: jobs,
        count: jobs.length
      });
    } catch (error) {
      console.error('Error fetching jobs by company:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching jobs by company',
        error: error.message
      });
    }
  }

  // Update job
  static async updateJob(req, res) {
    try {
      const { id } = req.params;
      const [updatedRowsCount, updatedJob] = await Job.update(req.body, {
        where: { id },
        returning: true
      });
      
      if (updatedRowsCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Job not found'
        });
      }

      res.status(200).json({
        success: true,
        data: updatedJob[0],
        message: 'Job updated successfully'
      });
    } catch (error) {
      console.error('Error updating job:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating job',
        error: error.message
      });
    }
  }

  // Update job status
  static async updateJobStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const [updatedRowsCount, updatedJob] = await Job.update(
        { status },
        {
          where: { id },
          returning: true
        }
      );
      
      if (updatedRowsCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Job not found'
        });
      }

      res.status(200).json({
        success: true,
        data: updatedJob[0],
        message: 'Job status updated successfully'
      });
    } catch (error) {
      console.error('Error updating job status:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating job status',
        error: error.message
      });
    }
  }

}

module.exports = JobController;
