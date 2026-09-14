-- 032-add-auth-subject.sql
-- Store the auth provider's stable subject identifier (the verified JWT `sub` claim)
-- on employee/employer records.
--
-- This gives each record a stable link to the logged-in identity, independent of the
-- wallet address, and serves as the identity that authorization resolves against.
--
-- Named `auth_subject` (provider-neutral) rather than a vendor-specific name so it
-- applies regardless of the auth backend — every mainstream provider issues a JWT `sub`.
--
-- Added nullable here; migration 033 makes it NOT NULL. (An earlier design filled
-- this in on login by matching a client-supplied wallet address; that was exploitable and
-- was removed — see 033 and notes/66-71-qa-checklist.md.)
-- UNIQUE: one subject maps to at most one record per table (Postgres allows multiple
-- NULLs, so unfilled rows don't collide). UNIQUE also creates the lookup index.

ALTER TABLE employee ADD COLUMN IF NOT EXISTS auth_subject VARCHAR(255) UNIQUE;
ALTER TABLE employer ADD COLUMN IF NOT EXISTS auth_subject VARCHAR(255) UNIQUE;
