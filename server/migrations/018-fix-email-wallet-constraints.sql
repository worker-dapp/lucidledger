-- Migration 018: Fix identity constraints on employee and employer tables
--
-- Problem: email UNIQUE is the wrong identity anchor. Privy owns email
--          deduplication at auth time. A stale DB record from a deleted Privy
--          account blocks new users registering with the same email.
--          wallet_address has no uniqueness enforcement despite being the
--          actual runtime identity key used throughout the application.
--
-- Fix: drop email unique constraints, add wallet_address unique constraints.
--
-- Note: wallet_address remains nullable (users mid-onboarding may not have one
--       yet). PostgreSQL treats NULLs as distinct under UNIQUE, so multiple
--       NULL rows are permitted and will not conflict.

-- Drop email unique constraints
ALTER TABLE public.employee DROP CONSTRAINT IF EXISTS employee_email_key;
ALTER TABLE public.employer DROP CONSTRAINT IF EXISTS employer_email_key;

-- Add wallet_address unique constraints
-- If this fails due to duplicate wallet_address values in dev data, clean up
-- duplicates first: SELECT wallet_address, COUNT(*) FROM employee GROUP BY wallet_address HAVING COUNT(*) > 1;
ALTER TABLE public.employee ADD CONSTRAINT employee_wallet_address_key UNIQUE (wallet_address);
ALTER TABLE public.employer ADD CONSTRAINT employer_wallet_address_key UNIQUE (wallet_address);
