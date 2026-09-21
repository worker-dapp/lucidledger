const { JobApplication, SavedJob, JobPosting, Employee, Employer } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const { logAction } = require('./auditLogController');
const { scopeToCaller } = require('../middleware/authorize');
const { resolveEmployee } = require('../services/identityService');

// Self-dealing: the same person acting as both sides of a contract.
//
// This compared wallet_address, which a user can rewrite through their own profile — so
// the check could be stepped around by changing one editable field. It now compares
// auth_subject, the verified JWT subject, which is written at record creation and is not
// user-editable. Flagged as a known gap in CLAUDE.md; closed here because resolving the
// caller from auth_subject made the durable form free.
const isSelfDealing = (employee, employer) =>
  !!employee?.auth_subject && employee.auth_subject === employer?.auth_subject;

// Save a job
// POST /api/job-applications/save — save a job for the calling worker.
//
// employee_id used to come from the body, so any authenticated caller could save jobs into
// another worker's account (#149). It is now the verified caller, and the body cannot name
// anyone.
exports.saveJob = async (req, res) => {
  try {
    const { job_posting_id } = req.body;

    const employee = await resolveEmployee(req);
    if (!employee) {
      return res.status(403).json({ success: false, message: 'Employee profile not found' });
    }
    const employee_id = employee.id;

    if (!job_posting_id) {
      return res.status(400).json({
        success: false,
        message: 'Job Posting ID is required'
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

    // Always enforced, no demo-mode bypass, to align with smart contract behaviour.
    if (isSelfDealing(employee, employerRecord)) {
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
      return res.status(200).json({
        success: true,
        message: 'Job already saved',
        data: savedJob
      });
    }

    savedJob = await SavedJob.create({
      employee_id,
      job_posting_id,
      saved_at: new Date()
    });
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
// POST /api/job-applications/unsave — unsave one of the caller's own saved jobs.
//
// employee_id came from the body, so any caller could delete another worker's saved jobs
// by naming them (#149).
exports.unsaveJob = async (req, res) => {
  try {
    const { job_posting_id } = req.body;

    const scope = await scopeToCaller(req, { column: 'employee_id', as: 'employee', allowAdmin: false });
    if (!scope) {
      return res.status(403).json({ success: false, message: 'Employee profile not found' });
    }

    if (!job_posting_id) {
      return res.status(400).json({
        success: false,
        message: 'Job Posting ID is required'
      });
    }

    const deleted = await SavedJob.destroy({
      where: {
        ...scope,
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
// POST /api/job-applications/apply — apply as the calling worker.
//
// employee_id came from the body: any authenticated caller could submit an application in
// another worker's name (#149).
exports.applyToJob = async (req, res) => {
  try {
    const { job_posting_id } = req.body;

    const employee = await resolveEmployee(req);
    if (!employee) {
      return res.status(403).json({
        success: false,
        message: 'Employee profile not found'
      });
    }
    const employee_id = employee.id;

    if (!job_posting_id) {
      return res.status(400).json({
        success: false,
        message: 'Job Posting ID is required'
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

    // Always enforced, no demo-mode bypass: the smart contract prevents employer == worker,
    // so the API must too. Compares auth_subject rather than the editable wallet address.
    if (isSelfDealing(employee, employerRecord)) {
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

    // Check for any existing application for this worker + job
    const ACTIVE_APPLICATION_STATUSES = ['pending', 'applied', 'accepted', 'signed', 'deployed'];
    let application = await JobApplication.findOne({
      where: { employee_id, job_posting_id }
    });

    if (application && ACTIVE_APPLICATION_STATUSES.includes(application.application_status)) {
      console.log('ℹ️ Already has an active application for this job');
      return res.status(400).json({
        success: false,
        message: 'You already have an active application for this job'
      });
    }

    if (application) {
      // Existing completed/declined/rejected application — reset it for re-apply.
      // A new INSERT would violate the unique(employee_id, job_posting_id) constraint.
      console.log('💾 Resetting existing application for re-apply...');
      await application.update({
        application_status: 'pending',
        applied_at: new Date(),
        offer_sent_at: null,
        offer_accepted_at: null,
        offer_signature: null,
        offer_signed_at: null,
        blockchain_deployment_status: 'not_deployed',
        contract_snapshot: null,
      });
      console.log('✅ Application reset for re-apply:', application.id);
    } else {
      // No prior application — create fresh
      console.log('💾 Creating new job application...');
      application = await JobApplication.create({
        employee_id,
        job_posting_id,
        application_status: 'pending',
        applied_at: new Date()
      });
      console.log('✅ Job application created successfully:', application.id);
    }

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
// GET /api/job-applications/saved — the caller's own saved jobs.
//
// The employee id used to come from the path, so any authenticated user could read any
// worker's saved jobs by changing it (#149). The path segment is gone rather than ignored:
// an ignored parameter reads like a working one.
exports.getSavedJobs = async (req, res) => {
  try {
    const scope = await scopeToCaller(req, { column: 'employee_id', as: 'employee', allowAdmin: false });
    if (!scope) {
      return res.status(403).json({ success: false, message: 'Employee profile not found' });
    }

    const savedJobs = await SavedJob.findAll({
      where: scope,
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
// GET /api/job-applications/applied — the caller's own applications.
exports.getAppliedJobs = async (req, res) => {
  try {
    const scope = await scopeToCaller(req, { column: 'employee_id', as: 'employee', allowAdmin: false });
    if (!scope) {
      return res.status(403).json({ success: false, message: 'Employee profile not found' });
    }

    const applications = await JobApplication.findAll({
      where: scope,
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

// Update application status (for employers, or recruiters acting on assigned jobs)
// PATCH /api/job-applications/:applicationId/status
//
// authorize('applicationParty') loaded the application and its posting and proved the
// caller is one of the two parties. Previously there was no ownership check at all: any
// authenticated caller could accept, reject or sign any application by id (#149).
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status, offer_signature, offer_signed_at } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const application = req.resource;

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

      // Note: server-side signature verification deferred — x-wallet-address is the smart
      // wallet (contract address) while the actual signer is the underlying EOA, which are
      // intentionally different in Privy's account abstraction model. Correct verification
      // requires storing the EOA address in the DB. Tracked as v0.4.0 issue #89.

      // Capture immutable snapshot of job posting terms at signing time
      const jobPosting = await JobPosting.findByPk(application.job_posting_id, {
        attributes: [
          'title', 'salary', 'currency', 'pay_frequency',
          'location', 'location_type', 'job_type', 'responsibilities',
          'description', 'employee_benefits', 'additional_compensation',
          'selected_oracles', 'application_deadline', 'company_name',
          'company_description'
        ]
      });
      if (jobPosting) {
        updates.contract_snapshot = {
          title: jobPosting.title,
          salary: jobPosting.salary,
          currency: jobPosting.currency,
          pay_frequency: jobPosting.pay_frequency,
          location: jobPosting.location,
          location_type: jobPosting.location_type,
          job_type: jobPosting.job_type,
          responsibilities: jobPosting.responsibilities,
          description: jobPosting.description,
          employee_benefits: jobPosting.employee_benefits,
          additional_compensation: jobPosting.additional_compensation,
          selected_oracles: jobPosting.selected_oracles,
          application_deadline: jobPosting.application_deadline,
          company_name: jobPosting.company_name,
          company_description: jobPosting.company_description,
          snapshot_taken_at: new Date().toISOString()
        };
      }
    }

    application.set(updates);
    await application.save();

    if (status === 'accepted' || status === 'rejected' || status === 'declined') {
      // The posting was already loaded by the route guard to establish ownership.
      const jobForLog = req.resourceParent;
      const isWorkerDecline = status === 'declined';
      // Actor derived from the record and the posting, never from the body: actor_type and
      // actor_id used to be client-supplied, so audit entries could be attributed to
      // anyone. A decline is the worker's action by definition; the rest are the
      // employer's, and the guard has already proved the caller is one of the two.
      await logAction({
        actorType: isWorkerDecline ? 'employee' : 'employer',
        actorId: isWorkerDecline ? application.employee_id : (jobForLog?.employer_id || null),
        actorName: null,
        actionType: isWorkerDecline ? 'offer_declined' : (status === 'accepted' ? 'application_accepted' : 'application_rejected'),
        actionDescription: isWorkerDecline
          ? `Worker declined offer for "${jobForLog?.title || 'job'}"`
          : `Application ${status} for "${jobForLog?.title || 'job'}"`,
        entityType: 'job_application',
        entityId: application.id,
        entityIdentifier: jobForLog?.title || `Application #${application.id}`,
        newValue: { status },
        employerId: jobForLog?.employer_id || null,
      });
    }

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
// GET /api/job-applications/employer — applications to the caller's own postings.
//
// The employer id came from the path, and the response includes full Employee records, so
// any authenticated caller could read every applicant's PII for any employer (#149).
exports.getApplicationsByEmployer = async (req, res) => {
  try {
    const scope = await scopeToCaller(req, { allowAdmin: false });
    if (!scope) {
      return res.status(403).json({ success: false, message: 'Employer profile not found' });
    }
    const { employer_id } = scope;
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

// Get applications for a recruiter (filterable) — jobs the recruiter has been assigned to
// GET /api/job-applications/recruiter — applications on postings assigned to the caller.
exports.getApplicationsByRecruiter = async (req, res) => {
  try {
    const scope = await scopeToCaller(req, { column: 'recruiter_id', as: 'recruiter', allowAdmin: false });
    if (!scope) {
      return res.status(403).json({ success: false, message: 'Recruiter profile not found' });
    }
    const { recruiter_id } = scope;
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
          where: { recruiter_id },
          required: true,
          include: [{ model: Employer, as: 'employer', attributes: ['id', 'company_name', 'email'] }]
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
    console.error('Error fetching applications by recruiter:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching applications',
      error: error.message
    });
  }
};

// Bulk update application status (accept/reject)
// Shared implementation for the two bulk-status routes. `scope` names the column on
// JobPosting that must match the caller — employer_id for an employer, recruiter_id for a
// recruiter working the posting.
//
// Previously this updated whatever ids the body named, with no ownership check of any
// kind: any authenticated caller could accept, reject or sign every application on the
// platform in one request (#149). The audit actor was taken from the body too, so the
// resulting log entries could be attributed to anyone.
const bulkUpdateScoped = async (req, res, { column, as, role }) => {
  try {
    const { application_ids, status } = req.body;

    const scope = await scopeToCaller(req, { column, as, allowAdmin: false });
    if (!scope) {
      return res.status(403).json({ success: false, message: `${role} profile not found` });
    }

    if (!Array.isArray(application_ids) || application_ids.length === 0 || !status) {
      return res.status(400).json({
        success: false,
        message: 'application_ids array and status are required'
      });
    }

    // Resolve which of the requested applications the caller may actually act on, by
    // joining to the posting that names the owner.
    const owned = await JobApplication.findAll({
      where: { id: application_ids },
      include: [{
        model: JobPosting,
        as: 'job',
        attributes: ['id', 'title', 'employer_id'],
        where: scope,
        required: true
      }]
    });

    // All or nothing. A partial update would silently apply to the subset the caller owns
    // while reporting success, which reads as "it worked" for a request that was partly
    // refused. Refusing outright also tells an enumerating caller nothing about which ids
    // exist — every mixed request gets the same answer.
    if (owned.length !== application_ids.length) {
      return res.status(403).json({
        success: false,
        message: 'One or more applications are not yours to update'
      });
    }

    const updates = { application_status: status };
    if (status === 'accepted') {
      updates.offer_sent_at = new Date();
    }
    if (status === 'signed') {
      updates.offer_accepted_at = new Date();
    }

    const ownedIds = owned.map((app) => app.id);
    const [updatedCount] = await JobApplication.update(updates, { where: { id: ownedIds } });

    // Log one audit entry per application — only for employer-facing accept/reject
    // decisions. The actor is the verified caller; it is no longer read from the body.
    if (status === 'accepted' || status === 'rejected') {
      const actionType = status === 'accepted' ? 'application_accepted' : 'application_rejected';
      await Promise.all(owned.map((app) =>
        logAction({
          actorType:         as,
          actorId:           scope[column],
          actorName:         null,
          actionType,
          actionDescription: `Application ${status} for "${app.job?.title || 'job'}"`,
          entityType:        'job_application',
          entityId:          app.id,
          entityIdentifier:  app.job?.title || `Application #${app.id}`,
          newValue:          { status },
          employerId:        app.job?.employer_id || null,
        })
      ));
    }

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

// POST /api/job-applications/bulk-status — the calling employer's own postings.
exports.bulkUpdateApplicationStatus = (req, res) =>
  bulkUpdateScoped(req, res, { column: 'employer_id', as: 'employer', role: 'Employer' });

// POST /api/job-applications/recruiter/bulk-status — postings assigned to the caller.
//
// These were the same handler on two routes, so the recruiter route ran the employer's
// code path. Split, because the two scope to different columns.
exports.bulkUpdateApplicationStatusAsRecruiter = (req, res) =>
  bulkUpdateScoped(req, res, { column: 'recruiter_id', as: 'recruiter', role: 'Recruiter' });

