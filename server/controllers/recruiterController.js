const { Recruiter, JobPosting, RecruiterFeePayment, Employer, DeployedContract, sequelize } = require('../models');
const { Op } = require('sequelize');
const { verifyUsdcPayment } = require('../services/txVerificationService');
const { resolveEmployer, resolveRecruiter } = require('../services/identityService');
const { scopeToCaller } = require('../middleware/authorize');

const ALLOWED_PROFILE_FIELDS = [
  'first_name', 'last_name', 'phone_number', 'wallet_address', 'agency_name'
];

// What the caller sees of their own recruiter record, and what an employer sees in the
// directory. Phone stays off both: neither the role routing nor assignment needs it.
const SELF_FIELDS = ['id', 'email', 'first_name', 'last_name', 'agency_name', 'wallet_address', 'status'];
const DIRECTORY_FIELDS = ['id', 'email', 'first_name', 'last_name', 'agency_name', 'status'];

// Escape LIKE wildcards so a search term matches literally: unescaped, '%' alone lists
// every recruiter and '_' matches any character.
const escapeLike = (term) => term.replace(/[\\%_]/g, (c) => `\\${c}`);

class RecruiterController {
  // Self-signup: create a recruiter profile. The email comes from the verified identity,
  // never the body. Recruiters are resolved by verified email, so taking it from the body
  // let anyone register a profile under someone else's address with their own wallet
  // attached — and collect the fees employers paid to it.
  static async createRecruiter(req, res) {
    try {
      const { first_name, last_name, phone_number, agency_name, wallet_address } = req.body;
      const email = req.user?.email;

      if (!email) {
        return res.status(400).json({ success: false, message: 'A verified email is required to sign up as a recruiter' });
      }

      const existing = await Recruiter.findOne({
        where: sequelize.where(sequelize.fn('lower', sequelize.col('email')), email.toLowerCase())
      });
      if (existing) {
        return res.status(409).json({ success: false, message: 'A recruiter with this email already exists' });
      }

      const recruiter = await Recruiter.create({
        email: email.toLowerCase(),
        first_name,
        last_name,
        phone_number,
        agency_name,
        // Persist the wallet the signup flow sends. Normalize empty to null: the column is UNIQUE,
        // so multiple '' would collide, whereas multiple NULLs are allowed. A missing wallet at
        // signup is backfilled later by the recruiter-side login sync.
        wallet_address: wallet_address || null,
        status: 'active'
      });

      res.status(201).json({ success: true, data: recruiter });
    } catch (error) {
      console.error('Error creating recruiter:', error);
      res.status(500).json({ success: false, message: 'Error creating recruiter', error: error.message });
    }
  }

  // Is the caller an active recruiter? Used for role routing. This used to take any email
  // from the path and answer for it, wallet included (GHSA-v5r2).
  static async getMyRecruiterProfile(req, res) {
    try {
      const recruiter = await resolveRecruiter(req);

      if (!recruiter) {
        return res.status(404).json({ success: false, isRecruiter: false, message: 'No active recruiter found for this account' });
      }

      const data = SELF_FIELDS.reduce((acc, key) => ({ ...acc, [key]: recruiter[key] }), {});
      res.status(200).json({ success: true, isRecruiter: true, data });
    } catch (error) {
      console.error('Error checking recruiter:', error);
      res.status(500).json({ success: false, message: 'Error checking recruiter status', error: error.message });
    }
  }

  // Active recruiters, for the employer's search-and-assign UI. Approved employers only
  // (enforced on the route). Names and agency match as substrings; email matches only
  // whole and case-insensitively, so the directory cannot be mined for addresses.
  static async getAllRecruiters(req, res) {
    try {
      const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
      const where = { status: 'active' };

      if (search) {
        const pattern = `%${escapeLike(search)}%`;
        where[Op.or] = [
          { first_name: { [Op.iLike]: pattern } },
          { last_name: { [Op.iLike]: pattern } },
          { agency_name: { [Op.iLike]: pattern } },
          sequelize.where(sequelize.fn('lower', sequelize.col('email')), search.toLowerCase())
        ];
      }

      const recruiters = await Recruiter.findAll({
        where,
        attributes: DIRECTORY_FIELDS,
        order: [['agency_name', 'ASC'], ['last_name', 'ASC']]
      });

      res.status(200).json({ success: true, data: recruiters, count: recruiters.length });
    } catch (error) {
      console.error('Error fetching recruiters:', error);
      res.status(500).json({ success: false, message: 'Error fetching recruiters', error: error.message });
    }
  }

  // Update recruiter profile (self-update)
  static async updateRecruiter(req, res) {
    try {
      const recruiter = await Recruiter.findByPk(req.params.id);
      if (!recruiter) {
        return res.status(404).json({ success: false, message: 'Recruiter not found' });
      }

      // Only allow the recruiter to update their own profile
      const userEmail = req.user?.email;
      if (!userEmail || userEmail.toLowerCase() !== recruiter.email.toLowerCase()) {
        return res.status(403).json({ success: false, message: 'You can only update your own profile' });
      }

      const updates = ALLOWED_PROFILE_FIELDS.reduce((acc, key) => {
        if (req.body[key] !== undefined) acc[key] = req.body[key];
        return acc;
      }, {});

      await recruiter.update(updates);
      res.status(200).json({ success: true, data: recruiter });
    } catch (error) {
      console.error('Error updating recruiter:', error);
      res.status(500).json({ success: false, message: 'Error updating recruiter', error: error.message });
    }
  }

  // Jobs assigned to the calling recruiter. Previously /:id/assigned-jobs took the recruiter
  // from the path, behind verifyToken alone: any logged-in user could read any recruiter's
  // postings as whole rows, recruiter fee amounts included (#164).
  static async getAssignedJobs(req, res) {
    try {
      const scope = await scopeToCaller(req, { column: 'recruiter_id', as: 'recruiter', allowAdmin: false });
      if (!scope) {
        return res.status(403).json({ success: false, message: 'Recruiter profile not found' });
      }

      const jobs = await JobPosting.findAll({
        where: scope,
        include: [{ model: Employer, as: 'employer', attributes: ['id', 'company_name', 'email'] }],
        order: [['created_at', 'DESC']]
      });

      res.status(200).json({ success: true, data: jobs, count: jobs.length });
    } catch (error) {
      console.error('Error fetching assigned jobs:', error);
      res.status(500).json({ success: false, message: 'Error fetching assigned jobs', error: error.message });
    }
  }

  // Create a recruiter fee payment record
  static async createFeePayment(req, res) {
    try {
      const { job_posting_id, recruiter_id, employer_id, fee_amount, fee_currency, tx_hash, payment_reference_id, notes } = req.body;

      if (!job_posting_id || !recruiter_id || !employer_id || !fee_amount) {
        return res.status(400).json({ success: false, message: 'job_posting_id, recruiter_id, employer_id, and fee_amount are required' });
      }

      // Validate the caller is the employer they claim to be paying as — the fee must
      // be employer-funded. Authorize off the verified identity, the same way
      // deployedContractController does.
      const employer = await resolveEmployer(req);
      if (!employer || String(employer.id) !== String(employer_id)) {
        return res.status(403).json({ success: false, message: 'You do not have permission to record a fee payment for this employer' });
      }

      // Best-effort link to the specific deployed contract this fee was for. Only auto-link
      // when the job posting has exactly one deployed contract — with multiple positions filled,
      // a single flat fee can't be unambiguously attributed to one contract.
      const contractsForJob = await DeployedContract.findAll({
        where: { job_posting_id },
        attributes: ['id']
      });
      const deployed_contract_id = contractsForJob.length === 1 ? contractsForJob[0].id : null;

      // Never trust the client's word that the fee was paid. A record is only marked 'paid' after
      // the on-chain transaction is re-derived server-side and confirmed to have moved the claimed
      // USDC from the employer's wallet to the recruiter's. Both wallet addresses come from our own
      // records (never the request body), so the client can't spoof either side of the transfer.
      let payment_status = 'pending';
      let paid_at = null;
      let verification_note = null;

      if (tx_hash) {
        const recruiter = await Recruiter.findByPk(recruiter_id, { attributes: ['id', 'wallet_address'] });
        const result = await verifyUsdcPayment({
          txHash: tx_hash,
          fromAddress: employer.wallet_address,
          toAddress: recruiter?.wallet_address,
          amount: fee_amount
        });

        if (result.status === 'verified') {
          payment_status = 'paid';
          paid_at = new Date();
        } else if (result.status === 'mismatch') {
          // Definitive proof the claim is wrong (wrong token/parties/amount, reverted, malformed).
          // Reject outright rather than persist a misleading record.
          return res.status(400).json({
            success: false,
            message: `On-chain verification failed: ${result.reason}`
          });
        } else {
          // Transient (RPC down, tx not mined yet) — keep the record but leave it 'pending' so a
          // legitimate payment isn't lost. It can be re-verified later; it never shows "Paid" unverified.
          verification_note = `Awaiting on-chain confirmation: ${result.reason}`;
        }
      } else if (payment_reference_id) {
        // Off-chain rail (e.g. a future Wise integration). There is no verification path for a bare
        // client-supplied reference yet, so it must NOT be auto-marked 'paid' — same lesson as the
        // tx_hash bug. When that rail lands, verify the reference against the provider's API here.
        verification_note = 'Off-chain reference recorded; awaiting server-side confirmation.';
      }

      const payment = await RecruiterFeePayment.create({
        job_posting_id,
        recruiter_id,
        employer_id,
        deployed_contract_id,
        fee_amount,
        fee_currency: fee_currency || 'USD',
        payment_status,
        tx_hash: tx_hash || null,
        payment_reference_id: payment_reference_id || null,
        paid_at,
        notes: [notes, verification_note].filter(Boolean).join(' — ') || null
      });

      res.status(201).json({ success: true, data: payment });
    } catch (error) {
      console.error('Error creating fee payment:', error);
      res.status(500).json({ success: false, message: 'Error creating fee payment', error: error.message });
    }
  }

  // Fee payments the calling employer made, and fee payments made to the calling recruiter.
  static async getEmployerFeePayments(req, res) {
    return listFeePayments(req, res, { column: 'employer_id', as: 'employer', role: 'Employer' });
  }

  static async getRecruiterFeePayments(req, res) {
    return listFeePayments(req, res, { column: 'recruiter_id', as: 'recruiter', role: 'Recruiter' });
  }
}

// Shared implementation for the two fee-payment lists. Previously one route built its
// where clause from ?employer_id= / ?recruiter_id=, gated by verifyToken alone: any
// authenticated caller could name another employer, or omit the filter and receive every
// fee payment on the platform — the same amounts #164 hides from the posting reads.
const listFeePayments = async (req, res, { column, as, role }) => {
  try {
    const scope = await scopeToCaller(req, { column, as, allowAdmin: false });
    if (!scope) {
      return res.status(403).json({ success: false, message: `${role} profile not found` });
    }

    const payments = await RecruiterFeePayment.findAll({
      where: scope,
      include: [
        { model: Recruiter, as: 'recruiter', attributes: ['id', 'first_name', 'last_name', 'agency_name', 'email'] },
        { model: JobPosting, as: 'jobPosting', attributes: ['id', 'title'] },
        { model: DeployedContract, as: 'deployedContract', attributes: ['id', 'contract_address', 'status'] }
      ],
      order: [['created_at', 'DESC']]
    });

    res.status(200).json({ success: true, data: payments, count: payments.length });
  } catch (error) {
    console.error('Error fetching fee payments:', error);
    res.status(500).json({ success: false, message: 'Error fetching fee payments', error: error.message });
  }
};

module.exports = RecruiterController;
