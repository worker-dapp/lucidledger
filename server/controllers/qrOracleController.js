const crypto = require('crypto');
const QRCode = require('qrcode');
const { sequelize } = require('../config/database');
const { QrToken, PresenceEvent, KioskDevice, OracleVerification, DeployedContract, Employee, Employer } = require('../models');
const { Op } = require('sequelize');
const { logAction } = require('./auditLogController');

// Per-kiosk cooldown: track last accepted scan timestamp in memory.
// Prevents duplicate scans from the camera decode loop (jsQR fires on every frame).
// 4-second window per kiosk device ID.
const COOLDOWN_MS = 4000;
const kioskLastScan = new Map(); // kioskDeviceId (string) → Date

class QrOracleController {

  // ---------------------------------------------------------------------------
  // POST /api/qr-tokens
  // Worker requests a fresh QR token for an active contract.
  // Auth: Privy JWT (verifyToken)
  // ---------------------------------------------------------------------------
  static async generateToken(req, res) {
    try {
      const { contract_id } = req.body;
      const walletAddress = req.headers['x-wallet-address'];

      if (!contract_id) {
        return res.status(400).json({ success: false, message: 'contract_id is required' });
      }

      // Resolve worker from wallet address
      const employee = await Employee.findOne({
        where: { wallet_address: { [Op.iLike]: walletAddress } }
      });
      if (!employee) {
        return res.status(404).json({ success: false, message: 'Employee profile not found' });
      }

      // Verify the contract exists, is active, and belongs to this worker
      const contract = await DeployedContract.findOne({
        where: { id: contract_id, employee_id: employee.id }
      });
      if (!contract) {
        return res.status(404).json({ success: false, message: 'Contract not found' });
      }
      if (contract.status !== 'active') {
        return res.status(400).json({ success: false, message: 'Contract is not active' });
      }

      // Generate a cryptographically random token (stored in plaintext — it is
      // the QR payload and has a 30-second TTL, so storing as plaintext is fine)
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes (TODO: reduce to 30s for production)

      await QrToken.create({
        token,
        deployed_contract_id: contract_id,
        employee_id: employee.id,
        expires_at: expiresAt
      });

      // Generate QR code as a data URL (PNG) server-side
      const qrDataUrl = await QRCode.toDataURL(token, {
        errorCorrectionLevel: 'L',
        width: 400,
        margin: 2
      });

      return res.status(201).json({
        success: true,
        data: { token, qrDataUrl, expiresAt }
      });
    } catch (error) {
      console.error('generateToken error:', error);
      return res.status(500).json({ success: false, message: 'Error generating QR token', error: error.message });
    }
  }

  // ---------------------------------------------------------------------------
  // POST /api/presence-events
  // Kiosk submits a scan event. Auth: kioskAuth middleware (x-kiosk-token).
  // Token consumption, presence event, and oracle verification are created
  // in a single transaction — token cannot be burned without an audit record.
  // ---------------------------------------------------------------------------
  static async submitPresenceEvent(req, res) {
    const { token, client_timestamp, nonce, latitude, longitude, gps_accuracy } = req.body;
    const kiosk = req.kioskDevice; // set by kioskAuth

    if (!token || !client_timestamp) {
      return res.status(400).json({ success: false, message: 'token and client_timestamp are required' });
    }

    // Per-kiosk cooldown check (in-memory, protects against camera loop duplicates)
    const lastScan = kioskLastScan.get(String(kiosk.id));
    if (lastScan && Date.now() - lastScan < COOLDOWN_MS) {
      return res.status(429).json({ success: false, message: 'Scan submitted too quickly — please wait a moment' });
    }

    let result;
    try {
      result = await sequelize.transaction(async (t) => {
        // Atomically consume the token: UPDATE where unused and not expired.
        // Returns 0 rows if already used or expired — no separate read needed.
        const [updatedRows] = await sequelize.query(
          `UPDATE qr_tokens
           SET used_at = NOW()
           WHERE token = :token
             AND used_at IS NULL
             AND expires_at > NOW()
           RETURNING *`,
          {
            replacements: { token },
            type: sequelize.QueryTypes.UPDATE,
            transaction: t
          }
        );

        if (!updatedRows || updatedRows.length === 0) {
          // Surface the reason for better kiosk UX
          const existing = await QrToken.findOne({ where: { token }, transaction: t });
          if (!existing) {
            throw Object.assign(new Error('Token not found'), { status: 404, code: 'TOKEN_NOT_FOUND' });
          }
          if (existing.used_at) {
            throw Object.assign(new Error('Token already used'), { status: 409, code: 'TOKEN_USED' });
          }
          throw Object.assign(new Error('Token has expired'), { status: 410, code: 'TOKEN_EXPIRED' });
        }

        const qrTokenRow = updatedRows[0];
        const { deployed_contract_id, employee_id } = qrTokenRow;

        // Verify contract is still active at scan time
        const contract = await DeployedContract.findByPk(deployed_contract_id, { transaction: t });
        if (!contract || contract.status !== 'active') {
          throw Object.assign(new Error('Contract is no longer active'), { status: 400, code: 'CONTRACT_INACTIVE' });
        }

        // Determine event type: alternate clock_in / clock_out
        const lastEvent = await PresenceEvent.findOne({
          where: { deployed_contract_id, employee_id },
          order: [['server_timestamp', 'DESC']],
          transaction: t
        });
        const eventType = (!lastEvent || lastEvent.event_type === 'clock_out') ? 'clock_in' : 'clock_out';

        // Create oracle_verifications record
        const oracleVerification = await OracleVerification.create({
          deployed_contract_id,
          oracle_type: 'qr',
          verification_status: 'verified',
          verified_at: new Date(),
          verified_by: employee_id,
          latitude: latitude || null,
          longitude: longitude || null,
          gps_accuracy_meters: gps_accuracy || null,
          clock_in_time: eventType === 'clock_in' ? new Date() : null,
          clock_out_time: eventType === 'clock_out' ? new Date() : null,
          notes: `QR ${eventType} via kiosk "${kiosk.site_name || kiosk.device_id}"`
        }, { transaction: t });

        // Create presence event
        const presenceEvent = await PresenceEvent.create({
          deployed_contract_id,
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

        return { presenceEvent, oracleVerification, contract, employee_id, eventType };
      });
    } catch (error) {
      const status = error.status || 500;
      const message = error.status ? error.message : 'Error processing scan event';
      if (!error.status) console.error('submitPresenceEvent error:', error);
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

    // Audit log (non-blocking)
    logAction({
      actorType: 'employee',
      actorId: employee_id,
      actorName: `${firstName} ${lastName}`.trim(),
      actionType: eventType === 'clock_in' ? 'qr_clock_in' : 'qr_clock_out',
      actionDescription: `Worker ${eventType.replace('_', ' ')} via QR scan at kiosk "${kiosk.site_name || kiosk.device_id}"`,
      entityType: 'deployed_contract',
      entityId: presenceEvent.deployed_contract_id,
      employerId: contract.employer_id,
      newValue: {
        eventType,
        serverTimestamp: presenceEvent.server_timestamp,
        kiosk: kiosk.site_name || kiosk.device_id,
        gps: latitude ? { latitude, longitude, accuracy: gps_accuracy } : null
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

  // ---------------------------------------------------------------------------
  // GET /api/presence-events?contract_id=X
  // Returns presence event history for a contract.
  // Auth: Privy JWT (verifyToken)
  // ---------------------------------------------------------------------------
  static async getPresenceEvents(req, res) {
    try {
      const { contract_id } = req.query;
      if (!contract_id) {
        return res.status(400).json({ success: false, message: 'contract_id is required' });
      }

      const events = await PresenceEvent.findAll({
        where: { deployed_contract_id: contract_id },
        include: [{ model: KioskDevice, as: 'kioskDevice', attributes: ['site_name', 'device_id'] }],
        order: [['server_timestamp', 'DESC']]
      });

      return res.status(200).json({ success: true, data: events });
    } catch (error) {
      console.error('getPresenceEvents error:', error);
      return res.status(500).json({ success: false, message: 'Error fetching presence events', error: error.message });
    }
  }

  // ---------------------------------------------------------------------------
  // POST /api/kiosk-devices
  // Employer registers a new kiosk device.
  // Auth: verifyToken + requireApprovedEmployer
  // Returns the raw token ONCE — only the hash is stored.
  // ---------------------------------------------------------------------------
  static async registerKiosk(req, res) {
    try {
      const { site_name } = req.body;
      const employer = req.employer; // set by requireApprovedEmployer

      // Generate device_id (stable identifier) and bearer token (secret)
      const deviceId = crypto.randomUUID();
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      const kiosk = await KioskDevice.create({
        device_id: deviceId,
        device_token_hash: tokenHash,
        employer_id: employer.id,
        site_name: site_name || null,
        status: 'active'
      });

      logAction({
        actorType: 'employer',
        actorId: employer.id,
        actorName: employer.company_name,
        actionType: 'kiosk_registered',
        actionDescription: `Kiosk device registered: ${site_name || deviceId}`,
        entityType: 'kiosk_device',
        entityId: kiosk.id,
        employerId: employer.id
      });

      // Return the raw token once — it is never retrievable again
      return res.status(201).json({
        success: true,
        data: {
          id: kiosk.id,
          deviceId,
          siteName: kiosk.site_name,
          registeredAt: kiosk.registered_at,
          // Raw token returned once only — employer must copy this now
          kioskToken: rawToken
        },
        message: 'Save this token now — it will not be shown again'
      });
    } catch (error) {
      console.error('registerKiosk error:', error);
      return res.status(500).json({ success: false, message: 'Error registering kiosk', error: error.message });
    }
  }

  // ---------------------------------------------------------------------------
  // GET /api/kiosk-devices
  // List the employer's registered kiosk devices.
  // Auth: verifyToken + requireApprovedEmployer
  // ---------------------------------------------------------------------------
  static async getKiosks(req, res) {
    try {
      const employer = req.employer;
      const kiosks = await KioskDevice.findAll({
        where: { employer_id: employer.id },
        attributes: [
          'id', 'device_id', 'site_name', 'status', 'registered_at',
          [sequelize.fn('COUNT', sequelize.col('presenceEvents.id')), 'scan_count'],
          [sequelize.fn('MAX', sequelize.col('presenceEvents.server_timestamp')), 'last_used_at']
        ],
        include: [{
          model: PresenceEvent,
          as: 'presenceEvents',
          attributes: [],
          required: false
        }],
        group: ['KioskDevice.id'],
        order: [['registered_at', 'DESC']]
      });
      return res.status(200).json({ success: true, data: kiosks });
    } catch (error) {
      console.error('getKiosks error:', error);
      return res.status(500).json({ success: false, message: 'Error fetching kiosks', error: error.message });
    }
  }

  // ---------------------------------------------------------------------------
  // POST /api/kiosk-devices/:id/regenerate-token
  // Generate a new token for an existing kiosk (invalidates old token).
  // Auth: verifyToken + requireApprovedEmployer
  // ---------------------------------------------------------------------------
  static async regenerateKioskToken(req, res) {
    try {
      const employer = req.employer;
      const kiosk = await KioskDevice.findOne({
        where: { id: req.params.id, employer_id: employer.id }
      });
      if (!kiosk) {
        return res.status(404).json({ success: false, message: 'Kiosk not found' });
      }

      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      await kiosk.update({ device_token_hash: tokenHash, status: 'active' });

      logAction({
        actorType: 'employer',
        actorId: employer.id,
        actorName: employer.company_name,
        actionType: 'kiosk_token_regenerated',
        actionDescription: `Kiosk token regenerated: ${kiosk.site_name || kiosk.device_id}`,
        entityType: 'kiosk_device',
        entityId: kiosk.id,
        employerId: employer.id
      });

      return res.status(200).json({
        success: true,
        data: {
          id: kiosk.id,
          deviceId: kiosk.device_id,
          siteName: kiosk.site_name,
          kioskToken: rawToken
        },
        message: 'Save this token now — it will not be shown again'
      });
    } catch (error) {
      console.error('regenerateKioskToken error:', error);
      return res.status(500).json({ success: false, message: 'Error regenerating token', error: error.message });
    }
  }

  // ---------------------------------------------------------------------------
  // PATCH /api/kiosk-devices/:id/suspend
  // Suspend a kiosk device.
  // Auth: verifyToken + requireApprovedEmployer
  // ---------------------------------------------------------------------------
  static async suspendKiosk(req, res) {
    try {
      const employer = req.employer;
      const kiosk = await KioskDevice.findOne({
        where: { id: req.params.id, employer_id: employer.id }
      });
      if (!kiosk) {
        return res.status(404).json({ success: false, message: 'Kiosk not found' });
      }
      await kiosk.update({ status: 'suspended' });
      return res.status(200).json({ success: true, message: 'Kiosk suspended' });
    } catch (error) {
      console.error('suspendKiosk error:', error);
      return res.status(500).json({ success: false, message: 'Error suspending kiosk', error: error.message });
    }
  }
}

module.exports = QrOracleController;
