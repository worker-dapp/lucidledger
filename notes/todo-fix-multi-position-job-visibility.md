# Fix: Multi-Position Jobs Disappear After First Position Fills

**STATUS: RESOLVED** — Fixed in `fix/bugs-and-quick-wins` branch. Used Option C (combination): backend checks `positions_available` before transitioning status, frontend also shows `in_progress` jobs with open positions. Same fix applied to `syncContractState.js`.

## Bug
When an employer posts a job with multiple open positions (e.g., 5), and the first position gets filled (contract deployed), the entire job disappears from the "Posted Jobs" tab. It should remain visible showing "1 filled / 4 available".

## Root Cause

### Backend status transition
`server/controllers/deployedContractController.js` lines 33-37:
```javascript
// When ANY contract is deployed, job status changes to 'in_progress'
await JobPosting.update(
  { status: 'in_progress' },
  { where: { id: jobPostingId, status: 'active' } }
);
```
This fires on the first contract deployment regardless of how many positions remain open.

### Frontend filter
`client/src/EmployerPages/ContractFactory/PostedJobsTab.jsx` lines 42-44:
```javascript
let filtered = jobPostings.filter((posting) =>
  posting.status === "active" || posting.status === "draft"
);
```
Only shows `"active"` and `"draft"` jobs — `"in_progress"` jobs are excluded.

### Status flow
```
active → in_progress (first contract deployed)
in_progress → completed (all contracts completed)
in_progress → closed (all contracts refunded/terminated)
```

## Relevant fields
The `JobPosting` model already tracks positions correctly:
- `positions_available` (total positions to fill)
- `positions_filled` (how many have been filled)

These fields exist but aren't used in the status transition logic.

## Fix Options

### Option A: Keep job active until all positions filled (recommended)
Modify `deployedContractController.js` to only transition to `'in_progress'` when `positions_filled >= positions_available`:
```javascript
const job = await JobPosting.findByPk(jobPostingId);
if (job.positions_filled >= job.positions_available) {
  await job.update({ status: 'in_progress' });
}
```
**Pro:** Cleanest fix, job stays visible and available for more applicants.
**Con:** Need to ensure `positions_filled` is incremented correctly on each deployment.

### Option B: Show in_progress jobs in PostedJobsTab if positions remain
Update filter in `PostedJobsTab.jsx` to include `in_progress` jobs where `positions_filled < positions_available`:
```javascript
let filtered = jobPostings.filter((posting) =>
  posting.status === "active" ||
  posting.status === "draft" ||
  (posting.status === "in_progress" && posting.positions_filled < posting.positions_available)
);
```
**Pro:** Quick frontend fix.
**Con:** Doesn't address the premature status transition.

### Option C: Combination
- Backend: Only transition to `in_progress` when all positions filled
- Frontend: Show filled/available counts on job cards (e.g., "2/5 positions filled")
- Worker-facing: Hide job from search once all positions filled

## Key files to modify
- `server/controllers/deployedContractController.js` — `updateJobStatusIfAllContractsComplete()` (lines 16-58)
- `client/src/EmployerPages/ContractFactory/PostedJobsTab.jsx` — filter logic (line 42)
- `server/controllers/jobApplicationController.js` — may need to increment `positions_filled`
- `server/models/JobPosting.js` — has `positions_available` (line 31) and `positions_filled` (line 35)

## Priority
High — directly impacts employer experience for multi-position job postings.
