const { DeployedContract, JobPosting, Employee, Employer, Mediator, PaymentTransaction, JobApplication, sequelize } = require('../models');
const { Op } = require('sequelize');

// Terminal contract statuses (contract lifecycle is complete)
const TERMINAL_CONTRACT_STATUSES = ['completed', 'refunded', 'terminated'];

/**
 * Check if all contracts for a job are complete and update job status accordingly.
 * Called after a contract status changes to a terminal state.
 *
 * Job status flow:
 * - 'active' -> 'in_progress' when first contract is deployed
 * - 'in_progress' -> 'completed' when all contracts are completed
 * - 'in_progress' -> 'closed' when all contracts are refunded/terminated
 */
const updateJobStatusIfAllContractsComplete = async (jobPostingId) => {
  if (!jobPostingId) return;

  try {
    // Get all deployed contracts for this job
    const allContracts = await DeployedContract.findAll({
      where: { job_posting_id: jobPostingId },
      attributes: ['id', 'status']
    });

    // If no contracts, nothing to do
    if (allContracts.length === 0) return;

    // Get the job to check positions_available
    const job = await JobPosting.findByPk(jobPostingId, {
      attributes: ['id', 'status', 'positions_available']
    });
    if (!job) return;

    const allPositionsFilled = allContracts.length >= (job.positions_available || 1);

    // Check if ALL contracts are in terminal states
    const allTerminal = allContracts.every(c => TERMINAL_CONTRACT_STATUSES.includes(c.status));

    if (!allPositionsFilled) {
      // Still open positions — keep job active so more applicants can apply
      return;
    }

    if (!allTerminal) {
      // All positions filled but some contracts still active — mark in_progress
      await JobPosting.update(
        { status: 'in_progress' },
        { where: { id: jobPostingId, status: 'active' } }
      );
      return;
    }

    // All positions filled and all contracts terminal — determine final job status
    const allRefundedOrTerminated = allContracts.every(c =>
      c.status === 'refunded' || c.status === 'terminated'
    );

    const newJobStatus = allRefundedOrTerminated ? 'closed' : 'completed';

    await JobPosting.update(
      { status: newJobStatus },
      { where: { id: jobPostingId } }
    );

    console.log(`Job ${jobPostingId} status updated to '${newJobStatus}' (all ${allContracts.length} contracts complete)`);
  } catch (error) {
    // Log but don't throw - this is a secondary operation
    console.error('Error updating job status:', error.message);
  }
};

// Check if wallet address is in admin list
// TODO: Update to use ADMIN_WALLETS env var (see notes/privy-admin-mediator-auth.md)
const isAdminWallet = (walletAddress) => {
  const adminWallets = process.env.ADMIN_WALLETS;
  if (!adminWallets || !walletAddress) {
    return false;
  }
  const adminList = adminWallets.split(',').map((item) => item.trim().toLowerCase());
  return adminList.includes(walletAddress.toLowerCase());
};

const pickAllowedFields = (payload, allowedFields) => {
  return Object.keys(payload).reduce((acc, key) => {
    if (allowedFields.includes(key)) {
      acc[key] = payload[key];
    }
    return acc;
  }, {});
};

// Get employer by wallet address (case-insensitive — addresses may differ in checksum casing)
const getEmployerForUser = async (walletAddress) => {
  if (!walletAddress) return null;
  return Employer.findOne({ where: { wallet_address: { [Op.iLike]: walletAddress } } });
};

// Get employee by wallet address (case-insensitive — addresses may differ in checksum casing)
const getEmployeeForUser = async (walletAddress) => {
  if (!walletAddress) return null;
  return Employee.findOne({ where: { wallet_address: { [Op.iLike]: walletAddress } } });
};

class DeployedContractController {
  // Create a deployed contract record
  static async createDeployedContract(req, res) {
    try {
      const {
        job_posting_id,
        employee_id,
        employer_id,
        contract_address,
        payment_amount,
        ...payload
      } = req.body;

      if (!job_posting_id || !employee_id || !employer_id || !contract_address || payment_amount === undefined) {
        return res.status(400).json({
          success: false,
          message: 'job_posting_id, employee_id, employer_id, contract_address, and payment_amount are required'
        });
      }

      const walletAddress = req.headers['x-wallet-address'] || req.body.wallet_address;
      const isAdmin = isAdminWallet(walletAddress);

      if (!isAdmin) {
        const employer = await getEmployerForUser(walletAddress);
        if (!employer || String(employer.id) !== String(employer_id)) {
          return res.status(403).json({
            success: false,
            message: 'You do not have permission to create contracts for this employer'
          });
        }
      }

      const allowedCreateFields = [
        'job_posting_id',
        'employee_id',
        'employer_id',
        'contract_address',
        'payment_amount',
        'payment_currency',
        'payment_frequency',
        'status',
        'selected_oracles',
        'contract_version',
        'oracle_addresses',
        'verification_status',
        'deployment_tx_hash',
        'deployed_at',
        'started_at',
        'expected_end_date',
        'actual_end_date',
        'last_payment_date',
        'next_payment_date',
        'total_paid'
      ];

      const createPayload = pickAllowedFields({ ...req.body, ...payload }, allowedCreateFields);
      if (!isAdmin) {
        if (createPayload.status && createPayload.status !== 'active') {
          return res.status(403).json({
            success: false,
            message: 'Only admin can set non-active status on creation'
          });
        }
        if (createPayload.verification_status && createPayload.verification_status !== 'pending') {
          return res.status(403).json({
            success: false,
            message: 'Only admin can set non-pending verification status on creation'
          });
        }
      }

      // Copy the snapshot captured at signing time from job_applications.
      // This is the source of truth — it reflects what the worker saw when they signed,
      // not the current state of the job posting (which may have changed since).
      const application = await JobApplication.findOne({
        where: { job_posting_id, employee_id },
        attributes: ['contract_snapshot']
      });
      if (application?.contract_snapshot) {
        createPayload.contract_snapshot = application.contract_snapshot;
      }

      const deployedContract = await DeployedContract.create(createPayload);

      res.status(201).json({
        success: true,
        data: deployedContract,
        message: 'Deployed contract created successfully'
      });
    } catch (error) {
      console.error('Error creating deployed contract:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating deployed contract',
        error: error.message
      });
    }
  }

  // Get deployed contracts for an employer (optionally filtered by status)
  static async getDeployedContractsByEmployer(req, res) {
    try {
      const { employer_id, status } = req.query;
      const walletAddress = req.headers['x-wallet-address'] || req.query.wallet_address;

      const isAdmin = isAdminWallet(walletAddress);
      let effectiveEmployerId = employer_id;

      if (!isAdmin) {
        const employer = await getEmployerForUser(walletAddress);
        if (!employer) {
          return res.status(403).json({
            success: false,
            message: 'Employer account not found. Please ensure your wallet is connected.'
          });
        }
        effectiveEmployerId = String(employer.id);
        if (employer_id && String(employer_id) !== String(employer.id)) {
          return res.status(403).json({
            success: false,
            message: 'You do not have permission to access these contracts'
          });
        }
      }

      if (!effectiveEmployerId) {
        return res.status(400).json({
          success: false,
          message: 'employer_id is required'
        });
      }

      const whereClause = { employer_id: effectiveEmployerId };
      if (status && status !== 'all') {
        // "terminated" filter includes both terminated and refunded statuses
        if (status === 'terminated') {
          whereClause.status = { [Op.in]: ['terminated', 'refunded'] };
        } else {
          whereClause.status = status;
        }
      }

      const deployedContracts = await DeployedContract.findAll({
        where: whereClause,
        include: [
          { model: JobPosting, as: 'jobPosting' },
          { model: Employee, as: 'employee' }
        ],
        order: [['created_at', 'DESC']]
      });

      res.status(200).json({
        success: true,
        data: deployedContracts,
        count: deployedContracts.length
      });
    } catch (error) {
      console.error('Error fetching deployed contracts:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching deployed contracts',
        error: error.message
      });
    }
  }

  // Get deployed contracts for an employee (optionally filtered by status)
  static async getDeployedContractsByEmployee(req, res) {
    try {
      const { employee_id } = req.params;
      const { status } = req.query;
      const walletAddress = req.headers['x-wallet-address'] || req.query.wallet_address;

      const isAdmin = isAdminWallet(walletAddress);
      let effectiveEmployeeId = employee_id;

      if (!isAdmin) {
        const employee = await getEmployeeForUser(walletAddress);
        if (!employee) {
          return res.status(403).json({
            success: false,
            message: 'Employee account not found. Please ensure your wallet is connected.'
          });
        }
        effectiveEmployeeId = String(employee.id);
        if (employee_id && String(employee_id) !== String(employee.id)) {
          return res.status(403).json({
            success: false,
            message: 'You do not have permission to access these contracts'
          });
        }
      }

      const whereClause = { employee_id: effectiveEmployeeId };
      if (status && status !== 'all') {
        // "terminated" filter includes both terminated and refunded statuses
        if (status === 'terminated') {
          whereClause.status = { [Op.in]: ['terminated', 'refunded'] };
        } else {
          whereClause.status = status;
        }
      }

      const deployedContracts = await DeployedContract.findAll({
        where: whereClause,
        include: [
          { model: JobPosting, as: 'jobPosting' },
          { model: Employee, as: 'employee' },
          { model: Employer, as: 'employer' }
        ],
        order: [['created_at', 'DESC']]
      });

      res.status(200).json({
        success: true,
        data: deployedContracts,
        count: deployedContracts.length
      });
    } catch (error) {
      console.error('Error fetching deployed contracts by employee:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching deployed contracts',
        error: error.message
      });
    }
  }

  // Get a single deployed contract by ID
  static async getDeployedContractById(req, res) {
    try {
      const { id } = req.params;

      const walletAddress = req.headers['x-wallet-address'] || req.query.wallet_address;

      const deployedContract = await DeployedContract.findByPk(id, {
        include: [
          { model: JobPosting, as: 'jobPosting' },
          { model: Employee, as: 'employee' },
          { model: Employer, as: 'employer' }
        ]
      });

      if (!deployedContract) {
        return res.status(404).json({
          success: false,
          message: 'Deployed contract not found'
        });
      }

      const isAdmin = isAdminWallet(walletAddress);
      const isEmployerByWallet = walletAddress && deployedContract.employer?.wallet_address?.toLowerCase() === walletAddress.toLowerCase();
      const isEmployeeByWallet = walletAddress && deployedContract.employee?.wallet_address?.toLowerCase() === walletAddress.toLowerCase();

      if (!isAdmin && !isEmployerByWallet && !isEmployeeByWallet) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to access this contract'
        });
      }

      res.status(200).json({
        success: true,
        data: deployedContract
      });
    } catch (error) {
      console.error('Error fetching deployed contract:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching deployed contract',
        error: error.message
      });
    }
  }

  // Update deployed contract status
  // Authorization: Admin, employer, or employee (with role-based status restrictions)
  static async updateDeployedContractStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'status is required'
        });
      }

      // Get requesting user's wallet address for authorization
      const walletAddress = req.headers['x-wallet-address'] || req.body.wallet_address;

      // Fetch contract with related employee and employer records
      const deployedContract = await DeployedContract.findByPk(id, {
        include: [
          { model: Employee, as: 'employee' },
          { model: Employer, as: 'employer' }
        ]
      });

      if (!deployedContract) {
        return res.status(404).json({
          success: false,
          message: 'Deployed contract not found'
        });
      }

      // Check authorization by wallet address
      const isAdmin = isAdminWallet(walletAddress);
      const isEmployer = walletAddress && deployedContract.employer?.wallet_address?.toLowerCase() === walletAddress.toLowerCase();
      const isEmployee = walletAddress && deployedContract.employee?.wallet_address?.toLowerCase() === walletAddress.toLowerCase();

      if (!isAdmin && !isEmployer && !isEmployee) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to modify this contract'
        });
      }

      // Validate status transitions based on role
      // Admin: can update to any status
      // Employer: can update to 'completed', 'disputed'
      // Employee: can update to 'disputed'
      const employerAllowedStatuses = ['completed', 'disputed'];
      const employeeAllowedStatuses = ['disputed'];

      if (!isAdmin) {
        if (isEmployer && !employerAllowedStatuses.includes(status)) {
          return res.status(403).json({
            success: false,
            message: `Employers can only set status to: ${employerAllowedStatuses.join(', ')}`
          });
        }
        if (isEmployee && !isEmployer && !employeeAllowedStatuses.includes(status)) {
          return res.status(403).json({
            success: false,
            message: `Employees can only set status to: ${employeeAllowedStatuses.join(', ')}`
          });
        }
      }

      await deployedContract.update({ status });

      // If contract moved to terminal state, check if job status should update
      if (TERMINAL_CONTRACT_STATUSES.includes(status)) {
        await updateJobStatusIfAllContractsComplete(deployedContract.job_posting_id);
      }

      res.status(200).json({
        success: true,
        data: deployedContract,
        message: 'Deployed contract updated successfully'
      });
    } catch (error) {
      console.error('Error updating deployed contract:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating deployed contract',
        error: error.message
      });
    }
  }

  // Get disputed contracts assigned to a specific mediator
  // TODO: Mediator verification needs wallet address support (see notes/privy-admin-mediator-auth.md)
  static async getDisputedContractsByMediator(req, res) {
    try {
      const { mediatorId } = req.params;
      const walletAddress = req.headers['x-wallet-address'] || req.query.wallet_address;

      if (!walletAddress) {
        return res.status(403).json({
          success: false,
          message: 'Unable to verify mediator identity. Please ensure your wallet is connected.'
        });
      }

      if (!isAdminWallet(walletAddress)) {
        // Look up mediator by wallet address
        const mediator = await Mediator.findOne({
          where: {
            wallet_address: walletAddress,
            status: 'active'
          },
          attributes: ['id']
        });

        if (!mediator || String(mediator.id) !== String(mediatorId)) {
          return res.status(403).json({
            success: false,
            message: 'Access denied for this mediator'
          });
        }
      }

      const contracts = await DeployedContract.findAll({
        where: {
          mediator_id: mediatorId,
          status: 'disputed'
        },
        include: [
          {
            model: Employee,
            as: 'employee',
            attributes: ['id', 'first_name', 'last_name', 'email', 'wallet_address']
          },
          {
            model: Employer,
            as: 'employer',
            attributes: ['id', 'company_name', 'wallet_address']
          },
          {
            model: JobPosting,
            as: 'jobPosting',
            attributes: ['id', 'title', 'description']
          }
        ],
        order: [['created_at', 'DESC']]
      });

      res.status(200).json({
        success: true,
        data: contracts,
        count: contracts.length
      });
    } catch (error) {
      console.error('Error fetching disputed contracts by mediator:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching disputed contracts',
        error: error.message
      });
    }
  }

  // Admin: Get all disputed contracts
  static async getDisputedContractsForAdmin(req, res) {
    try {
      const contracts = await DeployedContract.findAll({
        where: {
          status: 'disputed'
        },
        include: [
          {
            model: Employee,
            as: 'employee',
            attributes: ['id', 'first_name', 'last_name', 'email', 'wallet_address']
          },
          {
            model: Employer,
            as: 'employer',
            attributes: ['id', 'company_name', 'wallet_address']
          },
          {
            model: JobPosting,
            as: 'jobPosting',
            attributes: ['id', 'title', 'description']
          },
          {
            model: Mediator,
            as: 'mediator',
            attributes: ['id', 'email', 'first_name', 'last_name', 'wallet_address']
          }
        ],
        order: [['created_at', 'DESC']]
      });

      res.status(200).json({
        success: true,
        data: contracts,
        count: contracts.length
      });
    } catch (error) {
      console.error('Error fetching disputed contracts for admin:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching disputed contracts',
        error: error.message
      });
    }
  }

  // Admin: Assign mediator to disputed deployed contract
  static async assignMediatorToDeployedContract(req, res) {
    try {
      const { id } = req.params;
      const { mediator_id } = req.body;

      if (!mediator_id) {
        return res.status(400).json({
          success: false,
          message: 'mediator_id is required'
        });
      }

      // Fetch contract with employee and employer to check for conflicts
      const deployedContract = await DeployedContract.findByPk(id, {
        include: [
          { model: Employee, as: 'employee' },
          { model: Employer, as: 'employer' }
        ]
      });

      if (!deployedContract) {
        return res.status(404).json({
          success: false,
          message: 'Deployed contract not found'
        });
      }

      if (deployedContract.status !== 'disputed') {
        return res.status(400).json({
          success: false,
          message: 'Mediator can only be assigned to disputed contracts'
        });
      }

      if (deployedContract.mediator_id) {
        return res.status(400).json({
          success: false,
          message: 'Mediator already assigned'
        });
      }

      const mediator = await Mediator.findByPk(mediator_id);
      if (!mediator || mediator.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: 'Mediator is not active or does not exist'
        });
      }

      if (!mediator.wallet_address) {
        return res.status(400).json({
          success: false,
          message: 'Mediator does not have a wallet address on file'
        });
      }

      // Conflict check: mediator cannot be a party to the contract
      const mediatorWalletLower = mediator.wallet_address.toLowerCase();
      const employeeWalletLower = deployedContract.employee?.wallet_address?.toLowerCase();
      const employerWalletLower = deployedContract.employer?.wallet_address?.toLowerCase();

      if (employeeWalletLower === mediatorWalletLower) {
        return res.status(400).json({
          success: false,
          message: 'Mediator cannot be the employee of this contract'
        });
      }

      if (employerWalletLower === mediatorWalletLower) {
        return res.status(400).json({
          success: false,
          message: 'Mediator cannot be the employer of this contract'
        });
      }

      await deployedContract.update({ mediator_id });

      res.status(200).json({
        success: true,
        message: 'Mediator assigned successfully',
        data: deployedContract
      });
    } catch (error) {
      console.error('Error assigning mediator to deployed contract:', error);
      res.status(500).json({
        success: false,
        message: 'Error assigning mediator',
        error: error.message
      });
    }
  }

  // Update a deployed contract (general update)
  // Authorization: Admin, employer, employee, or assigned mediator
  static async updateDeployedContract(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Reject attempts to modify identity fields — these are set at creation and must never change
      const IMMUTABLE_FIELDS = ['contract_address', 'employer_id', 'employee_id', 'job_posting_id', 'payment_amount'];
      const attempted = IMMUTABLE_FIELDS.filter(f => f in updates);
      if (attempted.length > 0) {
        return res.status(400).json({
          success: false,
          message: `The following fields cannot be modified: ${attempted.join(', ')}`
        });
      }

      // Get requesting user's wallet address for authorization
      const walletAddress = req.headers['x-wallet-address'] || req.body.wallet_address;
      if (!walletAddress) {
        return res.status(403).json({
          success: false,
          message: 'Unable to verify user identity. Please ensure your wallet is connected.'
        });
      }

      // Fetch contract with related employee, employer, and mediator records
      const deployedContract = await DeployedContract.findByPk(id, {
        include: [
          { model: Employee, as: 'employee' },
          { model: Employer, as: 'employer' },
          { model: Mediator, as: 'mediator' }
        ]
      });

      if (!deployedContract) {
        return res.status(404).json({
          success: false,
          message: 'Deployed contract not found'
        });
      }

      // Check authorization by wallet address
      const isEmployer = walletAddress && deployedContract.employer?.wallet_address?.toLowerCase() === walletAddress.toLowerCase();
      const isEmployee = walletAddress && deployedContract.employee?.wallet_address?.toLowerCase() === walletAddress.toLowerCase();
      const isMediator = walletAddress && deployedContract.mediator?.wallet_address?.toLowerCase() === walletAddress.toLowerCase();
      const isAdmin = isAdminWallet(walletAddress);

      if (!isAdmin && !isEmployer && !isEmployee && !isMediator) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to modify this contract'
        });
      }

      // Base fields anyone with access can update
      const baseUpdateFields = ['status', 'verification_status'];

      // Additional fields admins can update for corrections
      const adminUpdateFields = [
        ...baseUpdateFields,
        'payment_amount',
        'started_at',
        'expected_end_date',
        'actual_end_date',
        'last_payment_date',
        'next_payment_date',
        'total_paid'
      ];

      const allowedUpdateFields = isAdmin ? adminUpdateFields : baseUpdateFields;
      const filteredUpdates = pickAllowedFields(updates, allowedUpdateFields);

      if (Object.keys(filteredUpdates).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No updatable fields provided'
        });
      }

      if (filteredUpdates.status) {
        const employerAllowedStatuses = ['completed', 'disputed'];
        const employeeAllowedStatuses = ['disputed'];
        const mediatorAllowedStatuses = ['completed', 'terminated']; // For dispute resolution

        if (!isAdmin) {
          if (isMediator && !mediatorAllowedStatuses.includes(filteredUpdates.status)) {
            return res.status(403).json({
              success: false,
              message: `Mediators can only set status to: ${mediatorAllowedStatuses.join(', ')}`
            });
          }
          if (isEmployer && !isMediator && !employerAllowedStatuses.includes(filteredUpdates.status)) {
            return res.status(403).json({
              success: false,
              message: `Employers can only set status to: ${employerAllowedStatuses.join(', ')}`
            });
          }
          if (isEmployee && !isEmployer && !isMediator && !employeeAllowedStatuses.includes(filteredUpdates.status)) {
            return res.status(403).json({
              success: false,
              message: `Employees can only set status to: ${employeeAllowedStatuses.join(', ')}`
            });
          }
        }
      }

      await deployedContract.update(filteredUpdates);

      // If contract moved to terminal state, check if job status should update
      if (filteredUpdates.status && TERMINAL_CONTRACT_STATUSES.includes(filteredUpdates.status)) {
        await updateJobStatusIfAllContractsComplete(deployedContract.job_posting_id);
      }

      res.status(200).json({
        success: true,
        data: deployedContract,
        message: 'Deployed contract updated successfully'
      });
    } catch (error) {
      console.error('Error updating deployed contract:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating deployed contract',
        error: error.message
      });
    }
  }

  // Complete contract and record payment atomically
  // This ensures both the contract status update and payment record are created together
  static async completeContractWithPayment(req, res) {
    const transaction = await sequelize.transaction();

    try {
      const { id } = req.params;
      const { tx_hash, amount, currency, from_address, to_address, block_number } = req.body;

      if (!tx_hash) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'tx_hash is required to record payment'
        });
      }

      // Get requesting user's wallet address for authorization
      const walletAddress = req.headers['x-wallet-address'] || req.body.wallet_address;

      // Fetch contract with related records
      const deployedContract = await DeployedContract.findByPk(id, {
        include: [
          { model: Employee, as: 'employee' },
          { model: Employer, as: 'employer' }
        ],
        transaction
      });

      if (!deployedContract) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Deployed contract not found'
        });
      }

      // Authorization check
      const isAdmin = isAdminWallet(walletAddress);
      const isEmployer = walletAddress && deployedContract.employer?.wallet_address?.toLowerCase() === walletAddress.toLowerCase();

      if (!isAdmin && !isEmployer) {
        await transaction.rollback();
        return res.status(403).json({
          success: false,
          message: 'Only the employer or admin can complete a contract'
        });
      }

      // Prevent completing already completed contracts
      if (deployedContract.status === 'completed') {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Contract is already completed'
        });
      }

      // Check if payment transaction already exists (idempotency)
      const existingPayment = await PaymentTransaction.findOne({
        where: { tx_hash },
        transaction
      });

      if (existingPayment) {
        await transaction.rollback();
        return res.status(200).json({
          success: true,
          message: 'Payment already recorded',
          data: {
            contract: deployedContract,
            payment: existingPayment
          }
        });
      }

      // Update contract status to completed
      await deployedContract.update({
        status: 'completed',
        verification_status: 'verified'
      }, { transaction });

      // Mark the application as completed so the worker can re-apply for remaining positions
      await JobApplication.update(
        { application_status: 'completed' },
        {
          where: {
            job_posting_id: deployedContract.job_posting_id,
            employee_id: deployedContract.employee_id,
          },
          transaction
        }
      );

      // Create payment transaction record
      const paymentTransaction = await PaymentTransaction.create({
        deployed_contract_id: deployedContract.id,
        amount: amount || deployedContract.payment_amount,
        currency: currency || deployedContract.payment_currency || 'USDC',
        payment_type: 'final',
        status: 'completed',
        tx_hash,
        from_address,
        to_address,
        block_number,
        processed_at: new Date()
      }, { transaction });

      // Commit the transaction
      await transaction.commit();

      // Update job status if all contracts are complete (non-critical, outside transaction)
      await updateJobStatusIfAllContractsComplete(deployedContract.job_posting_id);

      res.status(200).json({
        success: true,
        message: 'Contract completed and payment recorded successfully',
        data: {
          contract: deployedContract,
          payment: paymentTransaction
        }
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Error completing contract with payment:', error);
      res.status(500).json({
        success: false,
        message: 'Error completing contract',
        error: error.message
      });
    }
  }
}

module.exports = DeployedContractController;
