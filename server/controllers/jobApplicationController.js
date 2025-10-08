const JobApplication = require('../models/JobApplication');
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

    // Check if application record already exists
    let application = await JobApplication.findOne({
      where: { employee_id, job_id }
    });

    if (application) {
      // Update existing record
      application.is_saved = true;
      await application.save();
    } else {
      // Create new record
      application = await JobApplication.create({
        employee_id,
        job_id,
        is_saved: true
      });
    }

    res.status(200).json({
      success: true,
      message: 'Job saved successfully',
      data: application
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

    const application = await JobApplication.findOne({
      where: { employee_id, job_id }
    });

    if (application) {
      application.is_saved = false;
      await application.save();
    }

    res.status(200).json({
      success: true,
      message: 'Job unsaved successfully',
      data: application
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

    const applications = await JobApplication.findAll({
      where: { 
        employee_id: employeeId,
        is_saved: true
      },
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

    const applications = await JobApplication.findAll({
      where: { 
        employee_id: employeeId,
        application_status: ['applied', 'accepted']
      },
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
