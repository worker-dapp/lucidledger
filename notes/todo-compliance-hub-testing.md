# Compliance Hub — Local Testing Plan

**Created:** 2026-03-07
**Related:** Issue #52, branch `feature/compliance-hub`
**Run before committing the compliance hub build.**

---

## Prerequisites

Before testing anything:

1. **Run the server** — migration `022-create-audit-log.sql` needs to auto-run on
   startup. Check server logs for `Running migration: 022-create-audit-log.sql` to
   confirm the `audit_log` table was created.
2. **Run the client** — `cd client && npm run dev`
3. **Log in as an employer** with at least some existing data (deployed contracts,
   disputes, payments)

---

## Phase 1 — Routing & Tab Structure

**Navigation:**
- [ ] Click "Compliance" in the sidebar — confirm it loads `/compliance`, not `/dispute`
- [ ] Page title reads "Compliance Hub"
- [ ] All 5 tabs are visible: Overview, Disputes, Completed Contracts, Audit Log, Reports & Exports

**Old routes removed:**
- [ ] Navigate directly to `/dispute` — should redirect or 404, not load the old page
- [ ] Navigate directly to `/review-completed-contracts` — same

**Disputes tab:**
- [ ] Shows existing disputes with correct stats (total/pending/resolved counts)
- [ ] Search by job title works
- [ ] Status filter (pending/resolved) works
- [ ] Dispute reason shows in yellow box
- [ ] Resolution notes show in green box (for resolved disputes)
- [ ] "View Resolution Transaction" link works for resolved disputes with a tx hash

**Completed Contracts tab:**
- [ ] Shows contracts with status `completed`
- [ ] Worker name, job title, payment amount, location all populate correctly
- [ ] Contract address shows with Basescan link (for real contracts)
- [ ] Mock contracts (`0x000000...`) show "Mock contract (not on-chain)" instead of a link

---

## Phase 2 — Audit Log

**Initial state:**
- [ ] Audit Log tab shows the empty state message ("Audit log entries will appear
  here as actions are taken") — expected since the table is fresh

**Trigger audit log entries** by performing these actions, then returning to the
Audit Log tab:

| Action to perform | Expected log entry |
|---|---|
| Accept a job application (single) | `application_accepted` |
| Reject a job application (single) | `application_rejected` |
| Bulk accept or reject applications | `applications_bulk_updated` |
| Deploy a contract (Awaiting Deployment tab) | `contract_deployed` |
| Mark a contract as disputed (WorkforceDashboard) | `contract_status_changed` |
| Complete a contract with payment | `payment_processed` + `contract_status_changed` |
| Raise a dispute (from worker's Job Tracker) | `dispute_created` |
| Resolve a dispute (as mediator) | `dispute_resolved` |

**After triggering actions:**
- [ ] Entries appear in the Audit Log tab, newest first
- [ ] Action badge colour matches the action type (green for accepted, purple for payment, etc.)
- [ ] `action_description` reads clearly (e.g. "Application accepted for 'Harvest Worker'")
- [ ] `entity_identifier` shows the contract address or job title as appropriate

**Filters:**
- [ ] Filter by action type (e.g. "Payment Processed") — only payment entries show
- [ ] Search by description text works
- [ ] Search by entity identifier (e.g. contract address) works
- [ ] Date range filter — set today's date as both From and To — entries show
- [ ] Date range filter — set yesterday as To — entries disappear (made today)
- [ ] Clear date range — entries reappear

---

## Phase 3 — Reports & Exports

**Workforce Summary:**
- [ ] Click Download CSV — browser prompts a file download
- [ ] File is named `workforce_summary_YYYY-MM-DD.csv`
- [ ] Open in Excel/Numbers/Google Sheets — columns present:
  `worker_name`, `email`, `job_title`, `location`, `job_type`, `contract_status`,
  `payment_amount`, `payment_currency`, `verification_status`, `contract_address`,
  `contract_url`, `deployed_at`
- [ ] `contract_url` column contains a valid Basescan link for real contracts
- [ ] Mock contracts show `—` in the `contract_url` column

**Payment History:**
- [ ] Download and open CSV
- [ ] Columns present: `worker_name`, `job_title`, `amount`, `currency`,
  `payment_type`, `status`, `processed_at`, `tx_hash`, `tx_url`,
  `contract_address`, `contract_url`
- [ ] `tx_url` contains `https://base-sepolia.blockscout.com/tx/0x...` for real payments
- [ ] Amounts match expected test data

**Oracle Verifications:**
- [ ] Download and open CSV (may be empty if no oracle verifications exist — that's fine)
- [ ] If data exists: `oracle_type`, `verification_status`, `latitude`, `longitude`,
  `hours_worked` all populate

**Date range filtering (all three reports):**
- [ ] Set a range that includes test data — CSV downloads with data
- [ ] Set a future date range — CSV downloads but contains only headers (no rows)

---

## Phase 4 — Overview Dashboard

- [ ] Overview tab loads without error
- [ ] **Total Contracts** stat card — count matches WorkforceDashboard
- [ ] **USDC Paid Out** — total matches sum of completed payments
- [ ] **Unique Workers** — correct count (3 workers across 5 contracts = 3)
- [ ] **Dispute Rate** — `(disputed / total) * 100`, verify manually
- [ ] Contract Health bars — all 4 statuses show correct counts and percentages
- [ ] Dispute Summary — total/resolved/pending match Disputes tab
- [ ] Avg resolution time shows a number (or `—` if no disputes resolved yet)
- [ ] Oracle panel — shows "No oracle verifications recorded yet" if empty, or pass rate if data exists
- [ ] Date range filter — stat cards update to reflect only that period
- [ ] Clear button appears when dates are set, clears correctly

---

## Cross-cutting Checks

- [ ] Reload the page on `/compliance` — lands on Overview tab (default)
- [ ] Tab switching is smooth — no full page reloads, no data flicker
- [ ] On mobile width — tab nav scrolls horizontally, cards stack correctly
- [ ] No JS errors in browser console on any tab
- [ ] If employer has no data at all — every tab shows its empty state gracefully

---

## On Completion

Once all checks pass, commit on `feature/compliance-hub` and open a PR targeting `main`.
Capture any failures before committing and fix them first.
