# Reports & Export Architecture

**Created:** 2026-03-07
**Related:** Issue #52 (Compliance Hub), Phase 3

## Overview

Three CSV export endpoints that allow employers to download compliance data for
brand audits. Each report covers a different slice of the platform's data and
includes Basescan URLs so auditors can verify on-chain records without needing
to use a block explorer manually.

---

## The Files

| File | Role |
|------|------|
| `server/controllers/reportController.js` | Three export functions — query DB, build row objects, serialize to CSV |
| `server/routes/reportRoutes.js` | Mounts the three GET endpoints under `/api/reports/` |
| `server/server.js` | Registers the routes at `/api/reports` |
| `client/src/services/api.js` | `requestCsv()` helper + three export methods that trigger downloads |
| `client/src/EmployerPages/ComplianceHub/ReportsTab.jsx` | UI with date range filter and download buttons |

---

## The Three Reports

### 1. Workforce Summary (`/api/reports/workforce-summary`)
Queries `deployed_contracts` joined with `employee` and `job_postings`.

**Columns:** worker name, email, job title, location, job type, contract status,
payment amount, currency, verification status, contract address, Basescan contract
URL, deployed date.

**Use case:** Auditor wants to see every worker engaged, whether they were verified,
and what they were paid.

### 2. Payment History (`/api/reports/payment-history`)
Queries `payment_transactions` joined with `deployed_contracts` → `employee` and
`job_postings`.

**Columns:** worker name, job title, amount, currency, payment type, status,
processed date, tx hash, Basescan transaction URL, contract address, Basescan
contract URL.

**Use case:** Auditor wants proof that workers were actually paid — the tx hash
links directly to the on-chain USDC transfer.

### 3. Oracle Verifications (`/api/reports/oracle-verifications`)
Queries `oracle_verifications` joined with `deployed_contracts` → `employee` and
`job_postings`.

**Columns:** worker name, job title, oracle type, verification status, verified
timestamp, latitude, longitude, hours worked, contract address, Basescan contract
URL.

**Use case:** Auditor wants to verify that workers were physically present or
time-verified at the worksite.

---

## Full Flow: Button Click → CSV File

### Step 1: Employer clicks "Download CSV"
`ReportsTab.jsx` calls e.g. `apiService.exportPaymentHistory({ employer_id: 42, start_date: '2026-01-01' })`.

### Step 2: `requestCsv()` fetches the endpoint
Unlike the normal `request()` method (which calls `response.json()`), `requestCsv()`
calls `response.blob()` — because the server returns `text/csv`, not JSON. Auth
headers (Privy token + wallet address) are still included.

### Step 3: The server queries the DB and serializes to CSV
`reportController.js` runs a Sequelize query with joins, maps the results to plain
row objects, then calls `parse(rows)` from the `json2csv` library to serialize.
The response is sent with:
```
Content-Type: text/csv
Content-Disposition: attachment; filename="payment_history_2026-03-07.csv"
```

### Step 4: The browser triggers a download
Back in `ReportsTab.jsx`, the blob is wrapped in an object URL, a temporary `<a>`
element is clicked programmatically, and the URL is revoked immediately after.
The file saves with a date-stamped filename.

---

## Key Design Decisions

**Why `requestCsv()` instead of `request()`?**
The standard `request()` wrapper always calls `response.json()`. CSV responses
are plain text — calling `.json()` on them throws a parse error. `requestCsv()`
is identical to `request()` except it calls `response.blob()` and skips the JSON
error-handling path.

**Why Basescan URLs in the CSV?**
The target audience for these exports includes compliance officers and brand auditors
who are not crypto-native. Including a clickable URL means they can verify a payment
directly without knowing how to use a block explorer. Low effort, high trust signal.

**Why `json2csv` v6 `parse()` function?**
v6 exports a direct `parse(rows)` function that takes an array of plain objects and
returns a CSV string synchronously. No need for the class-based `Parser` from v5.

**Why mock contracts are excluded from Basescan URLs?**
Contracts with addresses starting `0x000000` are test/mock contracts that don't
exist on-chain. The controller checks for this prefix and outputs `—` instead of
a broken link.

**Date range filtering**
All three endpoints accept optional `start_date` and `end_date` query params. The
`dateRangeWhere()` helper in `reportController.js` builds the Sequelize `Op.gte` /
`Op.lte` clause only when those params are present — omitting them returns all
records.

---

## See Also
- `notes/audit-log-architecture.md` — Phase 2 audit log system
- `notes/todo-compliance-hub-buildout.md` — original implementation plan
