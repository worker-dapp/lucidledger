# Security Improvements - Future Considerations

This document captures additional security improvements that were identified during the authorization fixes on 2026-01-22 but not implemented in that session.

---

## Completed in This Session

- [x] Fix `updateMediatorWallet` authorization (mediatorController.js)
- [x] Fix `updateDeployedContract` authorization (deployedContractController.js)
- [x] Fix `updateDeployedContractStatus` with role-based transitions
- [x] Add mediator-party conflict check in `assignMediatorToDeployedContract`
- [x] Create `adminUtils.js` for on-chain admin detection
- [x] Add wallet mismatch warning banner to AdminMediators page
- [x] Remove exposed ADMIN_EMAILS from client-side code

---

## Future Improvements (Not Yet Implemented)

### 1. Dedicated Admin Check Endpoint (LOW)

**Current State:** AdminMediators.jsx checks admin status by attempting to call `getAllMediators()` and catching 403 errors.

**Improvement:** Create a dedicated `/api/auth/check-admin` endpoint that returns `{ isAdmin: boolean }`. This is cleaner than relying on error handling for flow control.

```javascript
// server/routes/authRoutes.js
router.get('/check-admin', verifyToken, (req, res) => {
  const userEmail = getUserEmail(req.user);
  res.json({ isAdmin: isAdminEmail(userEmail) });
});
```

---

### 2. Wallet Address Validation (LOW)

**Current State:** Wallet addresses are stored as-is without validation.

**Improvement:** Add checksum validation for Ethereum addresses before storing:

```javascript
const { getAddress } = require('viem');

const validateWalletAddress = (address) => {
  try {
    return getAddress(address); // Returns checksummed address or throws
  } catch {
    return null;
  }
};
```

Apply to:
- `updateMediatorWallet`
- Employee/Employer creation
- Contract deployment records

---

### 3. Audit Logging for Sensitive Operations (MEDIUM)

**Current State:** No audit trail for admin actions.

**Improvement:** Log sensitive operations to a dedicated audit table:

```sql
CREATE TABLE audit_log (
  id SERIAL PRIMARY KEY,
  action VARCHAR(100) NOT NULL,
  actor_email VARCHAR(255),
  actor_wallet VARCHAR(42),
  target_type VARCHAR(50),
  target_id INTEGER,
  details JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT NOW()
);
```

Operations to log:
- Mediator creation/deletion/status changes
- Contract status changes
- Mediator assignments to disputes
- Admin access attempts (success/failure)

---

### 4. Rate Limiting on Admin Endpoints (LOW)

**Current State:** Global rate limit of 100 requests per 15 minutes applies to all endpoints.

**Improvement:** Add stricter rate limiting for admin endpoints:

```javascript
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // Stricter limit for admin actions
  message: { success: false, message: 'Too many admin requests' }
});

router.use('/mediators', verifyToken, verifyAdmin, adminLimiter);
```

---

### 5. Two-Factor for Admin Actions (MEDIUM-HIGH)

**Current State:** Admin actions only require valid JWT.

**Improvement:** Require re-authentication or 2FA for sensitive admin actions:
- Deleting mediators
- Assigning mediators to high-value disputes
- Changing contract statuses to 'resolved'

This could integrate with Dynamic Labs' MFA features.

---

### 6. Contract Amount Limits by Role (MEDIUM)

**Current State:** No validation on contract amounts during status changes.

**Improvement:** Add business logic validation:
- Only admin can mark contracts > $X as resolved
- Require mediator assignment for disputes > $Y
- Alert/flag unusual patterns (many disputes from same employer)

---

### 7. Immutable Fields Protection (LOW)

**Current State:** `updateDeployedContract` allows updating any field.

**Improvement:** Explicitly block updates to immutable fields:

```javascript
const IMMUTABLE_FIELDS = ['contract_address', 'job_posting_id', 'employee_id', 'employer_id', 'payment_amount'];

static async updateDeployedContract(req, res) {
  const updates = req.body;

  // Remove any immutable fields from updates
  IMMUTABLE_FIELDS.forEach(field => delete updates[field]);

  // ... rest of function
}
```

---

### 8. On-Chain Event Verification (HIGH - Future)

**Current State:** Backend trusts client-reported contract addresses.

**Improvement:** Verify contract deployment by checking on-chain events:
- Query `ContractDeployed` events from factory
- Verify the contract address exists and matches expected parameters
- This prevents spoofed contract records in the database

---

## Dispute Resolution Workflow Improvements

### 9. Automatic Mediator Response Timeout (MEDIUM-HIGH)

**Current State:** Once a mediator is assigned to a dispute, there's no deadline for resolution. Disputes could languish indefinitely.

**Improvement:** Implement automatic timeout with escalation:

```javascript
// Add to DeployedContract model
mediator_assigned_at: DataTypes.DATE,
resolution_deadline: DataTypes.DATE,

// Cron job or scheduled task
const checkDisputeTimeouts = async () => {
  const overdueDisputes = await DeployedContract.findAll({
    where: {
      status: 'disputed',
      mediator_id: { [Op.ne]: null },
      resolution_deadline: { [Op.lt]: new Date() }
    }
  });

  for (const dispute of overdueDisputes) {
    // Option A: Auto-reassign to different mediator
    // Option B: Escalate to admin
    // Option C: Default resolution in favor of worker (pro-worker policy)
    await notifyAdmin(dispute);
    await dispute.update({ escalated: true });
  }
};
```

**Configuration options:**
- Default timeout: 7 days after mediator assignment
- Warning notification at 5 days
- Allow mediator to request extension (with reason)

---

### 10. Mediator Performance Tracking (MEDIUM)

**Current State:** No metrics on mediator performance.

**Improvement:** Track mediator statistics:

```sql
-- Add to mediators table or create separate table
ALTER TABLE mediators ADD COLUMN disputes_resolved INTEGER DEFAULT 0;
ALTER TABLE mediators ADD COLUMN avg_resolution_time_hours DECIMAL(10,2);
ALTER TABLE mediators ADD COLUMN worker_favorable_rate DECIMAL(5,2);
ALTER TABLE mediators ADD COLUMN employer_favorable_rate DECIMAL(5,2);
ALTER TABLE mediators ADD COLUMN split_decision_rate DECIMAL(5,2);
```

Use cases:
- Admin dashboard showing mediator workload
- Auto-assignment based on availability/performance
- Flag mediators with consistently one-sided decisions for review

---

### 11. Dispute Evidence Submission Window (MEDIUM)

**Current State:** No structured evidence submission process.

**Improvement:** Implement time-bound evidence submission:

1. **Dispute initiated** → Both parties have 48 hours to submit evidence
2. **Evidence window closes** → Mediator reviews (no new evidence)
3. **Resolution** → Mediator makes decision

```javascript
// New fields
evidence_deadline: DataTypes.DATE,
employer_evidence_submitted: DataTypes.BOOLEAN,
worker_evidence_submitted: DataTypes.BOOLEAN,

// Evidence table
CREATE TABLE dispute_evidence (
  id SERIAL PRIMARY KEY,
  deployed_contract_id INTEGER REFERENCES deployed_contracts(id),
  submitted_by_role VARCHAR(20), -- 'employer' | 'worker'
  evidence_type VARCHAR(50), -- 'text' | 'image' | 'document' | 'oracle_data'
  content TEXT,
  file_url VARCHAR(500),
  submitted_at TIMESTAMP DEFAULT NOW()
);
```

---

### 12. Auto-Resolution for Uncontested Disputes (LOW)

**Current State:** All disputes require mediator intervention.

**Improvement:** If one party doesn't respond within the evidence window, auto-resolve in favor of the responding party:

```javascript
const checkUncontestedDisputes = async () => {
  const uncontested = await DeployedContract.findAll({
    where: {
      status: 'disputed',
      evidence_deadline: { [Op.lt]: new Date() },
      [Op.or]: [
        { employer_evidence_submitted: false },
        { worker_evidence_submitted: false }
      ]
    }
  });

  for (const dispute of uncontested) {
    if (!dispute.employer_evidence_submitted) {
      // Employer didn't respond - resolve for worker
      await autoResolve(dispute, 'worker');
    } else if (!dispute.worker_evidence_submitted) {
      // Worker didn't respond - resolve for employer
      await autoResolve(dispute, 'employer');
    }
  }
};
```

---

### 13. Dispute Notification System (MEDIUM-HIGH)

**Current State:** No automated notifications for dispute events.

**Improvement:** Email/SMS notifications for:
- Dispute initiated (notify both parties + admin)
- Mediator assigned (notify mediator + both parties)
- Evidence deadline approaching (24hr warning)
- Resolution deadline approaching (notify mediator)
- Dispute resolved (notify both parties)
- Funds released (notify recipient)

Integration options:
- SendGrid for email
- Twilio for SMS
- In-app notification center

---

### 14. Dispute Appeal Process (LOW - Future)

**Current State:** Mediator decision is final.

**Improvement:** Allow one appeal per dispute:
- Appeal window: 48 hours after resolution
- Appeal fee (refunded if appeal succeeds)
- Escalates to admin or panel of mediators
- Higher evidence burden for appellant

---

### 15. Smart Contract Timeout Enforcement (HIGH - On-Chain)

**Current State:** Smart contract has no built-in timeout for dispute resolution.

**Improvement:** Add on-chain timeout mechanism:

```solidity
// In ManualWorkContract.sol
uint256 public disputeDeadline;
uint256 public constant DISPUTE_TIMEOUT = 14 days;

function raiseDispute() external {
    // ... existing logic
    disputeDeadline = block.timestamp + DISPUTE_TIMEOUT;
}

function claimTimeoutResolution() external {
    require(status == Status.Disputed, "Not disputed");
    require(block.timestamp > disputeDeadline, "Deadline not passed");
    require(msg.sender == worker, "Only worker can claim timeout");

    // Auto-release funds to worker if mediator doesn't act
    _releaseFundsToWorker();
}
```

This ensures workers aren't left waiting indefinitely even if off-chain systems fail.

---

## Priority Order

### Security Fixes
1. **High:** On-chain event verification (prevents fraud)
2. **Medium:** Audit logging (compliance/debugging)
3. **Medium-High:** Two-factor for admin actions (security hardening)
4. **Low:** Dedicated admin check endpoint (code cleanliness)
5. **Low:** Wallet address validation (data integrity)
6. **Low:** Rate limiting on admin endpoints (abuse prevention)
7. **Low:** Immutable fields protection (data integrity)

### Dispute Resolution Workflow
1. **High:** Smart contract timeout enforcement (worker protection)
2. **Medium-High:** Automatic mediator response timeout (prevents stalled disputes)
3. **Medium-High:** Dispute notification system (UX critical)
4. **Medium:** Dispute evidence submission window (fair process)
5. **Medium:** Mediator performance tracking (quality control)
6. **Low:** Auto-resolution for uncontested disputes (efficiency)
7. **Low:** Dispute appeal process (future enhancement)

---

## Notes

- The current implementation fixes the critical authorization vulnerabilities
- Wallet mismatch warning prevents failed on-chain transactions
- Server-side admin verification is now the source of truth (not client-side email list)
- Dispute workflow improvements should be implemented alongside smart contract upgrades
- Consider worker protection as the default stance (platform mission alignment)
