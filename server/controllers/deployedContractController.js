const { DeployedContract, JobPosting, Employee } = require('../models');

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

      const deployedContract = await DeployedContract.create({
        job_posting_id,
        employee_id,
        employer_id,
        contract_address,
        payment_amount,
        ...payload
      });

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

      if (!employer_id) {
        return res.status(400).json({
          success: false,
          message: 'employer_id is required'
        });
      }

      const whereClause = { employer_id };
      if (status) {
        whereClause.status = status;
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

      const whereClause = { employee_id };
      if (status) {
        whereClause.status = status;
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

      const deployedContract = await DeployedContract.findByPk(id, {
        include: [
          { model: JobPosting, as: 'jobPosting' },
          { model: Employee, as: 'employee' }
        ]
      });

      if (!deployedContract) {
        return res.status(404).json({
          success: false,
          message: 'Deployed contract not found'
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
  static async updateDeployedContractStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, ...updates } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'status is required'
        });
      }

      const deployedContract = await DeployedContract.findByPk(id);

      if (!deployedContract) {
        return res.status(404).json({
          success: false,
          message: 'Deployed contract not found'
        });
      }

      await deployedContract.update({ status, ...updates });

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
}

module.exports = DeployedContractController;
