const { DisputeHistory, DeployedContract, Employee, Employer, Mediator, JobPosting } = require('../models');
const { Op } = require('sequelize');
const { logAction } = require('./auditLogController');
const { scopeToCaller } = require('../middleware/authorize');
const { pickAllowedFields } = require('../utils/fields');
const { resolveEmployee, resolveEmployer, resolveMediator, isAdminRequest } = require('../services/identityService');

// What a resolving mediator may write. mediator_id is absent deliberately: it is set from
// the resolving mediator's own verified identity, never from the payload. The timestamps
// are server-managed.
const ALLOWED_RESOLUTION_FIELDS = ['resolution', 'resolution_notes', 'resolution_tx_hash'];

// Which party the caller is on this contract, derived from the verified identity.
//
// The old form took raised_by_role plus raised_by_employee_id / raised_by_employer_id from
// the request body: the caller declared both which side of the dispute they were on and
// which id they were. That is the record of who raised a dispute, and it feeds mediation.
const partyOnContract = async (req, contract) => {
  const [employee, employer] = await Promise.all([resolveEmployee(req), resolveEmployer(req)]);
  if (employee && String(contract.employee_id) === String(employee.id)) {
    return { raised_by_role: 'employee', raised_by_employee_id: employee.id, raised_by_employer_id: null };
  }
  if (employer && String(contract.employer_id) === String(employer.id)) {
    return { raised_by_role: 'employer', raised_by_employer_id: employer.id, raised_by_employee_id: null };
  }
  return null;
};

class DisputeHistoryController {
  // Create a dispute record
  static async createDispute(req, res) {
    try {
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({
          success: false,
          message: 'reason is required'
        });
      }

      // The guard loaded the contract and proved the caller is a party to it. Which party
      // is then derived from the contract, not declared by the caller — the three
      // raised_by_* fields are no longer read from the body at all.
      const contract = req.resource;
      const raisedBy = await partyOnContract(req, contract);
      if (!raisedBy) {
        // A party to the contract who is neither its worker nor its employer — an assigned
        // mediator. A mediator resolves disputes; they do not raise them.
        return res.status(403).json({
          success: false,
          message: 'Only the worker or the employer on this contract can raise a dispute'
        });
      }

      const deployed_contract_id = contract.id;
      const dispute = await DisputeHistory.create({
        deployed_contract_id,
        ...raisedBy,
        reason,
        raised_at: new Date()
      });

      const contractForLog = await DeployedContract.findByPk(deployed_contract_id, {
        attributes: ['contract_address', 'employer_id', 'job_posting_id']
      });
      const jobPostingForLog = contractForLog?.job_posting_id
        ? await JobPosting.findByPk(contractForLog.job_posting_id, { attributes: ['title'] })
        : null;
      const jobTitleForLog = jobPostingForLog?.title || contractForLog?.contract_address || `Contract #${deployed_contract_id}`;
      await logAction({
        actorType: raisedBy.raised_by_role,
        actorId: raisedBy.raised_by_employee_id ?? raisedBy.raised_by_employer_id,
        actorName: null,
        actionType: 'dispute_created',
        actionDescription: `Dispute raised by ${raisedBy.raised_by_role} for "${jobTitleForLog}": "${reason}"`,
        entityType: 'dispute',
        entityId: dispute.id,
        entityIdentifier: jobTitleForLog,
        newValue: { reason, raised_by_role: raisedBy.raised_by_role, deployed_contract_id },
        employerId: contractForLog?.employer_id || null,
      });

      res.status(201).json({
        success: true,
        data: dispute,
        message: 'Dispute recorded successfully'
      });
    } catch (error) {
      console.error('Error creating dispute record:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating dispute record',
        error: error.message
      });
    }
  }

  // Get all disputes for an employer (for compliance view)
  // GET /api/dispute-history/employer — disputes on the calling employer's contracts.
  //
  // The employer id came from the path, and the response includes the worker's name and
  // email, so any authenticated caller could read any employer's dispute history along
  // with the workers involved (#152).
  static async getDisputesByEmployer(req, res) {
    try {
      const scope = await scopeToCaller(req, { allowAdmin: false });
      if (!scope) {
        return res.status(403).json({ success: false, message: 'Employer profile not found' });
      }

      const disputes = await DisputeHistory.findAll({
        include: [
          {
            model: DeployedContract,
            as: 'deployedContract',
            where: scope,
            include: [
              { model: JobPosting, as: 'jobPosting', attributes: ['id', 'title'] }
            ]
          },
          {
            model: Employee,
            as: 'raisedByEmployee',
            attributes: ['id', 'first_name', 'last_name', 'email']
          },
          {
            model: Employer,
            as: 'raisedByEmployer',
            attributes: ['id', 'company_name']
          },
          {
            model: Mediator,
            as: 'mediator',
            attributes: ['id', 'first_name', 'last_name', 'email']
          }
        ],
        order: [['raised_at', 'DESC']]
      });

      res.status(200).json({
        success: true,
        data: disputes,
        count: disputes.length
      });
    } catch (error) {
      console.error('Error fetching disputes:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching disputes',
        error: error.message
      });
    }
  }

  // Get dispute by contract ID
  // Disputes on one contract. The guard proved the caller is a party to it.
  static async getDisputesByContract(req, res) {
    try {
      const contractId = req.resource.id;

      const disputes = await DisputeHistory.findAll({
        where: { deployed_contract_id: contractId },
        include: [
          {
            model: Employee,
            as: 'raisedByEmployee',
            attributes: ['id', 'first_name', 'last_name', 'email']
          },
          {
            model: Employer,
            as: 'raisedByEmployer',
            attributes: ['id', 'company_name']
          },
          {
            model: Mediator,
            as: 'mediator',
            attributes: ['id', 'first_name', 'last_name', 'email']
          }
        ],
        order: [['raised_at', 'DESC']]
      });

      res.status(200).json({
        success: true,
        data: disputes,
        count: disputes.length
      });
    } catch (error) {
      console.error('Error fetching disputes for contract:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching disputes',
        error: error.message
      });
    }
  }

  // Update dispute (assign mediator, resolve, etc.)
  // Resolve a dispute. Only the mediator assigned to its contract, or an admin.
  //
  // This had no ownership check at all and wrote req.body wholesale, so any authenticated
  // caller could resolve any dispute — setting the resolution that decides who gets the
  // escrowed money — and could also write mediator_id, claiming to be the mediator on a
  // dispute they had nothing to do with (#152).
  //
  // The route guard admits any party to the contract; resolution is narrowed to the
  // mediator here, because raising a dispute and deciding it are different acts.
  static async updateDispute(req, res) {
    try {
      const dispute = req.resource;
      const contract = req.resourceParent;

      const isAdmin = isAdminRequest(req);
      const mediator = isAdmin ? null : await resolveMediator(req);
      const isAssignedMediator = !!mediator
        && contract?.mediator_id != null
        && String(contract.mediator_id) === String(mediator.id);

      if (!isAdmin && !isAssignedMediator) {
        return res.status(403).json({
          success: false,
          message: 'Only the mediator assigned to this contract can resolve its dispute'
        });
      }

      const updates = pickAllowedFields(req.body, ALLOWED_RESOLUTION_FIELDS);

      // Record WHO resolved it, from the verified identity.
      //
      // This is #146. The resolution UI never sent mediator_id and nothing derived it, so
      // dispute_history.mediator_id stayed NULL — and the audit entry below logs
      // `actorId: dispute.mediator_id`, which made every resolution anonymous in the
      // compliance record. Deriving it from the caller closes that.
      if (mediator && dispute.mediator_id == null) {
        updates.mediator_id = mediator.id;
        updates.mediator_assigned_at = dispute.mediator_assigned_at || new Date();
      }

      if (updates.resolution && !dispute.resolved_at) {
        updates.resolved_at = new Date();
      }

      await dispute.update(updates);

      if (updates.resolution) {
        const contractForLog = await DeployedContract.findByPk(dispute.deployed_contract_id, {
          attributes: ['employer_id', 'contract_address', 'job_posting_id'],
        });
        const jobPostingForLog = contractForLog?.job_posting_id
          ? await JobPosting.findByPk(contractForLog.job_posting_id, { attributes: ['title'] })
          : null;
        const jobTitleForLog = jobPostingForLog?.title || contractForLog?.contract_address || `Contract #${dispute.deployed_contract_id}`;
        await logAction({
          actorType: 'mediator',
          actorId: dispute.mediator_id || null,
          actorName: null,
          actionType: 'dispute_resolved',
          actionDescription: `Dispute resolved for "${jobTitleForLog}": ${updates.resolution.replace(/_/g, ' ')}`,
          entityType: 'dispute',
          entityId: dispute.id,
          entityIdentifier: jobTitleForLog,
          newValue: {
            resolution: updates.resolution,
            resolution_notes: updates.resolution_notes || null,
            resolution_tx_hash: updates.resolution_tx_hash || null,
          },
          employerId: contractForLog?.employer_id || null,
        });
      }

      res.status(200).json({
        success: true,
        data: dispute,
        message: 'Dispute updated successfully'
      });
    } catch (error) {
      console.error('Error updating dispute:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating dispute',
        error: error.message
      });
    }
  }
}

module.exports = DisputeHistoryController;
