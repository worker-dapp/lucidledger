const { sequelize, JobPosting, ContractTemplate, Employer, JobApplication, Recruiter } = require('../models');
const { Op } = require('sequelize');
const { scopeToCaller } = require('../middleware/authorize');
const { resolveEmployee } = require('../services/identityService');
const { pickAllowedFields } = require('../utils/fields');

// Fields a client may write on a job posting. Excluded by design:
//   employer_id   ownership, assigned from the verified caller at creation
//   recruiter_id  and the fee fields — set only through the assign-recruiter route,
//                 which validates the recruiter exists and is active
//   status        settable at creation (draft or active only, see below) but not by
//                 update — afterwards the lifecycle moves through the activate, close
//                 and delete routes, so it cannot be jumped by writing the column
//   positions_filled, application_count, accepted_count  derived from other tables
const ALLOWED_POSTING_FIELDS = [
  'title', 'template_id', 'positions_available', 'application_deadline',
  'job_type', 'location_type', 'location', 'salary', 'currency', 'pay_frequency',
  'additional_compensation', 'employee_benefits', 'selected_oracles',
  'responsibilities', 'skills', 'description',
  'company_name', 'company_description'
];

// Creation may choose the posting's initial state, which is what the job wizard and the
// Post Job modal already do. Restricted to the two states a new posting can legitimately
// be in: held back as a draft, or live. Without the restriction an allowlist that included
// `status` would let a caller create a posting already completed or closed.
const ALLOWED_CREATE_FIELDS = [...ALLOWED_POSTING_FIELDS, 'status'];
const CREATABLE_STATUSES = ['draft', 'active'];

class JobPostingController {
  // Create a new job posting (optionally from template)
  static async createJobPosting(req, res) {
    try {
      const { template_id } = req.body;

      // requireApprovedEmployer resolved this from the verified subject. employer_id is no
      // longer read from the body: a caller used to name the owner of the posting it was
      // creating, and the template ownership check below compared that same client value
      // against the template's — a check that consulted nothing the caller could not set.
      const employer = req.employer;
      const employer_id = employer.id;

      const jobPostingData = pickAllowedFields(req.body, ALLOWED_CREATE_FIELDS);

      if (jobPostingData.status && !CREATABLE_STATUSES.includes(jobPostingData.status)) {
        return res.status(400).json({
          success: false,
          message: `status must be one of: ${CREATABLE_STATUSES.join(', ')}`
        });
      }
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

        // The template must belong to the verified caller. employer_id here is the
        // caller's own id, not a value from the request.
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

      postingData.company_name = postingData.company_name || employer.company_name;
      postingData.company_description = postingData.company_description || employer.company_description;

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
      const { status } = req.query;

      // Derived from the verified caller; ?employer_id= is no longer read. It used to
      // select whose postings were returned, so any authenticated caller could list
      // another employer's postings, drafts and recruiter fee arrangements included (#152).
      const scope = await scopeToCaller(req, { allowAdmin: false });
      if (!scope) {
        return res.status(403).json({ success: false, message: 'Employer profile not found' });
      }

      const whereClause = { ...scope };
      if (status) {
        whereClause.status = status;
      } else {
        whereClause.status = { [Op.ne]: 'deleted' };
      }

      const jobPostings = await JobPosting.findAll({
        where: whereClause,
        attributes: {
          include: [
            [sequelize.fn('COUNT', sequelize.col('applications.id')), 'application_count'],
            [
              sequelize.literal(
                "(SELECT COUNT(*) FROM deployed_contracts dc WHERE dc.job_posting_id = \"JobPosting\".\"id\")"
              ),
              'accepted_count'
            ],
            [
              sequelize.literal(
                "(SELECT COUNT(*) FROM deployed_contracts dc WHERE dc.job_posting_id = \"JobPosting\".\"id\")"
              ),
              'positions_filled'
            ]
          ]
        },
        include: [
          {
            model: JobApplication,
            as: 'applications',
            attributes: [],
            required: false
          },
          {
            model: Recruiter,
            as: 'recruiter',
            attributes: ['id', 'first_name', 'last_name', 'agency_name', 'email', 'wallet_address'],
            required: false
          }
        ],
        group: ['JobPosting.id', 'recruiter.id'],
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
      // authorize('ownedByEmployer', { model: JobPosting }) on the route loaded this
      // posting, returned 404 if it does not exist, and proved the verified caller owns
      // it. Nothing is left to check here.
      const jobPosting = req.resource;

      // PR A dropped employer_id from the payload, which protected the field we had
      // thought of. This is the allowlist form: it names what may be written, so a column
      // added later is not writable until someone says so (#96).
      await jobPosting.update(pickAllowedFields(req.body, ALLOWED_POSTING_FIELDS));

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

  // Remove a job posting (soft delete — sets status to 'deleted', preserves DB record)
  // Deployed contracts for filled slots remain intact and accessible via Workforce Dashboard.
  static async deleteJobPosting(req, res) {
    try {
      // The route guard loaded this posting and proved the caller owns it. Previously
      // there was no ownership check here at all: any approved employer could act on any
      // other employer's posting by id (#152).
      const jobPosting = req.resource;

      await jobPosting.update({ status: 'deleted' });

      res.status(200).json({
        success: true,
        message: 'Job posting removed successfully'
      });
    } catch (error) {
      console.error('Error removing job posting:', error);
      res.status(500).json({
        success: false,
        message: 'Error removing job posting',
        error: error.message
      });
    }
  }

  // Close a job posting (no longer accepting applications)
  static async closeJobPosting(req, res) {
    try {
      // The route guard loaded this posting and proved the caller owns it. Previously
      // there was no ownership check here at all: any approved employer could act on any
      // other employer's posting by id (#152).
      const jobPosting = req.resource;

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
      // The route guard loaded this posting and proved the caller owns it. Previously
      // there was no ownership check here at all: any approved employer could act on any
      // other employer's posting by id (#152).
      const jobPosting = req.resource;

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
      const { sequelize } = require('../config/database');

      // The saved/applied flags describe the *caller*. This read ?employee_id= from the
      // query, so passing another worker's id revealed which jobs that worker had saved
      // and applied to — on an endpoint that does not even require a token (#152).
      //
      // optionalAuth means there may be no caller at all, which is fine: an anonymous
      // visitor gets the postings without the personal flags.
      const caller = req.authSubject ? await resolveEmployee(req) : null;
      const employee_id = caller?.id || null;

      let jobPostings;

      if (employee_id) {
        // If employee_id provided, include saved/applied status
        jobPostings = await sequelize.query(
          `SELECT jp.*,
                  CASE WHEN sj.id IS NOT NULL THEN true ELSE false END as is_saved,
                  active_app.application_status,
                  jp.title as "jobTitle",
                  jp.company_name as "companyName"
           FROM job_postings jp
           LEFT JOIN LATERAL (
             SELECT application_status
             FROM job_applications
             WHERE job_posting_id = jp.id
               AND employee_id = :employeeId
               AND application_status NOT IN ('completed', 'declined', 'rejected')
             ORDER BY applied_at DESC
             LIMIT 1
           ) active_app ON true
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
  // Assign or unassign a recruiter to a job posting
  static async assignRecruiter(req, res) {
    try {
      const { recruiter_id, recruiter_fee_amount, recruiter_fee_currency } = req.body;

      // The route guard loaded the posting and proved the caller owns it. Previously there
      // was no ownership check: any approved employer could assign a recruiter to any other
      // employer's posting, and set the fee that employer would owe (#152).
      const job = req.resource;
      const id = job.id;

      if (recruiter_id) {
        const { Recruiter } = require('../models');
        const recruiter = await Recruiter.findByPk(recruiter_id);
        if (!recruiter || recruiter.status !== 'active') {
          return res.status(404).json({ success: false, message: 'Recruiter not found or inactive' });
        }
        await job.update({
          recruiter_id,
          recruiter_fee_amount: recruiter_fee_amount || null,
          recruiter_fee_currency: recruiter_fee_currency || 'USD'
        });
      } else {
        // Unassign
        await job.update({ recruiter_id: null, recruiter_fee_amount: null, recruiter_fee_currency: 'USD' });
      }

      const updated = await JobPosting.findByPk(id, {
        include: [{ model: require('../models').Recruiter, as: 'recruiter', attributes: ['id', 'first_name', 'last_name', 'agency_name', 'email'] }]
      });

      res.status(200).json({ success: true, data: updated });
    } catch (error) {
      console.error('Error assigning recruiter:', error);
      res.status(500).json({ success: false, message: 'Error assigning recruiter', error: error.message });
    }
  }
}

module.exports = JobPostingController;
