-- 033-auth-subject-not-null.sql
-- Make auth_subject mandatory on employee/employer.
--
-- Migration 032 added the column as nullable so that records predating it could be
-- backfilled on login. That backfill matched records by the client-supplied
-- x-wallet-address header, which meant any authenticated caller could claim an
-- unbacked row by sending its wallet address — the exact weakness the auth_subject
-- work set out to remove. The backfill path has been deleted rather than guarded.
--
-- Enforcing NOT NULL makes the vulnerable state unrepresentable: a row with no bound
-- identity cannot be stored, so authorization never has to decide what to do about
-- one. auth_subject is written at creation from the verified JWT, so new rows always
-- satisfy this.
--
-- PRECONDITION: no employee/employer rows with a NULL auth_subject. Pre-pilot, these
-- tables are cleared instead of backfilled (see notes/66-71-qa-checklist.md).
--
-- If a NULL row remains, this ALTER fails. Note that the migration runner in server.js
-- catches and logs per-file errors and then continues — it even prints "All database
-- migrations completed successfully" — so this failing does NOT by itself stop the
-- server. verifyCriticalInvariants() in server.js asserts the resulting column state
-- after migrations run and refuses to start if it is still nullable. That check, not
-- this migration, is what makes the failure loud.

ALTER TABLE employee ALTER COLUMN auth_subject SET NOT NULL;
ALTER TABLE employer ALTER COLUMN auth_subject SET NOT NULL;
