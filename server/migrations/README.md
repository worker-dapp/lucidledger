# Database Migrations

Migrations run automatically on server startup via `runMigrationsOnStartup()` in `server.js`.

## Migration Order

1. `create-all-tables.sql` — Base tables: `employee`, `employer`, `job_applications`, `saved_jobs`, and legacy `jobs`
2. `001` through `014` — Numbered migrations that build the rest of the schema (contract templates, job postings, deployed contracts, mediators, dispute history, etc.)

Migration `005` drops the legacy `jobs` table in favor of `job_postings` (created in `002`).

## Adding New Migrations

1. Create a new file: `0XX-description.sql`
2. Use `IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS` for idempotency
3. Add the filename to the `migrationFiles` array in `server.js`

All migrations are idempotent and safe to re-run.
