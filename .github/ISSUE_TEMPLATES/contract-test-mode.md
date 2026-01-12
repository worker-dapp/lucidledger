# Contract Test Mode for Production Employers

## Summary
Employers need a way to test their job contracts in production (with `DEMO_MODE=false`) before deploying them to real workers. Currently, self-dealing is blocked in production, preventing employers from testing their own contracts.

## Problem Statement

**Current Situation:**
- Production mode (`DEMO_MODE=false`) blocks self-dealing to prevent fraud
- Employers cannot apply to their own jobs to test:
  - Contract terms and workflow
  - Oracle verification systems (GPS, image upload, time tracking, etc.)
  - Payment release mechanisms
  - Smart contract interactions

**User Story:**
> As an employer in production, I want to test my job contract end-to-end before real workers apply, so that I can ensure the oracle settings, payment conditions, and contract terms work correctly.

## Use Cases

1. **New Employer Onboarding**: First-time employer wants to understand the full worker experience before hiring
2. **Oracle Testing**: Employer creating a GPS-based job wants to test location verification before deployment
3. **Contract Validation**: Employer with complex payment terms wants to verify smart contract logic
4. **Process Documentation**: Employer needs to train supervisors on the approval/verification workflow
5. **Troubleshooting**: Employer investigating issues with an existing contract setup

## Proposed Solutions

### Option 1: Per-Contract Test Mode Toggle ⭐ **RECOMMENDED**

**How it works:**
- Add `test_mode: boolean` field to `jobs` table
- Jobs marked as "test" are:
  - Visible only to the employer who created them
  - Allow self-dealing (employer can apply as employee)
  - Clearly labeled with "TEST MODE" badge
  - Can be converted to "live" mode or deleted
  - Optionally: Don't trigger real blockchain transactions (simulate)

**Pros:**
- ✅ Fine-grained control per contract
- ✅ Employer can test multiple contract configurations
- ✅ Clear visual distinction from real contracts
- ✅ No impact on production security settings
- ✅ Test data doesn't pollute real application database

**Cons:**
- ⚠️ More complex UI (toggle in job creation flow)
- ⚠️ Need to handle test contracts in all job list views
- ⚠️ Database schema change required

**Implementation Checklist:**
- [ ] Add `test_mode` boolean to `jobs` table migration
- [ ] Add test mode toggle to job creation form (step 6: review)
- [ ] Update job list queries to filter/label test jobs appropriately
- [ ] Modify `jobApplicationController.js` to allow self-dealing for test jobs
- [ ] Add "TEST MODE" badge to job cards and detail views
- [ ] Add "Convert to Live" action for test contracts
- [ ] Update smart contract interactions to simulate (optional)

---

### Option 2: Dedicated Test Worker Accounts

**How it works:**
- Platform provides "test worker" accounts (e.g., `test-worker-1@lucidledger.com`)
- Employers can use these accounts to test their contracts
- Test accounts are clearly labeled and don't appear in real worker pools

**Pros:**
- ✅ Simple to implement
- ✅ No database schema changes
- ✅ Works with existing self-dealing prevention

**Cons:**
- ❌ Employers need to manage multiple accounts (log in/out)
- ❌ Test accounts need separate wallet addresses for blockchain
- ❌ Less realistic testing (not their actual worker experience)
- ❌ Test data mixed with real data in database

---

### Option 3: Sandbox Environment

**How it works:**
- Separate staging/sandbox instance of the platform
- Employers can test freely with demo mode enabled
- Production remains locked down

**Pros:**
- ✅ Complete isolation from production data
- ✅ Safe for experimentation

**Cons:**
- ❌ Infrastructure overhead (duplicate deployment)
- ❌ Employers must switch between environments
- ❌ Sandbox data doesn't transfer to production
- ❌ Additional maintenance burden

---

### Option 4: Contract Preview/Simulation Mode

**How it works:**
- "Preview" button shows read-only walkthrough of contract flow
- Simulates oracle interactions without real data
- No blockchain transactions, no database records

**Pros:**
- ✅ Zero impact on production database
- ✅ Fast and lightweight
- ✅ Good for understanding workflow

**Cons:**
- ❌ Not a real end-to-end test
- ❌ Doesn't validate actual oracle integrations
- ❌ Can't test smart contract logic

---

## Technical Implementation (Option 1)

### Database Changes

**Migration**: `server/migrations/add-test-mode-to-jobs.sql`
```sql
ALTER TABLE jobs
ADD COLUMN test_mode BOOLEAN DEFAULT FALSE;

-- Index for filtering test jobs
CREATE INDEX idx_jobs_test_mode ON jobs(test_mode);

-- Update existing jobs to non-test mode
UPDATE jobs SET test_mode = FALSE WHERE test_mode IS NULL;
```

### Backend Changes

**File**: `server/controllers/jobApplicationController.js`
```javascript
// In applyToJob function, before wallet comparison:
const job = await Job.findByPk(job_id);

if (employee.wallet_address && employer.wallet_address &&
    employee.wallet_address.toLowerCase() === employer.wallet_address.toLowerCase()) {

  // Allow self-dealing for test mode contracts
  if (job.test_mode === true) {
    console.log(`✅ [TEST MODE] Self-dealing allowed for test contract: ${job.title}`);
    // Continue with application
  } else {
    // Production self-dealing prevention
    const isDemoMode = process.env.DEMO_MODE === 'true';
    if (!isDemoMode) {
      return res.status(403).json({
        success: false,
        message: 'Cannot apply to your own jobs'
      });
    }
  }
}
```

### Frontend Changes

**1. Job Creation Form** (`client/src/Form/ReviewAndSubmit.jsx`)
- Add checkbox: "Create as test contract (only visible to you)"
- Display warning: "Test contracts allow you to apply as a worker to test the full workflow"

**2. Job List Views** (`client/src/EmployeePages/EmployeeJobsPage.jsx`)
- Filter out test jobs from employee view (unless employer viewing their own)
- Show "TEST MODE" badge on employer's job list

**3. Job Detail View**
- Large "TEST MODE" banner at top
- "Convert to Live Contract" button (removes test mode, makes visible to all)
- "Delete Test Contract" button

**4. Employer Dashboard** (`client/src/EmployerPages/EmployerDashboard.jsx`)
- Separate section for "Test Contracts"
- Quick stats: "3 test contracts, 12 live contracts"

---

## Security Considerations

1. **Data Isolation**: Test contracts should not appear in worker job searches
2. **Conversion**: When converting test → live, verify no test applications exist
3. **Audit Trail**: Log all test mode contract actions for transparency
4. **Blockchain**: Consider simulating transactions for test contracts (don't spend real gas)
5. **Rate Limiting**: Limit number of test contracts per employer (e.g., max 5 active)

---

## User Experience Flow

### Creating a Test Contract
1. Employer completes job creation form
2. On review step, sees checkbox: ☑️ "Create as test contract"
3. Hover tooltip explains: "Test contracts let you apply as a worker to test oracles and payments"
4. After creation, redirected to job with "TEST MODE" banner

### Testing the Contract
1. Employer navigates to job search as employee (dual role)
2. Finds their test job in "My Test Contracts" section
3. Applies to job (self-dealing allowed because `test_mode=true`)
4. Completes work, submits oracle verification
5. Tests payment release and contract completion

### Going Live
1. Employer satisfied with test results
2. Clicks "Convert to Live Contract" button
3. Confirmation modal: "This will make the job visible to all workers. Test applications will be deleted. Continue?"
4. Job becomes visible in public job search, test applications removed

---

## Acceptance Criteria

- [ ] Employers can mark contracts as "test mode" during creation
- [ ] Test contracts are not visible to other workers
- [ ] Employers can apply to their own test contracts without 403 error
- [ ] Test contracts clearly labeled with "TEST MODE" badge
- [ ] Employers can convert test contracts to live contracts
- [ ] Converting removes all test applications
- [ ] Test contracts can be deleted without affecting live contracts
- [ ] Backend logs test mode self-dealing for audit purposes
- [ ] Documentation updated in `docs/SMART_CONTRACT_SECURITY.md`

---

## Related Documentation

- `docs/SMART_CONTRACT_SECURITY.md` - Self-dealing prevention
- `server/controllers/jobApplicationController.js` - Current self-dealing checks
- `CLAUDE.md` - Demo mode configuration (lines 283-287)

---

## Priority & Timeline

**Priority**: Medium (Post-MVP feature)
**Complexity**: Medium (requires DB migration, backend + frontend changes)
**Estimated Effort**: 8-12 hours
**Target Milestone**: v1.1 or v1.2 (after initial production launch)

**Dependencies**:
- Production deployment must be complete first
- Real employers should request this feature before prioritizing

---

## Alternative Considerations

**Could we just keep DEMO_MODE=true in production?**
- ❌ No - this allows ALL self-dealing, creating fraud risk
- Test mode is scoped to specific contracts, much safer

**Why not just use a staging environment?**
- Staging is good for internal testing
- Employers want to test in production environment with real data/blockchain
- Staging doesn't reflect production performance/behavior

**Is this a common feature?**
- Yes - Stripe has "test mode" toggle globally
- Shopify has "draft orders"
- GitHub Actions has manual workflow triggers
- Upwork has "private jobs" for testing

---

## Labels

- `enhancement`
- `feature-request`
- `post-mvp`
- `employer-experience`
- `security`

## Assignee

_To be assigned after production launch_
