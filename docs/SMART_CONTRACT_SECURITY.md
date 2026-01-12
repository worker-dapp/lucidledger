# Smart Contract Security

This document outlines security best practices for LucidLedger smart contracts, with a focus on preventing common attack vectors in job marketplace scenarios.

## Preventing Self-Dealing

### The Risk

In a dual-role marketplace where users can be both employers and employees, there's a theoretical risk of self-dealing:
- User creates a job as employer
- Applies to own job as employee
- Approves own work
- Receives payment from their own employer wallet

### Why This Isn't a Major Threat

**Blockchain transparency makes self-dealing easily auditable:**
- All transactions are public and permanent
- Wallet addresses are visible for employer and employee roles
- Pattern of same wallet → same wallet is immediately obvious
- Reputation damage far exceeds any short-term gain
- Cannot hide by creating new wallet (loses all reputation history)

### Required Mitigation: Smart Contract Validation

**Add this single line to all payment contracts:**

```solidity
// Prevent self-dealing at contract level
require(employerWallet != employeeWallet, "Cannot contract with yourself");
```

**Example Implementation:**

```solidity
contract JobPayment {
    address public employer;
    address public employee;

    constructor(address _employer, address _employee) {
        require(_employer != _employee, "Cannot contract with yourself");
        employer = _employer;
        employee = _employee;
    }

    function releasePayment() public {
        require(msg.sender == employer, "Only employer can release payment");
        require(workVerified, "Work must be verified first");
        // Payment logic...
    }
}
```

### Additional Backend Validation

**Backend API check (defense in depth):**

```javascript
// In job application controller
static async applyToJob(req, res) {
  const { employee_id, job_id } = req.body;

  // Get job and employee records
  const job = await Job.findByPk(job_id, { include: Employer });
  const employee = await Employee.findByPk(employee_id);

  // Prevent self-application
  if (job.Employer.wallet_address === employee.wallet_address) {
    return res.status(400).json({
      success: false,
      message: 'Cannot apply to your own jobs'
    });
  }

  // Continue with application...
}
```

### Frontend UX

**Hide self-owned jobs from application list:**

```javascript
// In job listing component
const canApply = job.employer_wallet !== currentUser.wallet_address;

{canApply ? (
  <Button onClick={handleApply}>Apply</Button>
) : (
  <Badge>Your Job</Badge>
)}
```

## Audit Trail

All self-dealing attempts (if they bypass frontend/backend) will be visible in:
1. **Blockchain explorer**: Transaction history shows wallet addresses
2. **Database audit query**:
```sql
-- Find all self-applications
SELECT
  jobs.id as job_id,
  jobs.title,
  employers.wallet_address as employer_wallet,
  employees.wallet_address as employee_wallet
FROM job_applications
JOIN jobs ON jobs.id = job_applications.job_id
JOIN employees ON employees.id = job_applications.employee_id
JOIN employers ON employers.id = jobs.employer_id
WHERE employees.wallet_address = employers.wallet_address;
```

## Oracle Verification Security

Self-dealing becomes harder with automated oracles:
- **GPS Oracle**: Can't fake location data from independent oracle
- **Image Oracle**: Would need to submit genuine proof photos
- **Weight Oracle**: Requires actual measurement from IoT device
- **Time Clock Oracle**: Tracks actual time spent
- **Manual Verification**: Still requires employer approval (but less trustworthy for self-dealing)

## Demo Mode for Testing

For development and demonstration purposes, self-dealing can be enabled via environment variable:

**Server** (`server/.env`):
```bash
DEMO_MODE=true  # Allows self-dealing for testing (DISABLE IN PRODUCTION!)
```

**Client** (`client/.env`):
```bash
VITE_DEMO_MODE=true  # Shows demo mode warnings and info banners
```

### How Demo Mode Works

**Backend Behavior**:
- Self-dealing attempts are logged with warnings in server console
- Transactions proceed (not blocked)
- Clear console messages: `⚠️ [DEMO MODE] Self-dealing detected but ALLOWED for testing`

**Frontend Behavior**:
- Blue info banner on job search page explains demo mode is active
- Users can test full workflow: create job → apply to own job → complete contract
- Banner is dismissible

**Important**: Always set `DEMO_MODE=false` before deploying to production!

### Future: Contract Test Mode

For production environments where demo mode is disabled, a future feature will allow employers to test individual contracts before deployment. See: `../.github/ISSUE_TEMPLATES/contract-test-mode.md`

**Proposed Feature**: Per-contract test mode toggle
- Employers can mark specific contracts as "test mode"
- Test contracts allow self-dealing for that contract only
- Test contracts not visible to real workers
- Can be converted to "live" mode when ready

This provides a production-safe way to test without enabling global demo mode.

## Recommendations

1. ✅ **Always use `require()` validation** in smart contracts
2. ✅ **Add backend checks** for defense in depth
3. ✅ **Monitor audit queries** periodically for suspicious patterns
4. ✅ **Prefer automated oracles** over manual verification
5. ✅ **Educate users** that blockchain transparency makes fraud obvious
6. ✅ **Use demo mode** for testing, but disable in production

## Future Enhancements

For additional security in production:
- Admin dashboard with fraud detection alerts
- Reputation system that flags unusual patterns
- Multi-signature requirements for high-value contracts
- Third-party dispute resolution for manual verification
- Insurance/escrow for large payments

## Contract Examples

See deployed contracts:
- **GPSBasedPayment**: `client/src/contracts/GPSBasedPayment.json`
- **GPSOracle**: `client/src/contracts/GPSOracle.json`

Both contracts should be updated to include wallet validation before deployment to production networks.
