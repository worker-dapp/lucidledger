const { sequelize } = require('../config/database');
const { NfcBadge, PresenceEvent, KioskDevice, OracleVerification, DeployedContract, Employee, Employer } = require('../models');
const { Op } = require('sequelize');
const { logAction } = require('./auditLogController');
const { recordScanOnChain } = require('../services/nfcOracleService');

// Per-kiosk cooldown: track last accepted scan timestamp in memory.
// Prevents duplicate scans from the NFC read loop firing twice on a single tap.
// 4-second window per kiosk device ID.
const COOLDOWN_MS = 4000;
const kioskLastScan = new Map(); // kioskDeviceId (string) → Date

class NfcOracleController {

  // ---------------------------------------------------------------------------
  // POST /api/nfc-badges
  // Employer registers a new NFC badge (tap-to-read or manual UID entry).
  // Auth: verifyToken + requireApprovedEmployer
  // ---------------------------------------------------------------------------
  static async registerBadge(req, res) {
    try {
      const { badge_uid, employee_id, label } = req.body;
      const employer = req.employer;

      if (!badge_uid) {
        return res.status(400).json({ success: false, message: 'badge_uid is required' });
      }

      // If assigning to an employee, verify they belong to this employer
      if (employee_id) {
        const contract = await DeployedContract.findOne({
          where: { employer_id: employer.id, employee_id }
        });
        if (!contract) {
          return res.status(400).json({ success: false, message: 'Employee not found under this employer' });
        }
      }

      const badge = await NfcBadge.create({
        badge_uid: badge_uid.trim(),
        employer_id: employer.id,
        employee_id: employee_id || null,
        label: label?.trim() || null,
        status: 'active'
      });

      logAction({
        actorType: 'employer',
        actorId: employer.id,
        actorName: employer.company_name,
        actionType: 'nfc_badge_registered',
        actionDescription: `NFC badge registered: ${label || badge_uid}`,
        entityType: 'nfc_badge',
        entityId: badge.id,
        employerId: employer.id
      });

      return res.status(201).json({ success: true, data: badge });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ success: false, message: 'This badge UID is already registered for your account' });
      }
      console.error('registerBadge error:', error);
      return res.status(500).json({ success: false, message: 'Error registering badge', error: error.message });
    }
  }

  // ---------------------------------------------------------------------------
  // GET /api/nfc-badges
  // List the employer's registered NFC badges with assigned employee info.
  // Auth: verifyToken + requireApprovedEmployer
  // ---------------------------------------------------------------------------
  static async listBadges(req, res) {
    try {
      const employer = req.employer;
      const badges = await NfcBadge.findAll({
        where: { employer_id: employer.id },
        include: [{
          model: Employee,
          as: 'employee',
          attributes: ['id', 'first_name', 'last_name', 'email'],
          required: false
        }],
        order: [['registered_at', 'DESC']]
      });
      return res.status(200).json({ success: true, data: badges });
    } catch (error) {
      console.error('listBadges error:', error);
      return res.status(500).json({ success: false, message: 'Error fetching badges', error: error.message });
    }
  }

  // ---------------------------------------------------------------------------
  // PATCH /api/nfc-badges/:id/assign
  // Assign or unassign a badge to an employee.
  // Auth: verifyToken + requireApprovedEmployer
  // ---------------------------------------------------------------------------
  static async assignBadge(req, res) {
    try {
      const employer = req.employer;
      const badge = await NfcBadge.findOne({
        where: { id: req.params.id, employer_id: employer.id }
      });
      if (!badge) {
        return res.status(404).json({ success: false, message: 'Badge not found' });
      }

      const { employee_id, label } = req.body;

      // null employee_id means unassign (badge returned)
      if (employee_id !== undefined && employee_id !== null) {
        const contract = await DeployedContract.findOne({
          where: { employer_id: employer.id, employee_id }
        });
        if (!contract) {
          return res.status(400).json({ success: false, message: 'Employee not found under this employer' });
        }
      }

      await badge.update({
        employee_id: employee_id ?? null,
        ...(label !== undefined ? { label: label?.trim() || null } : {})
      });

      const updated = await NfcBadge.findByPk(badge.id, {
        include: [{ model: Employee, as: 'employee', attributes: ['id', 'first_name', 'last_name', 'email'], required: false }]
      });

      logAction({
        actorType: 'employer',
        actorId: employer.id,
        actorName: employer.company_name,
        actionType: employee_id ? 'nfc_badge_assigned' : 'nfc_badge_unassigned',
        actionDescription: employee_id
          ? `NFC badge ${badge.badge_uid} assigned to employee ${employee_id}`
          : `NFC badge ${badge.badge_uid} unassigned (returned)`,
        entityType: 'nfc_badge',
        entityId: badge.id,
        employerId: employer.id
      });

      return res.status(200).json({ success: true, data: updated });
    } catch (error) {
      console.error('assignBadge error:', error);
      return res.status(500).json({ success: false, message: 'Error assigning badge', error: error.message });
    }
  }

  // ---------------------------------------------------------------------------
  // PATCH /api/nfc-badges/:id/suspend
  // Suspend a badge (lost or stolen). Immediately blocks future scans.
  // Auth: verifyToken + requireApprovedEmployer
  // ---------------------------------------------------------------------------
  static async suspendBadge(req, res) {
    try {
      const employer = req.employer;
      const badge = await NfcBadge.findOne({
        where: { id: req.params.id, employer_id: employer.id }
      });
      if (!badge) {
        return res.status(404).json({ success: false, message: 'Badge not found' });
      }

      const { status } = req.body; // allow 'suspended' or 'lost'
      const newStatus = status === 'lost' ? 'lost' : 'suspended';
      await badge.update({ status: newStatus });

      logAction({
        actorType: 'employer',
        actorId: employer.id,
        actorName: employer.company_name,
        actionType: 'nfc_badge_suspended',
        actionDescription: `NFC badge ${badge.badge_uid} marked as ${newStatus}`,
        entityType: 'nfc_badge',
        entityId: badge.id,
        employerId: employer.id
      });

      return res.status(200).json({ success: true, message: `Badge marked as ${newStatus}` });
    } catch (error) {
      console.error('suspendBadge error:', error);
      return res.status(500).json({ success: false, message: 'Error suspending badge', error: error.message });
    }
  }

  // ---------------------------------------------------------------------------
  // POST /api/nfc-scans
  // Kiosk submits an NFC badge scan. Auth: kioskAuth middleware (x-kiosk-token).
  // Badge lookup, presence event, and oracle verification are created in a
  // single transaction.
  // ---------------------------------------------------------------------------
  static async submitNfcScan(req, res) {
    const { badge_uid, client_timestamp, nonce, latitude, longitude, gps_accuracy } = req.body;
    const kiosk = req.kioskDevice; // set by kioskAuth

    if (!badge_uid || !client_timestamp) {
      return res.status(400).json({ success: false, message: 'badge_uid and client_timestamp are required' });
    }

    // Per-kiosk cooldown check (in-memory, protects against NFC double-fire)
    const lastScan = kioskLastScan.get(String(kiosk.id));
    if (lastScan && Date.now() - lastScan < COOLDOWN_MS) {
      return res.status(429).json({ success: false, message: 'Scan submitted too quickly — please wait a moment' });
    }

    let result;
    try {
      result = await sequelize.transaction(async (t) => {
        // Look up the badge by UID scoped to this kiosk's employer
        const badge = await NfcBadge.findOne({
          where: {
            badge_uid,
            employer_id: kiosk.employer_id,
            status: 'active'
          },
          transaction: t
        });

        if (!badge) {
          // Distinguish between unknown UID and suspended badge for better kiosk UX
          const anyBadge = await NfcBadge.findOne({
            where: { badge_uid, employer_id: kiosk.employer_id },
            transaction: t
          });
          if (anyBadge) {
            throw Object.assign(new Error('Badge is suspended or lost'), { status: 403, code: 'BADGE_SUSPENDED' });
          }
          throw Object.assign(new Error('Badge not registered'), { status: 404, code: 'BADGE_NOT_FOUND' });
        }

        if (!badge.employee_id) {
          throw Object.assign(new Error('Badge is not assigned to any employee'), { status: 400, code: 'BADGE_UNASSIGNED' });
        }

        const employee_id = badge.employee_id;

        // Find the most recent active contract for this employee under this employer
        const contract = await DeployedContract.findOne({
          where: {
            employer_id: kiosk.employer_id,
            employee_id,
            status: 'active'
          },
          order: [['created_at', 'DESC']],
          transaction: t
        });

        if (!contract) {
          throw Object.assign(new Error('No active contract found for this employee'), { status: 400, code: 'CONTRACT_INACTIVE' });
        }

        // Determine event type: alternate clock_in / clock_out
        const lastEvent = await PresenceEvent.findOne({
          where: { deployed_contract_id: contract.id, employee_id },
          order: [['server_timestamp', 'DESC']],
          transaction: t
        });
        const eventType = (!lastEvent || lastEvent.event_type === 'clock_out') ? 'clock_in' : 'clock_out';

        // Create oracle_verifications record
        const oracleVerification = await OracleVerification.create({
          deployed_contract_id: contract.id,
          oracle_type: 'nfc',
          verification_status: 'verified',
          verified_at: new Date(),
          verified_by: employee_id,
          latitude: latitude || null,
          longitude: longitude || null,
          gps_accuracy_meters: gps_accuracy || null,
          clock_in_time: eventType === 'clock_in' ? new Date() : null,
          clock_out_time: eventType === 'clock_out' ? new Date() : null,
          notes: `NFC ${eventType} via kiosk "${kiosk.site_name || kiosk.device_id}" — badge ${badge_uid}`
        }, { transaction: t });

        // Create presence event
        const presenceEvent = await PresenceEvent.create({
          deployed_contract_id: contract.id,
          employee_id,
          kiosk_device_id: kiosk.id,
          event_type: eventType,
          client_timestamp: new Date(client_timestamp),
          latitude: latitude || null,
          longitude: longitude || null,
          gps_accuracy_meters: gps_accuracy || null,
          nonce: nonce || null,
          oracle_verification_id: oracleVerification.id
        }, { transaction: t });

        return { presenceEvent, oracleVerification, contract, employee_id, eventType, badge };
      });
    } catch (error) {
      const status = error.status || 500;
      const message = error.status ? error.message : 'Error processing NFC scan';
      if (!error.status) console.error('submitNfcScan error:', error);
      return res.status(status).json({ success: false, message, code: error.code });
    }

    // Update cooldown after successful transaction
    kioskLastScan.set(String(kiosk.id), Date.now());

    const { presenceEvent, employee_id, eventType, contract } = result;

    // Fetch worker name for kiosk display (outside transaction — non-critical)
    const employee = await Employee.findByPk(employee_id).catch(() => null);
    const firstName = employee?.first_name || '';
    const lastName = employee?.last_name || '';
    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

    // On-chain scan record (non-blocking — never delays kiosk response)
    if (contract.contract_address) {
      recordScanOnChain(contract.contract_address, eventType).then(async (txHash) => {
        if (txHash) {
          await OracleVerification.update(
            { tx_hash: txHash },
            { where: { id: result.oracleVerification.id } }
          ).catch(err => console.error('[NFCOracle] Failed to save tx_hash:', err.message));
        }
      }).catch(() => {});
    }

    // Audit log (non-blocking)
    logAction({
      actorType: 'employee',
      actorId: employee_id,
      actorName: `${firstName} ${lastName}`.trim(),
      actionType: eventType === 'clock_in' ? 'nfc_clock_in' : 'nfc_clock_out',
      actionDescription: `Worker ${eventType.replace('_', ' ')} via NFC badge at kiosk "${kiosk.site_name || kiosk.device_id}"`,
      entityType: 'deployed_contract',
      entityId: presenceEvent.deployed_contract_id,
      employerId: contract.employer_id,
      newValue: {
        eventType,
        serverTimestamp: presenceEvent.server_timestamp,
        kiosk: kiosk.site_name || kiosk.device_id,
        badgeUid: badge_uid,
        gps: latitude ? { latitude, longitude, accuracy: gps_accuracy } : null,
        oracleVerificationId: result.oracleVerification.id
      }
    });

    return res.status(201).json({
      success: true,
      data: {
        eventType,
        serverTimestamp: presenceEvent.server_timestamp,
        worker: { firstName, lastName, initials },
        kioskSiteName: kiosk.site_name,
        gps: latitude ? { latitude, longitude, accuracy: gps_accuracy } : null
      }
    });
  }
}

module.exports = NfcOracleController;
