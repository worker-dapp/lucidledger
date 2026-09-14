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
-- tables are cleared instead of backfilled (see notes/66-71-qa-checklist.md). If any
-- NULL row remains this ALTER fails and, because migrations run on startup, the server
-- will not boot. That is intentional: failing loudly beats silently admitting a row
-- that cannot be authorized.

ALTER TABLE employee ALTER COLUMN auth_subject SET NOT NULL;
ALTER TABLE employer ALTER COLUMN auth_subject SET NOT NULL;
