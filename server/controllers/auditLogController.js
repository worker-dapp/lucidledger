const { AuditLog, OracleVerification } = require('../models');
const { Op } = require('sequelize');

// ---------------------------------------------------------------------------
// logAction — internal helper called by other controllers after key actions.
// Never throws — audit logging must never break the main operation.
// ---------------------------------------------------------------------------
const logAction = async ({
  actorType,
  actorId,
  actorName,
  actionType,
  actionDescription,
  entityType,
  entityId,
  entityIdentifier,
  oldValue = null,
  newValue = null,
  employerId = null,
}) => {
  try {
    await AuditLog.create({
      actor_type:        actorType,
      actor_id:          actorId,
      actor_name:        actorName,
      action_type:       actionType,
      action_description: actionDescription,
      entity_type:       entityType,
      entity_id:         entityId,
      entity_identifier: entityIdentifier,
      old_value:         oldValue,
      new_value:         newValue,
      employer_id:       employerId,
    });
  } catch (error) {
    console.error('Audit log write failed (non-blocking):', error.message);
  }
};

// ---------------------------------------------------------------------------
// GET /api/audit-log
// Query params: employer_id, action_type, entity_type, start_date, end_date, limit
// ---------------------------------------------------------------------------
const getAuditLog = async (req, res) => {
  try {
    const {
      employer_id,
      action_type,
      entity_type,
      start_date,
      end_date,
      limit = 200,
    } = req.query;

    const where = {};

    if (employer_id) {
      // Match entries directly tagged with this employer OR legacy entries
      // where the employer was the actor (before employer_id column was added)
      where[Op.or] = [
        { employer_id: employer_id },
        { actor_type: 'employer', actor_id: employer_id },
      ];
    }
    if (action_type) where.action_type = action_type;
    if (entity_type)  where.entity_type  = entity_type;

    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) where.created_at[Op.gte] = new Date(start_date);
      if (end_date)   where.created_at[Op.lte]  = new Date(end_date);
    }

    const logs = await AuditLog.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit: Math.min(parseInt(limit), 500),
    });

    // Enrich QR clock entries with on-chain tx_hash from oracle_verifications
    const oracleVerificationIds = logs
      .map(l => l.new_value?.oracleVerificationId)
      .filter(Boolean);

    if (oracleVerificationIds.length > 0) {
      const verifications = await OracleVerification.findAll({
        where: { id: oracleVerificationIds },
        attributes: ['id', 'tx_hash'],
      });
      const txHashById = Object.fromEntries(verifications.map(v => [v.id, v.tx_hash]));

      const enriched = logs.map(log => {
        const ovId = log.new_value?.oracleVerificationId;
        if (ovId && txHashById[ovId]) {
          const plain = log.toJSON();
          plain.new_value = { ...plain.new_value, txHash: txHashById[ovId] };
          return plain;
        }
        return log.toJSON();
      });

      return res.json({ data: enriched });
    }

    res.json({ data: logs });
  } catch (error) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({ error: 'Failed to fetch audit log' });
  }
};

module.exports = { logAction, getAuditLog };
