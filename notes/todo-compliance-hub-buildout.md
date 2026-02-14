# Compliance Hub Implementation Plan
**Status:** 95% Complete - Final 5% Remaining  
**Last Updated:** 2026-02-08  
**Estimated Time:** 10-13 hours total

---

## Overview

The three-page architecture is 95% complete. The remaining work is entirely in the **Compliance category**: consolidating the compliance page, adding audit logging, and building reporting/export functionality.

### What's Already Built ✅
- ✅ Contract Factory (100% complete)
- ✅ Workforce Dashboard (100% complete)
- ✅ Dispute tracking page (exists at `/dispute`)
- ✅ All core database tables except `audit_log`
- ✅ Backend APIs for all major features

### What Remains 🔨
1. **Compliance Page Consolidation** (UI refactor)
2. **Audit Log System** (Backend + Frontend)
3. **Reports & Exports** (Backend + Frontend)

---

## Phase 1: Compliance Page Consolidation
**Time Estimate:** 2-3 hours  
**Priority:** High (Quick Win)

### Goal
Transform `/dispute` into a comprehensive `/compliance` hub with tabbed navigation.

### Tasks

#### 1.1 Create Tabbed Compliance Hub Structure
**New Files:**
- `client/src/EmployerPages/ComplianceHub/index.jsx` (main page with tabs)
- `client/src/EmployerPages/ComplianceHub/DisputesTab.jsx`
- `client/src/EmployerPages/ComplianceHub/CompletedContractsTab.jsx`
- `client/src/EmployerPages/ComplianceHub/AuditLogTab.jsx` (placeholder)
- `client/src/EmployerPages/ComplianceHub/ReportsTab.jsx` (placeholder)

#### 1.2 Update Routes
**File:** `client/src/App.jsx`
```jsx
// Change from:
<Route path="/dispute" element={<Dispute />} />

// To:
<Route path="/compliance" element={<ComplianceHub />} />
```

#### 1.3 Migrate Existing Components
- Move `Dispute.jsx` content → `DisputesTab.jsx`
- Move `ReviewCompletedContracts.jsx` content → `CompletedContractsTab.jsx`
- **DONE**: `ReviewCompletedContracts.jsx` already updated to use `apiService.getDeployedContracts(employerId, 'completed')`

#### 1.4 Delete Redundant Files
- ❌ `client/src/EmployerPages/Dispute.jsx`
- ❌ `client/src/EmployerPages/ReviewCompletedContracts.jsx`
- ~~❌ `client/src/EmployerPages/ClosedContracts.jsx`~~ **DONE** — already deleted (was redundant with ReviewCompletedContracts)

#### 1.5 Tab Structure
```jsx
// client/src/EmployerPages/ComplianceHub/index.jsx
const ComplianceHub = () => {
  const [activeTab, setActiveTab] = useState("disputes");
  
  const tabs = [
    { id: "disputes", label: "Disputes", icon: Shield },
    { id: "completed", label: "Completed Contracts", icon: CheckCircle },
    { id: "audit", label: "Audit Log", icon: FileText },
    { id: "reports", label: "Reports & Exports", icon: Download }
  ];
  
  return (
    <EmployerLayout>
      <div className="container mx-auto">
        <h1>Compliance Hub</h1>
        <TabNavigation tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        {activeTab === "disputes" && <DisputesTab />}
        {activeTab === "completed" && <CompletedContractsTab />}
        {activeTab === "audit" && <AuditLogTab />}
        {activeTab === "reports" && <ReportsTab />}
      </div>
    </EmployerLayout>
  );
};
```

**Completion Criteria:**
- [ ] Route `/compliance` works and shows tabbed interface
- [ ] Disputes tab shows existing dispute functionality
- [ ] Completed Contracts tab shows completed deployed_contracts
- [ ] Navigation link labeled "Compliance" works correctly
- [ ] Old files deleted

---

## Phase 2: Audit Log System
**Time Estimate:** 3-4 hours  
**Priority:** High (Core Compliance Feature)

### Goal
Automatically track all employer actions for compliance audits.

### 2.1 Database Setup

#### Create Migration: `server/migrations/015-create-audit-log.sql`
*(013 is employer-approval, 014 is employee-profile-fields)*
```sql
-- Audit log for tracking all employer actions
CREATE TABLE IF NOT EXISTS public.audit_log (
  id BIGSERIAL PRIMARY KEY,
  
  -- Who performed the action
  actor_type VARCHAR(50) NOT NULL, -- 'employer', 'employee', 'mediator', 'system'
  actor_id BIGINT,
  actor_name VARCHAR(255),
  
  -- What action was performed
  action_type VARCHAR(100) NOT NULL, 
  -- Examples: 'contract_deployed', 'application_accepted', 'payment_processed',
  --           'dispute_created', 'status_changed', 'template_created', 'job_posted'
  
  action_description TEXT,
  
  -- What entity was affected
  entity_type VARCHAR(50) NOT NULL, -- 'deployed_contract', 'job_posting', 'application', 'payment', 'dispute'
  entity_id BIGINT,
  entity_identifier VARCHAR(255), -- Human-readable (contract address, job title, etc.)
  
  -- Change tracking
  old_value JSONB,
  new_value JSONB,
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX idx_audit_log_actor ON audit_log(actor_type, actor_id);
CREATE INDEX idx_audit_log_action ON audit_log(action_type);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at DESC);

COMMENT ON TABLE audit_log IS 'Complete audit trail of all employer actions for compliance';
```

**Run Migration:**
```bash
cd server
npm run migrate 015-create-audit-log.sql
```

### 2.2 Backend Model & Controller

#### Create Model: `server/models/AuditLog.js`
```javascript
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  actor_type: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  actor_id: DataTypes.BIGINT,
  actor_name: DataTypes.STRING(255),
  action_type: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  action_description: DataTypes.TEXT,
  entity_type: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  entity_id: DataTypes.BIGINT,
  entity_identifier: DataTypes.STRING(255),
  old_value: DataTypes.JSONB,
  new_value: DataTypes.JSONB,
  ip_address: DataTypes.INET,
  user_agent: DataTypes.TEXT,
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'audit_log',
  timestamps: false
});

module.exports = AuditLog;
```

#### Create Controller: `server/controllers/auditLogController.js`
```javascript
const AuditLog = require('../models/AuditLog');
const { Op } = require('sequelize');

exports.getAuditLog = async (req, res) => {
  try {
    const { 
      employer_id, 
      action_type, 
      entity_type,
      start_date,
      end_date,
      limit = 100 
    } = req.query;

    const where = {};
    
    if (employer_id) {
      where.actor_id = employer_id;
      where.actor_type = 'employer';
    }
    if (action_type) where.action_type = action_type;
    if (entity_type) where.entity_type = entity_type;
    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) where.created_at[Op.gte] = new Date(start_date);
      if (end_date) where.created_at[Op.lte] = new Date(end_date);
    }

    const logs = await AuditLog.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit)
    });

    res.json({ data: logs });
  } catch (error) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({ error: 'Failed to fetch audit log' });
  }
};

exports.exportAuditLog = async (req, res) => {
  // TODO: CSV export implementation
};

// Helper function to create audit log entries
exports.logAction = async ({
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
  ipAddress = null,
  userAgent = null
}) => {
  try {
    await AuditLog.create({
      actor_type: actorType,
      actor_id: actorId,
      actor_name: actorName,
      action_type: actionType,
      action_description: actionDescription,
      entity_type: entityType,
      entity_id: entityId,
      entity_identifier: entityIdentifier,
      old_value: oldValue,
      new_value: newValue,
      ip_address: ipAddress,
      user_agent: userAgent
    });
  } catch (error) {
    console.error('Error creating audit log entry:', error);
    // Don't throw - audit logging should never break main functionality
  }
};
```

#### Create Routes: `server/routes/auditLogRoutes.js`
```javascript
const express = require('express');
const AuditLogController = require('../controllers/auditLogController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', verifyToken, AuditLogController.getAuditLog);
router.get('/export', verifyToken, AuditLogController.exportAuditLog);

module.exports = router;
```

**Add to `server/server.js`:**
```javascript
const auditLogRoutes = require('./routes/auditLogRoutes');
app.use('/api/audit-log', auditLogRoutes);
```

### 2.3 Integrate Audit Logging into Existing Controllers

**Update these controllers to call `logAction()` after key operations:**

#### `deployedContractController.js`
```javascript
const { logAction } = require('./auditLogController');

// After contract deployment
exports.createDeployedContract = async (req, res) => {
  // ... existing code ...
  const contract = await DeployedContract.create({ ... });
  
  await logAction({
    actorType: 'employer',
    actorId: req.body.employer_id,
    actorName: employerName, // Get from employer table
    actionType: 'contract_deployed',
    actionDescription: `Deployed contract to ${contract.contract_address}`,
    entityType: 'deployed_contract',
    entityId: contract.id,
    entityIdentifier: contract.contract_address,
    newValue: { contract_address: contract.contract_address, status: 'active' },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });
  
  res.json({ data: contract });
};
```

#### `jobApplicationController.js`
```javascript
// After bulk accept/reject
exports.bulkUpdateApplicationStatus = async (req, res) => {
  // ... existing code ...
  
  await logAction({
    actorType: 'employer',
    actorId: employerId,
    actionType: 'applications_bulk_updated',
    actionDescription: `Bulk ${status} ${applicationIds.length} applications`,
    entityType: 'job_application',
    entityId: null, // Bulk action
    entityIdentifier: `${applicationIds.length} applications`,
    newValue: { status, count: applicationIds.length },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });
};
```

#### `paymentTransactionController.js`
```javascript
// After payment processing
await logAction({
  actorType: 'employer',
  actorId: employerId,
  actionType: 'payment_processed',
  actionDescription: `Processed payment of ${amount} ${currency}`,
  entityType: 'payment_transaction',
  entityId: payment.id,
  entityIdentifier: payment.tx_hash,
  newValue: { amount, currency, status: 'completed' }
});
```

### 2.4 Frontend - Audit Log Tab

#### Create: `client/src/EmployerPages/ComplianceHub/AuditLogTab.jsx`
```jsx
import React, { useEffect, useState } from "react";
import { FileText, Filter, Download, Search } from "lucide-react";
import apiService from "../../services/api";
import { useAuth } from "../../hooks/useAuth";

const actionTypeColors = {
  contract_deployed: "bg-blue-100 text-blue-700",
  application_accepted: "bg-green-100 text-green-700",
  payment_processed: "bg-purple-100 text-purple-700",
  dispute_created: "bg-yellow-100 text-yellow-700",
  status_changed: "bg-gray-100 text-gray-700",
};

const AuditLogTab = () => {
  const { smartWalletAddress } = useAuth();
  const [employerId, setEmployerId] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchEmployer = async () => {
      if (!smartWalletAddress) return;
      try {
        const response = await apiService.getEmployerByWallet(smartWalletAddress);
        if (response?.data?.id) {
          setEmployerId(response.data.id);
        }
      } catch (error) {
        console.error("Error fetching employer:", error);
      }
    };
    fetchEmployer();
  }, [smartWalletAddress]);

  useEffect(() => {
    const fetchLogs = async () => {
      if (!employerId) return;
      setLoading(true);
      try {
        const params = { employer_id: employerId };
        if (actionFilter !== "all") params.action_type = actionFilter;
        
        const response = await apiService.getAuditLog(params);
        setLogs(response?.data || []);
      } catch (error) {
        console.error("Error fetching audit log:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [employerId, actionFilter]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const filteredLogs = logs.filter((log) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      log.action_description?.toLowerCase().includes(term) ||
      log.entity_identifier?.toLowerCase().includes(term)
    );
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search audit log..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#EE964B]"
          />
        </div>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#EE964B]"
        >
          <option value="all">All Actions</option>
          <option value="contract_deployed">Contracts Deployed</option>
          <option value="application_accepted">Applications Accepted</option>
          <option value="payment_processed">Payments Processed</option>
          <option value="dispute_created">Disputes Created</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading audit log...</div>
      ) : filteredLogs.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600">No audit log entries found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => (
            <div key={log.id} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        actionTypeColors[log.action_type] || "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {log.action_type.replace(/_/g, " ").toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-400">{formatDate(log.created_at)}</span>
                  </div>
                  <p className="text-sm text-gray-700">{log.action_description}</p>
                  {log.entity_identifier && (
                    <p className="text-xs text-gray-500 mt-1">
                      Entity: {log.entity_type} - {log.entity_identifier}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AuditLogTab;
```

**Add API method to `client/src/services/api.js`:**
```javascript
getAuditLog: (params) => api.get('/audit-log', { params }),
```

**Completion Criteria:**
- [ ] `audit_log` table created and indexed
- [ ] Audit logging integrated into 5+ key controller actions
- [ ] AuditLogTab displays log entries correctly
- [ ] Filter and search work properly

---

## Phase 3: Reports & Exports
**Time Estimate:** 4-6 hours  
**Priority:** Medium (Compliance Requirement for Western Brands)

### Goal
Generate PDF/CSV reports for compliance audits.

### 3.1 Backend - CSV Exports

#### Install Dependencies
```bash
cd server
npm install json2csv
```

#### Create: `server/controllers/reportController.js`
```javascript
const { Parser } = require('json2csv');
const DeployedContract = require('../models/DeployedContract');
const PaymentTransaction = require('../models/PaymentTransaction');
const OracleVerification = require('../models/OracleVerification');
const { Op } = require('sequelize');

exports.exportWorkforceSummary = async (req, res) => {
  try {
    const { employer_id, start_date, end_date } = req.query;

    const where = { employer_id };
    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) where.created_at[Op.gte] = new Date(start_date);
      if (end_date) where.created_at[Op.lte] = new Date(end_date);
    }

    const contracts = await DeployedContract.findAll({
      where,
      include: [
        { association: 'employee', attributes: ['first_name', 'last_name', 'email'] },
        { association: 'jobPosting', attributes: ['title'] }
      ]
    });

    const data = contracts.map(c => ({
      worker_name: `${c.employee?.first_name || ''} ${c.employee?.last_name || ''}`.trim(),
      email: c.employee?.email,
      job_title: c.jobPosting?.title,
      contract_address: c.contract_address,
      status: c.status,
      payment_amount: c.payment_amount,
      payment_currency: c.payment_currency,
      started_at: c.started_at,
      verification_status: c.verification_status
    }));

    const parser = new Parser();
    const csv = parser.parse(data);

    res.header('Content-Type', 'text/csv');
    res.attachment(`workforce_summary_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Error exporting workforce summary:', error);
    res.status(500).json({ error: 'Failed to export workforce summary' });
  }
};

exports.exportPaymentHistory = async (req, res) => {
  try {
    const { employer_id, start_date, end_date } = req.query;

    const where = {};
    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) where.created_at[Op.gte] = new Date(start_date);
      if (end_date) where.created_at[Op.lte] = new Date(end_date);
    }

    const payments = await PaymentTransaction.findAll({
      where,
      include: [{
        association: 'deployedContract',
        where: { employer_id },
        include: [
          { association: 'employee', attributes: ['first_name', 'last_name'] },
          { association: 'jobPosting', attributes: ['title'] }
        ]
      }]
    });

    const data = payments.map(p => ({
      worker_name: `${p.deployedContract?.employee?.first_name || ''} ${p.deployedContract?.employee?.last_name || ''}`.trim(),
      job_title: p.deployedContract?.jobPosting?.title,
      amount: p.amount,
      currency: p.currency,
      payment_type: p.payment_type,
      status: p.status,
      tx_hash: p.tx_hash,
      processed_at: p.processed_at,
      contract_address: p.deployedContract?.contract_address
    }));

    const parser = new Parser();
    const csv = parser.parse(data);

    res.header('Content-Type', 'text/csv');
    res.attachment(`payment_history_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Error exporting payment history:', error);
    res.status(500).json({ error: 'Failed to export payment history' });
  }
};

exports.exportOracleVerifications = async (req, res) => {
  try {
    const { employer_id, start_date, end_date } = req.query;

    const where = {};
    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) where.created_at[Op.gte] = new Date(start_date);
      if (end_date) where.created_at[Op.lte] = new Date(end_date);
    }

    const verifications = await OracleVerification.findAll({
      where,
      include: [{
        association: 'deployedContract',
        where: { employer_id },
        include: [
          { association: 'employee', attributes: ['first_name', 'last_name'] },
          { association: 'jobPosting', attributes: ['title'] }
        ]
      }]
    });

    const data = verifications.map(v => ({
      worker_name: `${v.deployedContract?.employee?.first_name || ''} ${v.deployedContract?.employee?.last_name || ''}`.trim(),
      job_title: v.deployedContract?.jobPosting?.title,
      oracle_type: v.oracle_type,
      verification_status: v.verification_status,
      verified_at: v.verified_at,
      latitude: v.latitude,
      longitude: v.longitude,
      hours_worked: v.hours_worked,
      contract_address: v.deployedContract?.contract_address
    }));

    const parser = new Parser();
    const csv = parser.parse(data);

    res.header('Content-Type', 'text/csv');
    res.attachment(`oracle_verifications_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Error exporting oracle verifications:', error);
    res.status(500).json({ error: 'Failed to export oracle verifications' });
  }
};
```

#### Create Routes: `server/routes/reportRoutes.js`
```javascript
const express = require('express');
const ReportController = require('../controllers/reportController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/workforce-summary', verifyToken, ReportController.exportWorkforceSummary);
router.get('/payment-history', verifyToken, ReportController.exportPaymentHistory);
router.get('/oracle-verifications', verifyToken, ReportController.exportOracleVerifications);

module.exports = router;
```

**Add to `server/server.js`:**
```javascript
const reportRoutes = require('./routes/reportRoutes');
app.use('/api/reports', reportRoutes);
```

### 3.2 Frontend - Reports Tab

#### Create: `client/src/EmployerPages/ComplianceHub/ReportsTab.jsx`
```jsx
import React, { useState, useEffect } from "react";
import { Download, Calendar, FileText } from "lucide-react";
import apiService from "../../services/api";
import { useAuth } from "../../hooks/useAuth";

const ReportsTab = () => {
  const { smartWalletAddress } = useAuth();
  const [employerId, setEmployerId] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    const fetchEmployer = async () => {
      if (!smartWalletAddress) return;
      try {
        const response = await apiService.getEmployerByWallet(smartWalletAddress);
        if (response?.data?.id) {
          setEmployerId(response.data.id);
        }
      } catch (error) {
        console.error("Error fetching employer:", error);
      }
    };
    fetchEmployer();
  }, [smartWalletAddress]);

  const handleDownload = async (reportType) => {
    if (!employerId) return;
    
    setDownloading(reportType);
    try {
      const params = { employer_id: employerId };
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      let response;
      if (reportType === 'workforce') {
        response = await apiService.exportWorkforceSummary(params);
      } else if (reportType === 'payments') {
        response = await apiService.exportPaymentHistory(params);
      } else if (reportType === 'oracles') {
        response = await apiService.exportOracleVerifications(params);
      }

      // Create download link
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(`Error downloading ${reportType} report:`, error);
      alert(`Failed to download ${reportType} report`);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-[#0D3B66] mb-2">Generate Compliance Reports</h2>
        <p className="text-sm text-gray-600">
          Export data for brand audits and compliance verification.
        </p>
      </div>

      {/* Date Range Filter */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Date Range (Optional)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#EE964B]"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#EE964B]"
            />
          </div>
        </div>
      </div>

      {/* Report Cards */}
      <div className="space-y-4">
        {/* Workforce Summary */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-5 w-5 text-[#0D3B66]" />
                <h3 className="text-lg font-semibold text-[#0D3B66]">Workforce Summary</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Complete list of all workers, contracts, and verification status.
              </p>
              <div className="text-xs text-gray-500">
                <strong>Includes:</strong> Worker names, job titles, contract addresses, payment details, verification status
              </div>
            </div>
            <button
              onClick={() => handleDownload('workforce')}
              disabled={!employerId || downloading === 'workforce'}
              className="ml-4 bg-[#EE964B] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#d97b33] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {downloading === 'workforce' ? 'Downloading...' : 'Download CSV'}
            </button>
          </div>
        </div>

        {/* Payment History */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-5 w-5 text-[#0D3B66]" />
                <h3 className="text-lg font-semibold text-[#0D3B66]">Payment History</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                All payments processed with blockchain transaction hashes.
              </p>
              <div className="text-xs text-gray-500">
                <strong>Includes:</strong> Worker names, amounts, currencies, transaction hashes, payment dates
              </div>
            </div>
            <button
              onClick={() => handleDownload('payments')}
              disabled={!employerId || downloading === 'payments'}
              className="ml-4 bg-[#EE964B] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#d97b33] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {downloading === 'payments' ? 'Downloading...' : 'Download CSV'}
            </button>
          </div>
        </div>

        {/* Oracle Verifications */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-5 w-5 text-[#0D3B66]" />
                <h3 className="text-lg font-semibold text-[#0D3B66]">Oracle Verifications</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                GPS check-ins, time clock logs, and all verification records.
              </p>
              <div className="text-xs text-gray-500">
                <strong>Includes:</strong> Oracle types, verification status, GPS coordinates, hours worked, timestamps
              </div>
            </div>
            <button
              onClick={() => handleDownload('oracles')}
              disabled={!employerId || downloading === 'oracles'}
              className="ml-4 bg-[#EE964B] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#d97b33] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {downloading === 'oracles' ? 'Downloading...' : 'Download CSV'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsTab;
```

**Add API methods to `client/src/services/api.js`:**
```javascript
exportWorkforceSummary: (params) => api.get('/reports/workforce-summary', { params, responseType: 'blob' }),
exportPaymentHistory: (params) => api.get('/reports/payment-history', { params, responseType: 'blob' }),
exportOracleVerifications: (params) => api.get('/reports/oracle-verifications', { params, responseType: 'blob' }),
```

**Completion Criteria:**
- [ ] CSV export endpoints working for all 3 report types
- [ ] ReportsTab allows date range filtering
- [ ] Downloads generate proper CSV files
- [ ] CSV files contain all expected columns

---

## Testing Checklist

### Phase 1 Testing
- [ ] Navigate to `/compliance` - page loads
- [ ] All 4 tabs are visible
- [ ] Disputes tab shows existing disputes
- [ ] Completed Contracts tab shows completed contracts
- [ ] Old routes (`/dispute`, `/review-completed-contracts`) no longer exist
- [ ] Navigation "Compliance" link works

### Phase 2 Testing
- [ ] Create a test contract - check audit log
- [ ] Accept an application - check audit log
- [ ] Process a payment - check audit log
- [ ] Audit log displays correctly in UI
- [ ] Filter by action type works
- [ ] Search works

### Phase 3 Testing
- [ ] Download workforce summary CSV - opens in Excel
- [ ] Download payment history CSV - contains tx hashes
- [ ] Download oracle verifications CSV - contains GPS data
- [ ] Date range filtering works
- [ ] CSV files have proper headers

---

## Success Metrics

✅ **Compliance Hub is complete when:**
1. `/compliance` route has 4 functional tabs
2. `audit_log` table captures 5+ action types
3. 3 CSV export types work correctly
4. All old compliance-related files deleted
5. All tests pass

---

## Future Enhancements (Optional)

**Post-MVP improvements:**
- PDF generation (using Puppeteer or pdfkit)
- Charts and visualizations in reports
- Email delivery of reports
- Scheduled report generation
- Audit log webhook notifications
- Multi-currency support in reports
- Custom report builder UI

---

## Pre-Requisite: Update Employer Nav Link

When the Compliance Hub is built, update the "Compliance" nav link in `EmployerLayout.jsx` from `/dispute` to `/compliance`.

---

## Notes

- **No breaking changes** - All existing functionality preserved
- **Backwards compatible** - Old dispute data migrates seamlessly
- **Low risk** - Audit logging is non-blocking (errors don't break workflows)
- **Incremental** - Each phase can be deployed independently

**Estimated Total Time:** 10-13 hours (over 2-3 days)
