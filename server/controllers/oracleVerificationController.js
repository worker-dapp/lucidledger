const { OracleVerification } = require('../models');
const { sequelize } = require('../config/database');
const { pickAllowedFields } = require('../utils/fields');

// Fields a client may write on an oracle verification. deployed_contract_id is set from the
// contract the route guard authorized, not from the payload, so a caller cannot attach a
// verification to a contract other than the one they were checked against.
const ALLOWED_VERIFICATION_FIELDS = [
  'oracle_type', 'verification_status', 'verified_at',
  'latitude', 'longitude', 'location_name', 'gps_accuracy_meters',
  'image_url', 'image_hash',
  'weight_recorded', 'weight_unit',
  'clock_in_time', 'clock_out_time', 'hours_worked',
  'tx_hash', 'block_number', 'notes'
];

class OracleVerificationController {
  // Create a new oracle verification record
  // Create a verification against a contract the caller is a party to.
  //
  // authorize('contractParty', { model: DeployedContract, paramName: 'deployed_contract_id',
  // from: 'body' }) loaded that contract and proved the caller is its employer, worker or
  // assigned mediator. Previously there was no check at all: any authenticated caller could
  // write verification records — the evidence work was performed — against any contract on
  // the platform (#152).
  static async createOracleVerification(req, res) {
    try {
      const { oracle_type } = req.body;

      if (!oracle_type) {
        return res.status(400).json({
          success: false,
          message: 'oracle_type is required'
        });
      }

      const oracleVerification = await OracleVerification.create({
        ...pickAllowedFields(req.body, ALLOWED_VERIFICATION_FIELDS),
        // From the authorized contract, never from the payload.
        deployed_contract_id: req.resource.id
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
  // Verifications for one contract. The guard proved the caller is a party to it.
  static async getOracleVerificationsByContract(req, res) {
    try {
      const verifications = await OracleVerification.findAll({
        where: { deployed_contract_id: req.resource.id },
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
  // Latest verification per oracle type. The guard proved the caller is a party.
  static async getLatestOracleVerifications(req, res) {
    try {
      const contract_id = req.resource.id;

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
