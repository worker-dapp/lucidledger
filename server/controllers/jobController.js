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
        // If employee_id is provided, include application status and saved status
        // Exclude closed jobs from employee view
        jobs = await sequelize.query(
          `SELECT j.*, 
                  CASE WHEN sj.id IS NOT NULL THEN true ELSE false END as is_saved,
                  ja.application_status,
                  j.title as "jobTitle",
                  j.company_name as "companyName"
           FROM jobs j
           LEFT JOIN job_applications ja ON j.id = ja.job_id AND ja.employee_id = :employeeId
           LEFT JOIN saved_jobs sj ON j.id = sj.job_id AND sj.employee_id = :employeeId
           WHERE j.status != 'closed'
           ORDER BY j.created_at DESC`,
          {
            replacements: { employeeId: employee_id },
            type: sequelize.QueryTypes.SELECT
          }
        );
      } else {
        // If no employee_id, show only ACTIVE jobs for anonymous/public users
        // This ensures job seekers only see currently available opportunities
        jobs = await Job.findAll({
          where: {
            status: 'active'
          },
          order: [['created_at', 'DESC']]
        });

        // Add field mappings for consistency with employee view
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

  // Get jobs by employer ID
  static async getJobsByEmployer(req, res) {
    try {
      const { employer_id } = req.params;
      const jobs = await Job.findAll({
        where: { employer_id },
        order: [['created_at', 'DESC']]
      });
      
      res.status(200).json({
        success: true,
        data: jobs,
        count: jobs.length
      });
    } catch (error) {
      console.error('Error fetching jobs by employer:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching jobs by employer',
        error: error.message
      });
    }
  }

  // Get jobs with applications by employer ID
  static async getJobsWithApplicationsByEmployer(req, res) {
    try {
      const { employer_id } = req.params;
      
      const jobs = await sequelize.query(
        `SELECT DISTINCT j.*, 
                COUNT(ja.id) as application_count
         FROM jobs j
         INNER JOIN job_applications ja ON j.id = ja.job_id
         WHERE j.employer_id = :employerId
           AND ja.application_status IN ('applied', 'accepted', 'pending')
         GROUP BY j.id
         ORDER BY j.created_at DESC`,
        {
          replacements: { employerId: employer_id },
          type: sequelize.QueryTypes.SELECT
        }
      );
      
      res.status(200).json({
        success: true,
        data: jobs,
        count: jobs.length
      });
    } catch (error) {
      console.error('Error fetching jobs with applications by employer:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching jobs with applications by employer',
        error: error.message
      });
    }
  }

  // Get applications for a specific job with employee details
  static async getJobApplications(req, res) {
    try {
      const { id } = req.params;
      
      const applications = await sequelize.query(
        `SELECT ja.*,
                e.id as employee_id,
                e.first_name,
                e.last_name,
                e.email,
                e.phone_number,
                e.wallet_address,
                e.street_address,
                e.street_address2,
                e.city,
                e.state,
                e.zip_code,
                e.country,
                e.country_code,
                e.created_at as employee_created_at
         FROM job_applications ja
         INNER JOIN employee e ON ja.employee_id = e.id
         WHERE ja.job_id = :jobId
           AND ja.application_status IN ('applied', 'accepted')
         ORDER BY ja.applied_at DESC`,
        {
          replacements: { jobId: id },
          type: sequelize.QueryTypes.SELECT
        }
      );
      
      res.status(200).json({
        success: true,
        data: applications,
        count: applications.length
      });
    } catch (error) {
      console.error('Error fetching job applications:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching job applications',
        error: error.message
      });
    }
  }

}

module.exports = JobController;
