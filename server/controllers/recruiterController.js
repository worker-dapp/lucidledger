const { Recruiter, JobPosting, RecruiterFeePayment, Employer, DeployedContract } = require('../models');
const { Op } = require('sequelize');
const { verifyUsdcPayment } = require('../services/txVerificationService');

// Get employer by wallet address (case-insensitive — addresses may differ in checksum casing)
const getEmployerForUser = async (walletAddress) => {
  if (!walletAddress) return null;
  return Employer.findOne({ where: { wallet_address: { [Op.iLike]: walletAddress } } });
};

const ALLOWED_PROFILE_FIELDS = [
  'first_name', 'last_name', 'phone_number', 'wallet_address', 'agency_name'
];

class RecruiterController {
  // Self-signup: create a recruiter profile
  static async createRecruiter(req, res) {
    try {
      const { email, first_name, last_name, phone_number, agency_name } = req.body;

      if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required' });
      }

      const existing = await Recruiter.findOne({ where: { email: email.toLowerCase() } });
      if (existing) {
        return res.status(409).json({ success: false, message: 'A recruiter with this email already exists' });
      }

      const recruiter = await Recruiter.create({
        email: email.toLowerCase(),
        first_name,
        last_name,
        phone_number,
        agency_name,
        status: 'active'
      });

      res.status(201).json({ success: true, data: recruiter });
    } catch (error) {
      console.error('Error creating recruiter:', error);
      res.status(500).json({ success: false, message: 'Error creating recruiter', error: error.message });
    }
  }

  // Check if email belongs to an active recruiter (used for auth/role routing)
  static async checkRecruiterByEmail(req, res) {
    try {
      const { email } = req.params;

      if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required' });
      }

      const recruiter = await Recruiter.findOne({
        where: { email: email.toLowerCase(), status: 'active' },
        attributes: ['id', 'email', 'first_name', 'last_name', 'agency_name', 'wallet_address', 'status']
      });

      if (!recruiter) {
        return res.status(404).json({ success: false, isRecruiter: false, message: 'No active recruiter found with this email' });
      }

      res.status(200).json({ success: true, isRecruiter: true, data: recruiter });
    } catch (error) {
      console.error('Error checking recruiter:', error);
      res.status(500).json({ success: false, message: 'Error checking recruiter status', error: error.message });
    }
  }

  // Get recruiter by ID
  static async getRecruiterById(req, res) {
    try {
      const recruiter = await Recruiter.findByPk(req.params.id);
      if (!recruiter) {
        return res.status(404).json({ success: false, message: 'Recruiter not found' });
      }
      res.status(200).json({ success: true, data: recruiter });
    } catch (error) {
      console.error('Error fetching recruiter:', error);
      res.status(500).json({ success: false, message: 'Error fetching recruiter', error: error.message });
    }
  }

  // Get all active recruiters (for employer search/assign UI)
  static async getAllRecruiters(req, res) {
    try {
      const { search } = req.query;
      const where = { status: 'active' };

      if (search) {
        where[Op.or] = [
          { first_name: { [Op.iLike]: `%${search}%` } },
          { last_name: { [Op.iLike]: `%${search}%` } },
          { agency_name: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const recruiters = await Recruiter.findAll({
        where,
        attributes: ['id', 'email', 'first_name', 'last_name', 'agency_name', 'status'],
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

  // Get jobs assigned to this recruiter
  static async getAssignedJobs(req, res) {
    try {
      const { id } = req.params;

      const recruiter = await Recruiter.findByPk(id);
      if (!recruiter) {
        return res.status(404).json({ success: false, message: 'Recruiter not found' });
      }

      const jobs = await JobPosting.findAll({
        where: { recruiter_id: id },
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

      // Validate the caller is the employer they claim to be paying as — the fee must be
      // employer-funded, so the payer identity is checked the same way deployedContractController does.
      const walletAddress = req.headers['x-wallet-address'] || req.body.wallet_address;
      const employer = await getEmployerForUser(walletAddress);
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

  // Get fee payments for a job posting or recruiter
  static async getFeePayments(req, res) {
    try {
      const { job_posting_id, recruiter_id, employer_id } = req.query;
      const where = {};
      if (job_posting_id) where.job_posting_id = job_posting_id;
      if (recruiter_id) where.recruiter_id = recruiter_id;
      if (employer_id) where.employer_id = employer_id;

      const payments = await RecruiterFeePayment.findAll({
        where,
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
  }
}

module.exports = RecruiterController;
