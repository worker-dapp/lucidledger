const { parse } = require('json2csv');
const { DeployedContract, PaymentTransaction, OracleVerification, JobPosting, Employee, Employer, DisputeHistory, Mediator, sequelize } = require('../models');
const { Op, QueryTypes } = require('sequelize');

const BASESCAN_URL = process.env.BASESCAN_URL || 'https://base-sepolia.blockscout.com';

const dateRangeWhere = (start_date, end_date) => {
  if (!start_date && !end_date) return {};
  const range = {};
  if (start_date) range[Op.gte] = new Date(start_date);
  if (end_date)   range[Op.lte] = new Date(end_date);
  return { created_at: range };
};

const sendCsv = (res, csv, filename) => {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  // UTF-8 BOM ensures Excel/Numbers opens the file with correct encoding
  res.send('\uFEFF' + csv);
};

// GET /api/reports/workforce-summary
exports.exportWorkforceSummary = async (req, res) => {
  try {
    const { employer_id, start_date, end_date } = req.query;

    if (!employer_id) {
      return res.status(400).json({ error: 'employer_id is required' });
    }

    const contracts = await DeployedContract.findAll({
      where: { employer_id, ...dateRangeWhere(start_date, end_date) },
      include: [
        { model: Employee,   as: 'employee',   attributes: ['first_name', 'last_name', 'email'] },
        { model: JobPosting, as: 'jobPosting',  attributes: ['title', 'location', 'job_type'] },
      ],
      order: [['created_at', 'DESC']],
    });

    const rows = contracts.map((c) => ({
      worker_name:         `${c.employee?.first_name || ''} ${c.employee?.last_name || ''}`.trim() || '',
      email:               c.employee?.email || '',
      job_title:           c.jobPosting?.title || '',
      location:            c.jobPosting?.location || '',
      job_type:            c.jobPosting?.job_type || '',
      contract_status:     c.status,
      payment_amount:      c.payment_amount,
      payment_currency:    c.payment_currency || 'USDC',
      verification_status: c.verification_status || '',
      contract_address:    c.contract_address,
      contract_url:        c.contract_address && !c.contract_address.startsWith('0x000000')
                             ? `${BASESCAN_URL}/address/${c.contract_address}`
                             : '',
      deployed_at:         c.created_at ? new Date(c.created_at).toISOString() : '',
    }));

    const fields = ['worker_name','email','job_title','location','job_type','contract_status','payment_amount','payment_currency','verification_status','contract_address','contract_url','deployed_at'];
    const csv = parse(rows, { fields });
    const date = new Date().toISOString().split('T')[0];
    sendCsv(res, csv, `workforce_summary_${date}.csv`);
  } catch (error) {
    console.error('Error exporting workforce summary:', error);
    res.status(500).json({ error: 'Failed to export workforce summary' });
  }
};

// GET /api/reports/payment-history
exports.exportPaymentHistory = async (req, res) => {
  try {
    const { employer_id, start_date, end_date } = req.query;

    if (!employer_id) {
      return res.status(400).json({ error: 'employer_id is required' });
    }

    const payments = await PaymentTransaction.findAll({
      where: dateRangeWhere(start_date, end_date),
      include: [{
        model: DeployedContract,
        as: 'deployedContract',
        where: { employer_id },
        include: [
          { model: Employee,   as: 'employee',  attributes: ['first_name', 'last_name'] },
          { model: JobPosting, as: 'jobPosting', attributes: ['title'] },
        ],
      }],
      order: [['processed_at', 'DESC']],
    });

    const rows = payments.map((p) => ({
      worker_name:      `${p.deployedContract?.employee?.first_name || ''} ${p.deployedContract?.employee?.last_name || ''}`.trim() || '',
      job_title:        p.deployedContract?.jobPosting?.title || '',
      amount:           p.amount,
      currency:         p.currency,
      payment_type:     p.payment_type,
      status:           p.status,
      processed_at:     p.processed_at ? new Date(p.processed_at).toISOString() : '',
      tx_hash:          p.tx_hash || '',
      tx_url:           p.tx_hash
                          ? `${BASESCAN_URL}/tx/${p.tx_hash}`
                          : '',
      contract_address: p.deployedContract?.contract_address || '',
      contract_url:     p.deployedContract?.contract_address && !p.deployedContract.contract_address.startsWith('0x000000')
                          ? `${BASESCAN_URL}/address/${p.deployedContract.contract_address}`
                          : '',
    }));

    const fields = ['worker_name','job_title','amount','currency','payment_type','status','processed_at','tx_hash','tx_url','contract_address','contract_url'];
    const csv = parse(rows, { fields });
    const date = new Date().toISOString().split('T')[0];
    sendCsv(res, csv, `payment_history_${date}.csv`);
  } catch (error) {
    console.error('Error exporting payment history:', error);
    res.status(500).json({ error: 'Failed to export payment history' });
  }
};

// GET /api/reports/dispute-report
exports.exportDisputeReport = async (req, res) => {
  try {
    const { employer_id, start_date, end_date } = req.query;

    if (!employer_id) {
      return res.status(400).json({ error: 'employer_id is required' });
    }

    const disputes = await DisputeHistory.findAll({
      where: dateRangeWhere(start_date, end_date),
      include: [
        {
          model: DeployedContract,
          as: 'deployedContract',
          where: { employer_id },
          include: [
            { model: Employee,   as: 'employee',   attributes: ['first_name', 'last_name'] },
            { model: JobPosting, as: 'jobPosting',  attributes: ['title'] },
          ],
        },
        { model: Mediator, as: 'mediator', attributes: ['first_name', 'last_name'] },
      ],
      order: [['raised_at', 'DESC']],
    });

    const rows = disputes.map((d) => ({
      worker_name:          `${d.deployedContract?.employee?.first_name || ''} ${d.deployedContract?.employee?.last_name || ''}`.trim() || '',
      job_title:            d.deployedContract?.jobPosting?.title || '',
      raised_by:            d.raised_by_role || '',
      reason:               d.reason || '',
      raised_at:            d.raised_at ? new Date(d.raised_at).toISOString() : '',
      mediator_name:        d.mediator ? `${d.mediator.first_name || ''} ${d.mediator.last_name || ''}`.trim() : '',
      resolution:           d.resolution || '',
      resolved_at:          d.resolved_at ? new Date(d.resolved_at).toISOString() : '',
      resolution_notes:     d.resolution_notes || '',
      resolution_tx_hash:   d.resolution_tx_hash || '',
      resolution_tx_url:    d.resolution_tx_hash
                              ? `${BASESCAN_URL}/tx/${d.resolution_tx_hash}`
                              : '',
      contract_address:     d.deployedContract?.contract_address || '',
      contract_url:         d.deployedContract?.contract_address && !d.deployedContract.contract_address.startsWith('0x000000')
                              ? `${BASESCAN_URL}/address/${d.deployedContract.contract_address}`
                              : '',
    }));

    const fields = ['worker_name','job_title','raised_by','reason','raised_at','mediator_name','resolution','resolution_notes','resolved_at','resolution_tx_hash','resolution_tx_url','contract_address','contract_url'];
    const csv = parse(rows, { fields });
    const date = new Date().toISOString().split('T')[0];
    sendCsv(res, csv, `dispute_report_${date}.csv`);
  } catch (error) {
    console.error('Error exporting dispute report:', error);
    res.status(500).json({ error: 'Failed to export dispute report' });
  }
};

// GET /api/reports/oracle-verifications
exports.exportOracleVerifications = async (req, res) => {
  try {
    const { employer_id, start_date, end_date } = req.query;

    if (!employer_id) {
      return res.status(400).json({ error: 'employer_id is required' });
    }

    const verifications = await OracleVerification.findAll({
      where: dateRangeWhere(start_date, end_date),
      include: [{
        model: DeployedContract,
        as: 'deployedContract',
        where: { employer_id },
        include: [
          { model: Employee,   as: 'employee',  attributes: ['first_name', 'last_name'] },
          { model: JobPosting, as: 'jobPosting', attributes: ['title'] },
        ],
      }],
      order: [['created_at', 'DESC']],
    });

    const rows = verifications.map((v) => ({
      worker_name:         `${v.deployedContract?.employee?.first_name || ''} ${v.deployedContract?.employee?.last_name || ''}`.trim() || '',
      job_title:           v.deployedContract?.jobPosting?.title || '',
      oracle_type:         v.oracle_type,
      verification_status: v.verification_status,
      verified_at:         v.verified_at ? new Date(v.verified_at).toISOString() : '',
      latitude:            v.latitude ?? '',
      longitude:           v.longitude ?? '',
      hours_worked:        v.hours_worked ?? '',
      contract_address:    v.deployedContract?.contract_address || '',
      contract_url:        v.deployedContract?.contract_address && !v.deployedContract.contract_address.startsWith('0x000000')
                             ? `${BASESCAN_URL}/address/${v.deployedContract.contract_address}`
                             : '',
    }));

    const fields = ['worker_name','job_title','oracle_type','verification_status','verified_at','latitude','longitude','hours_worked','contract_address','contract_url'];
    const csv = parse(rows, { fields });
    const date = new Date().toISOString().split('T')[0];
    sendCsv(res, csv, `oracle_verifications_${date}.csv`);
  } catch (error) {
    console.error('Error exporting oracle verifications:', error);
    res.status(500).json({ error: 'Failed to export oracle verifications' });
  }
};

// GET /api/reports/overview
exports.getComplianceOverview = async (req, res) => {
  try {
    const { employer_id, start_date, end_date } = req.query;

    if (!employer_id) {
      return res.status(400).json({ error: 'employer_id is required' });
    }

    // Build optional date filter clause for raw queries
    const dateClause = [];
    const replacements = { employer_id };
    if (start_date) { dateClause.push('dc.created_at >= :start_date'); replacements.start_date = new Date(start_date); }
    if (end_date)   { dateClause.push('dc.created_at <= :end_date');   replacements.end_date   = new Date(end_date);   }
    const dateFilter = dateClause.length ? `AND ${dateClause.join(' AND ')}` : '';

    const [
      contractRows,
      workerRows,
      repeatWorkerRows,
      paymentRows,
      disputeRows,
      oracleRows,
    ] = await Promise.all([

      // Contract counts by status
      sequelize.query(`
        SELECT status, COUNT(*) AS count
        FROM deployed_contracts
        WHERE employer_id = :employer_id ${dateFilter}
        GROUP BY status
      `, { replacements, type: QueryTypes.SELECT }),

      // Unique worker count
      sequelize.query(`
        SELECT COUNT(DISTINCT employee_id) AS count
        FROM deployed_contracts
        WHERE employer_id = :employer_id ${dateFilter}
      `, { replacements, type: QueryTypes.SELECT }),

      // Repeat workers (more than one completed contract)
      sequelize.query(`
        SELECT COUNT(*) AS count FROM (
          SELECT employee_id
          FROM deployed_contracts
          WHERE employer_id = :employer_id AND status = 'completed'
          GROUP BY employee_id
          HAVING COUNT(*) > 1
        ) t
      `, { replacements: { employer_id }, type: QueryTypes.SELECT }),

      // Payment totals (completed payments only)
      sequelize.query(`
        SELECT
          COALESCE(SUM(pt.amount), 0) AS total_usdc,
          COUNT(pt.id)                AS payment_count
        FROM payment_transactions pt
        JOIN deployed_contracts dc ON dc.id = pt.deployed_contract_id
        WHERE dc.employer_id = :employer_id
          AND pt.status = 'completed'
          ${dateFilter}
      `, { replacements, type: QueryTypes.SELECT }),

      // Dispute stats
      sequelize.query(`
        SELECT
          COUNT(*)                                                          AS total,
          SUM(CASE WHEN dh.resolved_at IS NOT NULL THEN 1 ELSE 0 END)     AS resolved,
          AVG(CASE WHEN dh.resolved_at IS NOT NULL
            THEN EXTRACT(EPOCH FROM (dh.resolved_at - dh.raised_at)) / 86400
            ELSE NULL END)                                                 AS avg_resolution_days
        FROM dispute_history dh
        JOIN deployed_contracts dc ON dc.id = dh.deployed_contract_id
        WHERE dc.employer_id = :employer_id ${dateFilter}
      `, { replacements, type: QueryTypes.SELECT }),

      // Oracle verification pass rate
      sequelize.query(`
        SELECT ov.verification_status, COUNT(*) AS count
        FROM oracle_verifications ov
        JOIN deployed_contracts dc ON dc.id = ov.deployed_contract_id
        WHERE dc.employer_id = :employer_id ${dateFilter}
        GROUP BY ov.verification_status
      `, { replacements, type: QueryTypes.SELECT }),
    ]);

    // --- Shape contract health ---
    const contractByStatus = Object.fromEntries(
      contractRows.map((r) => [r.status, parseInt(r.count, 10)])
    );
    const totalContracts = Object.values(contractByStatus).reduce((a, b) => a + b, 0);
    const disputedCount  = contractByStatus.disputed || 0;

    // --- Shape oracle stats ---
    const oracleByStatus = Object.fromEntries(
      oracleRows.map((r) => [r.verification_status, parseInt(r.count, 10)])
    );
    const totalOracles    = Object.values(oracleByStatus).reduce((a, b) => a + b, 0);
    const verifiedOracles = oracleByStatus.verified || oracleByStatus.passed || 0;

    // --- Shape dispute stats ---
    const dispute      = disputeRows[0] || {};
    const totalDisputes = parseInt(dispute.total, 10) || 0;
    const resolvedDisputes = parseInt(dispute.resolved, 10) || 0;

    res.json({
      contracts: {
        total:       totalContracts,
        active:      contractByStatus.active      || 0,
        completed:   contractByStatus.completed   || 0,
        disputed:    contractByStatus.disputed    || 0,
        terminated:  (contractByStatus.terminated || 0) + (contractByStatus.refunded || 0),
        dispute_rate: totalContracts > 0
          ? ((totalDisputes / totalContracts) * 100).toFixed(1)
          : '0.0',
      },
      payments: {
        total_usdc:    parseFloat(paymentRows[0]?.total_usdc || 0).toFixed(2),
        payment_count: parseInt(paymentRows[0]?.payment_count, 10) || 0,
      },
      workers: {
        total_unique:  parseInt(workerRows[0]?.count, 10) || 0,
        repeat_workers: parseInt(repeatWorkerRows[0]?.count, 10) || 0,
      },
      disputes: {
        total:                totalDisputes,
        resolved:             resolvedDisputes,
        pending:              totalDisputes - resolvedDisputes,
        avg_resolution_days:  dispute.avg_resolution_days
          ? parseFloat(dispute.avg_resolution_days).toFixed(1)
          : null,
      },
      oracles: {
        total:     totalOracles,
        verified:  verifiedOracles,
        pass_rate: totalOracles > 0
          ? ((verifiedOracles / totalOracles) * 100).toFixed(1)
          : null,
      },
    });
  } catch (error) {
    console.error('Error fetching compliance overview:', error);
    res.status(500).json({ error: 'Failed to fetch compliance overview' });
  }
};
