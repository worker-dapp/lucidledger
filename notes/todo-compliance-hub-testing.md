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
- [x] Click "Compliance" in the sidebar — confirm it loads `/compliance`, not `/dispute`
- [x] Page title reads "Compliance Hub"
- [x] All 5 tabs are visible: Overview, Disputes, Completed Contracts, Audit Log, Reports & Exports

**Old routes removed:**
- [x] Navigate directly to `/dispute` — should redirect or 404, not load the old page
- [x] Navigate directly to `/review-completed-contracts` — same

**Disputes tab:**
- [x] Shows existing disputes with correct stats (total/pending/resolved counts)
- [x] Search by job title works
- [x] Status filter (pending/resolved) works
- [x] Dispute reason shows in yellow box
- [x] Resolution notes show in green box (for resolved disputes)
- [x] "View Resolution Transaction" link works for resolved disputes with a tx hash

**Completed Contracts tab:**
- [x] Shows contracts with status `completed`
- [x] Worker name, job title, payment amount, location all populate correctly
- [x] Contract address shows with Basescan link (for real contracts)

---

## Phase 2 — Audit Log

**Initial state:**
- [x] Audit Log tab shows the empty state message ("Audit log entries will appear
  here as actions are taken") — expected since the table is fresh

**Trigger audit log entries** by performing these actions, then returning to the
Audit Log tab:

| [] | Action to perform | Expected log entry |
|---|---|---|
| [x] | Accept a job application (single) | `application_accepted` |
| [x] | Reject a job application (single) | `application_rejected` |
| [x] | Bulk accept or reject applications | multiple `applications_accepted`, `application_rejected` |
| [x] | Deploy a contract (Awaiting Deployment tab) | `contract_deployed` |
| [x] | Bulk deployment | multiple `contract_deployed` |
| [x] | Complete a contract with payment | `payment_processed` |
| [x] | Mark a contract as disputed from employer side (WorkforceDashboard) | `disputed` ? |
| [x] | Raise a dispute (from worker's Job Tracker) | `dispute_created` |
| [x] | Resolve a dispute (as mediator) | `dispute_resolved` |

**After triggering actions:**
- [x] Entries appear in the Audit Log tab, newest first
- [x] Action badge colour matches the action type (green for accepted, purple for payment, etc.)
- [x] `action_description` reads clearly (e.g. "Application accepted for 'Harvest Worker'")
- [x] `entity_identifier` shows the contract address or job title as appropriate

**Filters:**
- [x] Filter by action type (e.g. "Payment Processed") — only payment entries show
- [x] Search by description text works
- [x] Search by entity identifier (e.g. contract address) works
- [x] Date range filter — set today's date as both From and To — entries show
- [x] Date range filter — set yesterday as To — entries disappear (made today)
- [x] Clear date range — entries reappear

---

## Phase 3 — Reports & Exports

**Workforce Summary:**
- [x] Click Download CSV — browser prompts a file download
- [x] File is named `workforce_summary_YYYY-MM-DD.csv`
- [x] Open in Excel/Numbers/Google Sheets — columns present:
  `worker_name`, `email`, `job_title`, `location`, `job_type`, `contract_status`,
  `payment_amount`, `payment_currency`, `verification_status`, `contract_address`,
  `contract_url`, `deployed_at`
- [x] `contract_url` column contains a valid Basescan link for real contracts
- [x] Mock contracts show `—` in the `contract_url` column

**Payment History:**
- [x] Download and open CSV
- [x] Columns present: `worker_name`, `job_title`, `amount`, `currency`,
  `payment_type`, `status`, `processed_at`, `tx_hash`, `tx_url`,
  `contract_address`, `contract_url`
- [x] `tx_url` contains `https://base-sepolia.blockscout.com/tx/0x...` for real payments
- [x] Amounts match expected test data

**Oracle Verifications:**
- [] Download and open CSV (may be empty if no oracle verifications exist — that's fine)
- [] If data exists: `oracle_type`, `verification_status`, `latitude`, `longitude`,
  `hours_worked` all populate

**Date range filtering (all three reports):**
- [] Set a range that includes test data — CSV downloads with data
- [] Set a future date range — CSV downloads but contains only headers (no rows)

---

## Phase 4 — Overview Dashboard

- [x] Overview tab loads without error
- [x] **Total Contracts** stat card — count matches WorkforceDashboard
- [x] **USDC Paid Out** — total matches sum of completed payments
- [x] **Unique Workers** — correct count (3 workers across 5 contracts = 3)
- [x] **Dispute Rate** — `(disputed / total) * 100`, verify manually
- [x] Contract Health bars — all 4 statuses show correct counts and percentages
- [x] Dispute Summary — total/resolved/pending match Disputes tab
- [x] Avg resolution time shows a number (or `—` if no disputes resolved yet)
- [x] Oracle panel — shows "No oracle verifications recorded yet" if empty, or pass rate if data exists
- [x] Date range filter — stat cards update to reflect only that period
- [x] Clear button appears when dates are set, clears correctly

---

## Cross-cutting Checks

- [x] Reload the page on `/compliance` — lands on Overview tab (default)
- [x] Tab switching is smooth — no full page reloads, no data flicker
- [ ] On mobile width — tab nav scrolls horizontally, cards stack correctly
- [x] No JS errors in browser console on any tab
- [x] If employer has no data at all — every tab shows its empty state gracefully

---

## On Completion

Once all checks pass, commit on `feature/compliance-hub` and open a PR targeting `main`.
Capture any failures before committing and fix them first.
