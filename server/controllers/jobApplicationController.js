const { JobApplication, SavedJob, JobPosting, Employee, Employer } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

// Save a job
exports.saveJob = async (req, res) => {
  try {
    const { employee_id, job_posting_id } = req.body;
    
    console.log('📥 saveJob request received:', { employee_id, job_posting_id });
    console.log('🔑 Auth header present:', !!req.headers.authorization);
    console.log('👤 Decoded user:', req.user ? { sub: req.user.sub, email: req.user.email } : 'none');

    if (!employee_id || !job_posting_id) {
      console.log('❌ Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Employee ID and Job Posting ID are required'
      });
    }

    const employee = await Employee.findByPk(employee_id);
    const jobRecord = await JobPosting.findByPk(job_posting_id);
    
    console.log('📋 Employee found:', !!employee);
    console.log('📋 Job posting found:', !!jobRecord);

    if (!jobRecord) {
      console.log('❌ Job posting not found:', job_posting_id);
      return res.status(404).json({
        success: false,
        message: 'Job posting not found'
      });
    }

    const employerRecord = await Employer.findByPk(jobRecord.employer_id);

    // SECURITY CHECK: Prevent saving your own jobs
    // This check is always enforced (no demo mode bypass) to align with smart contract behavior
    if (employee && employerRecord && employee.wallet_address && employerRecord.wallet_address &&
        employee.wallet_address.toLowerCase() === employerRecord.wallet_address.toLowerCase()) {
      console.log('🚫 Self-dealing blocked: Cannot save your own jobs');
      return res.status(403).json({
        success: false,
        message: 'You cannot save your own jobs'
      });
    }

    // Check if user has already applied to this job
    const application = await JobApplication.findOne({
      where: {
        employee_id,
        job_posting_id
      }
    });

    if (application) {
      return res.status(400).json({
        success: false,
        message: 'Cannot save a job you have already applied to'
      });
    }

    // Check if saved job already exists
    let savedJob = await SavedJob.findOne({
      where: {
        employee_id,
        job_posting_id
      }
    });

    if (savedJob) {
      console.log('ℹ️ Job already saved');
      return res.status(200).json({
        success: true,
        message: 'Job already saved',
        data: savedJob
      });
    }

    // Create new saved job record
    console.log('💾 Creating new saved job record...');
    savedJob = await SavedJob.create({
      employee_id,
      job_posting_id,
      saved_at: new Date()
    });
    console.log('✅ Saved job created successfully:', savedJob.id);

    res.status(200).json({
      success: true,
      message: 'Job saved successfully',
      data: savedJob
    });
  } catch (error) {
    console.error('❌ Error saving job:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      sql: error.sql,
      parameters: error.parameters
    });
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
    const { employee_id, job_posting_id } = req.body;

    if (!employee_id || !job_posting_id) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID and Job Posting ID are required'
      });
    }

    const deleted = await SavedJob.destroy({
      where: {
        employee_id,
        job_posting_id
      }
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
    const { employee_id, job_posting_id } = req.body;
    
    console.log('📥 applyToJob request received:', { employee_id, job_posting_id });
    console.log('🔑 Auth header present:', !!req.headers.authorization);
    console.log('👤 Decoded user:', req.user ? { sub: req.user.sub, email: req.user.email } : 'none');

    if (!employee_id || !job_posting_id) {
      console.log('❌ Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Employee ID and Job Posting ID are required'
      });
    }

    const employee = await Employee.findByPk(employee_id);
    console.log('📋 Employee found:', !!employee, employee?.wallet_address ? `wallet: ${employee.wallet_address.substring(0, 10)}...` : '');

    if (!employee) {
      console.log('❌ Employee not found:', employee_id);
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found'
      });
    }

    const jobRecord = await JobPosting.findByPk(job_posting_id);
    if (!jobRecord) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found'
      });
    }

    const employerRecord = await Employer.findByPk(jobRecord.employer_id);
    if (!employerRecord) {
      return res.status(404).json({
        success: false,
        message: 'Employer profile not found'
      });
    }

    // CRITICAL SECURITY CHECK: Prevent self-dealing
    // This check is always enforced (no demo mode bypass) to align with smart contract behavior
    // The smart contract itself prevents employer == worker, so we block it here too
    if (employee.wallet_address && employerRecord.wallet_address &&
        employee.wallet_address.toLowerCase() === employerRecord.wallet_address.toLowerCase()) {
      console.log('🚫 Self-dealing blocked: Cannot apply to your own jobs');
      return res.status(403).json({
        success: false,
        message: 'You cannot sign your own contract'
      });
    }

    // Check if job is closed
    if (jobRecord.status === 'closed') {
      console.log('❌ Job is closed');
      return res.status(400).json({
        success: false,
        message: 'Applications are closed for this job'
      });
    }

    // Check if application already exists
    let application = await JobApplication.findOne({
      where: {
        employee_id,
        job_posting_id
      }
    });

    if (application) {
      console.log('ℹ️ Already applied to this job');
      return res.status(400).json({
        success: false,
        message: 'You have already applied to this job'
      });
    }

    // Create application
    console.log('💾 Creating new job application...');
    application = await JobApplication.create({
      employee_id,
      job_posting_id,
      application_status: 'pending',
      applied_at: new Date()
    });
    console.log('✅ Job application created successfully:', application.id);

    // Remove from saved jobs if it was saved
    await SavedJob.destroy({
      where: {
        employee_id,
        job_posting_id
      }
    });

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: application
    });
  } catch (error) {
    console.error('❌ Error applying to job:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      sql: error.sql,
      parameters: error.parameters
    });
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
    const { employee_id } = req.params;

    const savedJobs = await SavedJob.findAll({
      where: { employee_id },
      include: [
        {
          model: JobPosting,
          as: 'job'
        }
      ],
      order: [['saved_at', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: savedJobs
    });
  } catch (error) {
    console.error('Error fetching saved jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching saved jobs',
      error: error.message
    });
  }
};

// Get applied jobs for an employee
exports.getAppliedJobs = async (req, res) => {
  try {
    const { employee_id } = req.params;

    const applications = await JobApplication.findAll({
      where: { employee_id },
      include: [
        {
          model: JobPosting,
          as: 'job'
        }
      ],
      order: [['applied_at', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: applications
    });
  } catch (error) {
    console.error('Error fetching applied jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching applied jobs',
      error: error.message
    });
  }
};

// Update application status (for employers)
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status, offer_signature, offer_signed_at } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const application = await JobApplication.findByPk(applicationId);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    const updates = { application_status: status };
    if (status === 'accepted') {
      updates.offer_sent_at = new Date();
    }
    if (status === 'signed') {
      updates.offer_accepted_at = new Date();
      if (offer_signature) {
        updates.offer_signature = offer_signature;
      }
      if (offer_signed_at) {
        updates.offer_signed_at = offer_signed_at;
      }
    }

    application.set(updates);
    await application.save();

    res.status(200).json({
      success: true,
      message: 'Application status updated successfully',
      data: application
    });
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating application status',
      error: error.message
    });
  }
};

// Get applications for an employer (filterable)
exports.getApplicationsByEmployer = async (req, res) => {
  try {
    const { employer_id } = req.params;
    const { status, job_posting_id } = req.query;

    const applicationWhere = {};
    if (status) {
      if (status === 'pending') {
        applicationWhere.application_status = {
          [Op.or]: [{ [Op.is]: null }, 'pending']
        };
      } else {
        applicationWhere.application_status = status;
      }
    }
    if (job_posting_id) {
      applicationWhere.job_posting_id = job_posting_id;
    }

    const applications = await JobApplication.findAll({
      where: applicationWhere,
      include: [
        {
          model: JobPosting,
          as: 'job',
          where: { employer_id },
          required: true
        },
        {
          model: Employee,
          as: 'employee'
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: applications,
      count: applications.length
    });
  } catch (error) {
    console.error('Error fetching applications by employer:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching applications',
      error: error.message
    });
  }
};

// Bulk update application status (accept/reject)
exports.bulkUpdateApplicationStatus = async (req, res) => {
  try {
    const { application_ids, status } = req.body;

    if (!Array.isArray(application_ids) || application_ids.length === 0 || !status) {
      return res.status(400).json({
        success: false,
        message: 'application_ids array and status are required'
      });
    }

    const updates = { application_status: status };
    if (status === 'accepted') {
      updates.offer_sent_at = new Date();
    }
    if (status === 'signed') {
      updates.offer_accepted_at = new Date();
    }

    const [updatedCount] = await JobApplication.update(updates, {
      where: {
        id: application_ids
      }
    });

    res.status(200).json({
      success: true,
      message: 'Applications updated successfully',
      updated: updatedCount
    });
  } catch (error) {
    console.error('Error bulk updating applications:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating applications',
      error: error.message
    });
  }
};
