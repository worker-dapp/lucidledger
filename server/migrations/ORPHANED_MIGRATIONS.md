# Orphaned Migration Files

## Summary

The following migration files exist in this directory but are **not currently used** in either production or local development:

- `add-employer-id-to-jobs.sql`
- `add-missing-fields.sql`

## Why They're Not Used

### Production (`server/server.js`)
Production only runs `create-all-tables.sql` on server startup (lines 86-104). The server does not execute the other migration files.

### Local Development (Docker)
The `docker-compose.yml` is configured to only mount `create-all-tables.sql` to match production behavior.

## What These Files Do

### `add-employer-id-to-jobs.sql`
- Adds `employer_id` column to `jobs` table
- Adds foreign key constraint: `jobs.employer_id` → `employer.id`
- Adds index on `employer_id` for performance

### `add-missing-fields.sql`
- Adds `street_address2` column to `employee` table
- Adds `street_address2` column to `employer` table
- Adds company fields to `employer` table:
  - `company_name`
  - `company_description`
  - `industry`
  - `company_size`
  - `website`
  - `linkedin`

## Current State of create-all-tables.sql

The `create-all-tables.sql` file **already includes all fields and relationships** from these orphaned migrations:
- ✅ `jobs.employer_id` with FK constraint and index
- ✅ `employee.street_address2`
- ✅ `employer.street_address2`
- ✅ All company fields in employer table

## History (Hypothesis)

These files were likely used as **one-time migrations** to update the AWS RDS production database incrementally during development. After running them, the team consolidated the final schema into `create-all-tables.sql`.

## Action Required

**Decision needed:** Should these files be deleted?

### Arguments for deletion:
- They are redundant with `create-all-tables.sql`
- They are not used in any deployment process
- Keeping them could cause confusion

### Arguments for keeping:
- They document the schema evolution history
- They might contain subtle differences not in `create-all-tables.sql`
- No harm in keeping them as documentation

## Recommendation

Before deleting, verify the following:
1. ✅ Confirm `create-all-tables.sql` has all fields from these migrations
2. ✅ Confirm production database matches `create-all-tables.sql` schema
3. ✅ Check git history to understand when/why these files were created
4. ✅ Confirm no other scripts or processes reference these files

Once verified, these files can be safely deleted or moved to an archive directory like `server/migrations/archive/`.

---

**Last Updated:** 2026-01-10
**Created By:** Claude Code during Docker PostgreSQL setup
