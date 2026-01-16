const { OracleVerification } = require('../models');
const { sequelize } = require('../config/database');

class OracleVerificationController {
  // Create a new oracle verification record
  static async createOracleVerification(req, res) {
    try {
      const { deployed_contract_id, oracle_type, ...payload } = req.body;

      if (!deployed_contract_id || !oracle_type) {
        return res.status(400).json({
          success: false,
          message: 'deployed_contract_id and oracle_type are required'
        });
      }

      const oracleVerification = await OracleVerification.create({
        deployed_contract_id,
        oracle_type,
        ...payload
      });

      res.status(201).json({
        success: true,
        data: oracleVerification,
        message: 'Oracle verification created successfully'
      });
    } catch (error) {
      console.error('Error creating oracle verification:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating oracle verification',
        error: error.message
      });
    }
  }

  // Get all oracle verifications for a contract
  static async getOracleVerificationsByContract(req, res) {
    try {
      const { contract_id } = req.query;

      if (!contract_id) {
        return res.status(400).json({
          success: false,
          message: 'contract_id is required'
        });
      }

      const verifications = await OracleVerification.findAll({
        where: { deployed_contract_id: contract_id },
        order: [['created_at', 'DESC']]
      });

      res.status(200).json({
        success: true,
        data: verifications,
        count: verifications.length
      });
    } catch (error) {
      console.error('Error fetching oracle verifications:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching oracle verifications',
        error: error.message
      });
    }
  }

  // Get latest verification per oracle type for a contract
  static async getLatestOracleVerifications(req, res) {
    try {
      const { contract_id } = req.params;

      const latestRows = await sequelize.query(
        `SELECT DISTINCT ON (oracle_type) *
         FROM oracle_verifications
         WHERE deployed_contract_id = :contractId
         ORDER BY oracle_type, created_at DESC`,
        {
          replacements: { contractId: contract_id },
          type: sequelize.QueryTypes.SELECT
        }
      );

      res.status(200).json({
        success: true,
        data: latestRows,
        count: latestRows.length
      });
    } catch (error) {
      console.error('Error fetching latest oracle verifications:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching latest oracle verifications',
        error: error.message
      });
    }
  }
}

module.exports = OracleVerificationController;
