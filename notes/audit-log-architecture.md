# Audit Log Architecture

**Created:** 2026-03-07
**Related:** Issue #52 (Compliance Hub), `server/controllers/auditLogController.js`

## How the Pieces Fit Together

### The Files

| File | Role |
|------|------|
| `server/migrations/022-create-audit-log.sql` | Creates the `audit_log` table in PostgreSQL (runs once at server startup) |
| `server/models/AuditLog.js` | Sequelize model — tells the ORM what columns exist and their types |
| `server/controllers/auditLogController.js` | Two exports: `logAction()` helper + `getAuditLog()` API endpoint |
| `server/routes/auditLogRoutes.js` | Mounts `GET /api/audit-log` → `getAuditLog` |
| `server/server.js` | Registers the route at `/api/audit-log` |
| `server/controllers/deployedContractController.js` | Calls `logAction()` after: contract deployed, status changed, payment processed |
| `server/controllers/jobApplicationController.js` | Calls `logAction()` after: application accepted, application rejected, bulk update |
| `server/controllers/disputeHistoryController.js` | Calls `logAction()` after: dispute created, dispute resolved |
| `client/src/services/api.js` | `getAuditLog(params)` — frontend method to fetch log entries |
| `client/src/EmployerPages/ComplianceHub/AuditLogTab.jsx` | Renders log entries with search, action filter, and date range |

---

## Full Flow: Action → Log Entry → Display

### Step 1: Something happens in the app
An employer accepts a job application. The frontend calls
`POST /api/job-applications/:id/status` with `{ status: "accepted" }`.

### Step 2: The controller does its real work, then logs it
`jobApplicationController.updateApplicationStatus` runs as normal — updates the
`job_applications` row in the DB. Then, because status is `"accepted"`, it calls:

```javascript
await logAction({
  actorType: 'employer',
  actorId: jobForLog?.employer_id,
  actionType: 'application_accepted',
  actionDescription: 'Application accepted for "Harvest Worker"',
  entityType: 'job_application',
  entityId: application.id,
  entityIdentifier: 'Harvest Worker',
  newValue: { status: 'accepted' },
});
```

This is fire-and-forget — if the log write fails, the accept still succeeds.

### Step 3: `logAction` writes to the database
`logAction` in `auditLogController.js` calls `AuditLog.create(...)`. Sequelize uses
`AuditLog.js` (the model) to know what columns exist, then executes:

```sql
INSERT INTO audit_log (actor_type, actor_id, action_type, ..., created_at)
VALUES ('employer', 42, 'application_accepted', ..., NOW())
```

The `audit_log` table exists because migration `022-create-audit-log.sql` ran at
server startup (automatic via `runMigrationsOnStartup()` in `server.js`).

### Step 4: The employer opens the Compliance Hub
They click the Audit Log tab. `AuditLogTab.jsx` mounts and calls
`apiService.getAuditLog({ employer_id: 42 })`.

### Step 5: The API returns the entries
`GET /api/audit-log?employer_id=42` hits `auditLogRoutes.js` → `getAuditLog()` in
`auditLogController.js`, which queries:

```sql
SELECT * FROM audit_log
WHERE actor_type = 'employer' AND actor_id = 42
ORDER BY created_at DESC
LIMIT 200
```

Returns the rows as JSON.

### Step 6: The tab renders them
`AuditLogTab` maps over the results, rendering each entry as a card with a
colour-coded action badge, timestamp, description, and entity reference.

---

## Key Design Points

- **`logAction` is shared infrastructure** — imported by multiple controllers but
  always writes to the same `audit_log` table through the same model.
- **Non-blocking by design** — `logAction` wraps its DB write in a try/catch and
  swallows errors with `console.error`. Audit failures never surface to the user or
  interrupt the main operation.
- **The tab reads from one table** — regardless of which controller originally wrote
  the entry, `AuditLogTab` queries `audit_log` directly.
- **No historical data on day one** — the table is empty until actions are taken
  after deployment. This is expected and the tab handles it with an empty state.

---

## Logged Action Types

| Action Type | Triggered By | Controller |
|-------------|-------------|------------|
| `contract_deployed` | Contract deployed to chain | `deployedContractController` |
| `contract_status_changed` | Status update (disputed, completed, etc.) | `deployedContractController` |
| `payment_processed` | `completeContractWithPayment` endpoint | `deployedContractController` |
| `application_accepted` | Single application accepted | `jobApplicationController` |
| `application_rejected` | Single application rejected | `jobApplicationController` |
| `applications_bulk_updated` | Bulk accept/reject | `jobApplicationController` |
| `dispute_created` | Dispute raised by worker or employer | `disputeHistoryController` |
| `dispute_resolved` | Mediator resolves dispute | `disputeHistoryController` |

---

## See Also
- `notes/todo-audit-log-reliability.md` — notes on the non-blocking error handling
  tradeoff and what to do if server log monitoring is not in place
