const { PaymentTransaction, DeployedContract, JobPosting, Employer } = require('../models');

class PaymentTransactionController {
  // Get payment transactions for an employee (with job context)
  static async getPaymentTransactionsByEmployee(req, res) {
    try {
      const { employeeId } = req.params;

      if (!employeeId) {
        return res.status(400).json({
          success: false,
          message: 'employeeId is required'
        });
      }

      const transactions = await PaymentTransaction.findAll({
        include: [{
          model: DeployedContract,
          as: 'deployedContract',
          where: { employee_id: employeeId },
          include: [
            {
              model: JobPosting,
              as: 'jobPosting',
              attributes: ['id', 'title', 'company_name']
            },
            {
              model: Employer,
              as: 'employer',
              attributes: ['id', 'company_name']
            }
          ]
        }],
        order: [['created_at', 'DESC']]
      });

      // Calculate total earnings
      const totalEarnings = transactions
        .filter(tx => tx.status === 'completed')
        .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);

      res.status(200).json({
        success: true,
        data: transactions,
        totalEarnings,
        count: transactions.length
      });
    } catch (error) {
      console.error('Error fetching payment transactions for employee:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching payment transactions',
        error: error.message
      });
    }
  }
  // Create a payment transaction record
  static async createPaymentTransaction(req, res) {
    try {
      const { deployed_contract_id, amount, ...payload } = req.body;

      if (!deployed_contract_id || amount === undefined) {
        return res.status(400).json({
          success: false,
          message: 'deployed_contract_id and amount are required'
        });
      }

      const paymentTransaction = await PaymentTransaction.create({
        deployed_contract_id,
        amount,
        ...payload
      });

      res.status(201).json({
        success: true,
        data: paymentTransaction,
        message: 'Payment transaction created successfully'
      });
    } catch (error) {
      console.error('Error creating payment transaction:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating payment transaction',
        error: error.message
      });
    }
  }

  // Get payment transactions for a contract
  static async getPaymentTransactionsByContract(req, res) {
    try {
      const { contract_id } = req.query;

      if (!contract_id) {
        return res.status(400).json({
          success: false,
          message: 'contract_id is required'
        });
      }

      const transactions = await PaymentTransaction.findAll({
        where: { deployed_contract_id: contract_id },
        order: [['created_at', 'DESC']]
      });

      res.status(200).json({
        success: true,
        data: transactions,
        count: transactions.length
      });
    } catch (error) {
      console.error('Error fetching payment transactions:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching payment transactions',
        error: error.message
      });
    }
  }

  // Get pending transactions for batch processing
  static async getPendingPaymentTransactions(req, res) {
    try {
      const transactions = await PaymentTransaction.findAll({
        where: { status: 'pending' },
        order: [['created_at', 'ASC']]
      });

      res.status(200).json({
        success: true,
        data: transactions,
        count: transactions.length
      });
    } catch (error) {
      console.error('Error fetching pending payment transactions:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching pending payment transactions',
        error: error.message
      });
    }
  }
}

module.exports = PaymentTransactionController;
