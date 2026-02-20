# Migration Safety Recommendations (Server)

## Context

The backend currently runs raw SQL migration files on every server startup from a hardcoded list in `server/server.js`.
This works, but it depends heavily on each migration being perfectly idempotent and order-safe.

## Current Risks Observed

1. No migration state tracking
- There is no migration ledger table (for example, `SequelizeMeta` or a custom `schema_migrations` table).
- Result: the same files are re-executed on every boot.

2. Errors are logged and then ignored
- Startup continues even when a migration fails.
- Result: partial schema drift can go unnoticed.

3. Contradictory legacy sequence around `jobs` and `job_id`
- `005-remove-old-jobs-table.sql` removes `job_id` columns and drops `jobs`.
- `006-make-job-id-nullable.sql` then attempts to alter/comment `job_id`.
- Result: expected failures and noisy startup logs; weak signal-to-noise for real issues.

4. Hardcoded migration list
- New migration files only run if manually added to the list in `server/server.js`.
- Result: easy to forget; environments can diverge.

5. Model/schema legacy overlap
- Legacy `Job` model remains while newer flow uses `JobPosting`.
- Result: maintenance confusion and accidental use of old paths.

## Recommendations (Prioritized)

1. Introduce migration tracking (highest priority)
- Add a migration state table, for example:
  - `schema_migrations (filename text primary key, applied_at timestamptz not null default now())`
- Before each migration file executes, check if it is already recorded.
- Execute in a transaction where possible, then record success in `schema_migrations`.
- Outcome: migrations run once, not on every boot.

2. Fail fast in production, tolerate only known-safe cases in development
- In production: if a migration fails, stop startup.
- In development: allow optional continue mode with explicit flag (for example `MIGRATIONS_STRICT=false`).
- Outcome: prevents silently running with broken schema.

3. Resolve the `005`/`006` conflict
- Option A: remove `006` from startup list if the `job_id` deprecation path is complete.
- Option B: rewrite `006` to guard each `job_id` operation with existence checks on columns.
- Outcome: reduce false-positive failures and improve observability.

4. Replace manual filename array with sorted file discovery
- Read all `*.sql` in `server/migrations`.
- Sort lexicographically and execute in order.
- Keep `create-all-tables.sql` either:
  - removed after backfill, or
  - renamed into numeric sequence (for example `000-create-base-tables.sql`).
- Outcome: lower operational risk when adding migrations.

5. Separate schema migrations from app startup path
- Keep a migration command for CI/deploy (`npm run migrate:all`).
- Startup should verify schema compatibility (or run only when explicitly enabled, e.g. `RUN_MIGRATIONS_ON_STARTUP=true`).
- Outcome: safer deploy lifecycle and clearer responsibilities.

6. Add a migration authoring checklist
- Require:
  - idempotency guards (`IF EXISTS` / `IF NOT EXISTS`)
  - backward-compatible intermediate steps
  - data backfill strategy where required
  - rollback or forward-fix notes
  - explicit validation query snippet
- Outcome: more predictable migrations and easier reviews.

7. Align models with final schema
- Remove or quarantine legacy `Job` model and unused routes once migration is complete.
- Ensure model references match actual table names consistently (`employee` vs `employees` naming).
- Outcome: less confusion and fewer runtime surprises.

## Suggested Implementation Plan

Phase 1 (quick wins)
1. Add `schema_migrations` table + execution guard.
2. Update startup migration runner to record applied migrations.
3. Make strict mode default in production.
4. Fix or remove conflicting `006` behavior.

Phase 2 (cleanup)
1. Switch to directory discovery for migration files.
2. Gate startup migrations behind an env flag.
3. Remove legacy model/routes after confirming no callers.

Phase 3 (team process)
1. Add migration checklist to `server/migrations/README.md`.
2. Add CI step that runs migrations on a clean DB and verifies schema health checks.

## Practical Near-Term Policy

Until tracking is implemented, treat migrations as immutable and append-only:
1. Never edit an applied migration file in place.
2. Add a new migration to correct prior behavior.
3. Ensure new migrations are idempotent and safe to re-run.
4. Update `server/server.js` migration list in the same PR.
