const JobApplication = require('../models/JobApplication');
const SavedJob = require('../models/SavedJob');
const Job = require('../models/Job');
const { sequelize } = require('../config/database');

// Save a job
exports.saveJob = async (req, res) => {
  try {
    const { employee_id, job_id } = req.body;

    if (!employee_id || !job_id) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID and Job ID are required'
      });
    }

    // Check if saved job already exists
    let savedJob = await SavedJob.findOne({
      where: { employee_id, job_id }
    });

    if (savedJob) {
      return res.status(200).json({
        success: true,
        message: 'Job already saved',
        data: savedJob
      });
    }

    // Create new saved job record
    savedJob = await SavedJob.create({
      employee_id,
      job_id,
      saved_at: new Date()
    });

    res.status(200).json({
      success: true,
      message: 'Job saved successfully',
      data: savedJob
    });
  } catch (error) {
    console.error('Error saving job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save job',
      error: error.message
    });
  }
};

// Unsave a job
exports.unsaveJob = async (req, res) => {
  try {
    const { employee_id, job_id } = req.body;

    if (!employee_id || !job_id) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID and Job ID are required'
      });
    }

    // Delete the saved job record
    const deleted = await SavedJob.destroy({
      where: { employee_id, job_id }
    });

    if (deleted === 0) {
      return res.status(404).json({
        success: false,
        message: 'Saved job not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Job unsaved successfully'
    });
  } catch (error) {
    console.error('Error unsaving job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unsave job',
      error: error.message
    });
  }
};

// Apply to a job
exports.applyToJob = async (req, res) => {
  try {
    const { employee_id, job_id } = req.body;

    if (!employee_id || !job_id) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID and Job ID are required'
      });
    }

    // Check if application record already exists
    let application = await JobApplication.findOne({
      where: { employee_id, job_id }
    });

    if (application) {
      // Check if already applied
      if (application.application_status === 'applied' || application.application_status === 'accepted') {
        return res.status(400).json({
          success: false,
          message: 'You have already applied to this job'
        });
      }
      
      // Update existing record
      application.application_status = 'applied';
      application.applied_at = new Date();
      await application.save();
    } else {
      // Create new record
      application = await JobApplication.create({
        employee_id,
        job_id,
        application_status: 'applied',
        applied_at: new Date()
      });
    }

    // Remove job from saved jobs if it was saved
    await SavedJob.destroy({
      where: { employee_id, job_id }
    });

    res.status(200).json({
      success: true,
      message: 'Application submitted successfully',
      data: application
    });
  } catch (error) {
    console.error('Error applying to job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to apply to job',
      error: error.message
    });
  }
};

// Get saved jobs for an employee
exports.getSavedJobs = async (req, res) => {
  try {
    const { employeeId } = req.params;

    // Use raw query to join with job_applications to get application_status
    const savedJobs = await sequelize.query(
      `SELECT sj.*, 
              j.*,
              ja.application_status,
              sj.saved_at
       FROM saved_jobs sj
       INNER JOIN jobs j ON sj.job_id = j.id
       LEFT JOIN job_applications ja ON ja.employee_id = sj.employee_id AND ja.job_id = sj.job_id
       WHERE sj.employee_id = :employeeId
       ORDER BY sj.saved_at DESC`,
      {
        replacements: { employeeId },
        type: sequelize.QueryTypes.SELECT
      }
    );

    // Transform the flat structure to match the expected format
    const formattedSavedJobs = savedJobs.map(saved => ({
      id: saved.id,
      employee_id: saved.employee_id,
      job_id: saved.job_id,
      saved_at: saved.saved_at,
      created_at: saved.created_at,
      updated_at: saved.updated_at,
      application_status: saved.application_status,
      job: {
        id: saved.job_id,
        title: saved.title,
        company_name: saved.company_name,
        location: saved.location,
        location_type: saved.location_type,
        salary: saved.salary,
        currency: saved.currency,
        pay_frequency: saved.pay_frequency,
        job_type: saved.job_type,
        description: saved.description,
        responsibilities: saved.responsibilities,
        skills: saved.skills,
        additional_compensation: saved.additional_compensation,
        employee_benefits: saved.employee_benefits,
        company_description: saved.company_description,
        status: saved.status
      }
    }));

    res.status(200).json({
      success: true,
      data: formattedSavedJobs
    });
  } catch (error) {
    console.error('Error fetching saved jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch saved jobs',
      error: error.message
    });
  }
};

// Get applied jobs for an employee
exports.getAppliedJobs = async (req, res) => {
  try {
    const { employeeId } = req.params;

    // Use raw query to join with saved_jobs to get is_saved status
    const applications = await sequelize.query(
      `SELECT ja.*, 
              j.*,
              CASE WHEN sj.id IS NOT NULL THEN true ELSE false END as is_saved
       FROM job_applications ja
       INNER JOIN jobs j ON ja.job_id = j.id
       LEFT JOIN saved_jobs sj ON sj.employee_id = ja.employee_id AND sj.job_id = ja.job_id
       WHERE ja.employee_id = :employeeId 
         AND ja.application_status IN ('applied', 'accepted')
       ORDER BY ja.applied_at DESC`,
      {
        replacements: { employeeId },
        type: sequelize.QueryTypes.SELECT
      }
    );

    // Transform the flat structure to match the expected format
    const formattedApplications = applications.map(app => ({
      id: app.id,
      employee_id: app.employee_id,
      job_id: app.job_id,
      application_status: app.application_status,
      applied_at: app.applied_at,
      created_at: app.created_at,
      updated_at: app.updated_at,
      is_saved: app.is_saved,
      job: {
        id: app.job_id,
        title: app.title,
        company_name: app.company_name,
        location: app.location,
        location_type: app.location_type,
        salary: app.salary,
        currency: app.currency,
        pay_frequency: app.pay_frequency,
        job_type: app.job_type,
        description: app.description,
        responsibilities: app.responsibilities,
        skills: app.skills,
        additional_compensation: app.additional_compensation,
        employee_benefits: app.employee_benefits,
        company_description: app.company_description,
        status: app.status
      }
    }));

    res.status(200).json({
      success: true,
      data: formattedApplications
    });
  } catch (error) {
    console.error('Error fetching applied jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applied jobs',
      error: error.message
    });
  }
};

// Get all job applications for an employee (with job details)
exports.getEmployeeApplications = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const applications = await JobApplication.findAll({
      where: { employee_id: employeeId },
      include: [{
        model: Job,
        as: 'job'
      }]
    });

    res.status(200).json({
      success: true,
      data: applications
    });
  } catch (error) {
    console.error('Error fetching employee applications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee applications',
      error: error.message
    });
  }
};
