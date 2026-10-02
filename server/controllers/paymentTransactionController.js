const { PaymentTransaction, DeployedContract, JobPosting, Employer } = require('../models');
const { Op } = require('sequelize');
const { scopeToCaller } = require('../middleware/authorize');
const { pickAllowedFields } = require('../utils/fields');

// deployed_contract_id is excluded: it is set from the contract the route guard authorized,
// so a caller cannot record a payment against a contract they were not checked against.
const ALLOWED_PAYMENT_FIELDS = [
  'amount', 'currency', 'payment_type', 'tx_hash', 'block_number',
  'from_address', 'to_address', 'status', 'processed_at', 'notes'
];

class PaymentTransactionController {
  // Get payment transactions for an employee (with job context)
  // GET /api/payment-transactions/employee — the calling worker's own payment history.
  //
  // The worker id came from the path, so any authenticated caller could read any worker's
  // earnings — amounts, counterparties and tx hashes (#152). The segment is removed rather
  // than ignored.
  static async getPaymentTransactionsByEmployee(req, res) {
    try {
      const scope = await scopeToCaller(req, { column: 'employee_id', as: 'employee', allowAdmin: false });
      if (!scope) {
        return res.status(403).json({ success: false, message: 'Employee profile not found' });
      }

      const transactions = await PaymentTransaction.findAll({
        where: {
          // Exclude employer refund transactions — those go back to the employer,
          // not to the worker, and should not appear in the worker's earnings.
          payment_type: { [Op.ne]: 'refund' },
        },
        include: [{
          model: DeployedContract,
          as: 'deployedContract',
          where: scope,
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

      // Calculate total earnings (only completed, worker-directed payments)
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
  // Record a payment against a contract the caller is a party to.
  //
  // The guard proved that. Previously nothing did: any authenticated caller could write
  // payment records against any contract, and payment records are what the workforce and
  // compliance views report as money moved (#152).
  static async createPaymentTransaction(req, res) {
    try {
      const { amount } = req.body;

      if (amount === undefined) {
        return res.status(400).json({
          success: false,
          message: 'amount is required'
        });
      }

      const paymentTransaction = await PaymentTransaction.create({
        ...pickAllowedFields(req.body, ALLOWED_PAYMENT_FIELDS),
        deployed_contract_id: req.resource.id
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
  // Payments on one contract. The guard proved the caller is a party to it.
  static async getPaymentTransactionsByContract(req, res) {
    try {
      const transactions = await PaymentTransaction.findAll({
        where: { deployed_contract_id: req.resource.id },
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

  // Every pending payment on the platform, for batch processing. Admin only.
  //
  // This had no filter of any kind, so any authenticated caller could read every
  // employer's outstanding payments — amounts and counterparties across the whole
  // platform (#152). Unlike the other reads here there is no caller to scope it to: "all
  // pending" is the question it exists to answer, which makes it an operations endpoint
  // and admin the only safe shape. It currently has no client caller at all; kept rather
  // than deleted, and flagged for review.
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
