-- Migration 027: Drop duplicate email unique constraints from employee and employer tables
--
-- Problem: During early development, Sequelize's sync() was called on every server
--          startup while the model had unique: true on the email field. This caused
--          PostgreSQL to accumulate 14 numbered copies of the email unique constraint
--          (employer_email_key1 through employer_email_key14, same for employee).
--          Migration 018 dropped the original employer_email_key / employee_email_key
--          but was unaware of the numbered duplicates, leaving them in place.
--
-- Effect: Phone-only users (who submit email = '') fail on employer signup because
--         one of these leftover constraints rejects a second empty-string email.
--
-- Fix: Drop all numbered duplicate constraints on both tables. Email is not the
--      identity anchor (wallet_address is) and should not be unique-enforced by the DB.

ALTER TABLE public.employee DROP CONSTRAINT IF EXISTS employee_email_key1;
ALTER TABLE public.employee DROP CONSTRAINT IF EXISTS employee_email_key2;
ALTER TABLE public.employee DROP CONSTRAINT IF EXISTS employee_email_key3;
ALTER TABLE public.employee DROP CONSTRAINT IF EXISTS employee_email_key4;
ALTER TABLE public.employee DROP CONSTRAINT IF EXISTS employee_email_key5;
ALTER TABLE public.employee DROP CONSTRAINT IF EXISTS employee_email_key6;
ALTER TABLE public.employee DROP CONSTRAINT IF EXISTS employee_email_key7;
ALTER TABLE public.employee DROP CONSTRAINT IF EXISTS employee_email_key8;
ALTER TABLE public.employee DROP CONSTRAINT IF EXISTS employee_email_key9;
ALTER TABLE public.employee DROP CONSTRAINT IF EXISTS employee_email_key10;
ALTER TABLE public.employee DROP CONSTRAINT IF EXISTS employee_email_key11;
ALTER TABLE public.employee DROP CONSTRAINT IF EXISTS employee_email_key12;
ALTER TABLE public.employee DROP CONSTRAINT IF EXISTS employee_email_key13;
ALTER TABLE public.employee DROP CONSTRAINT IF EXISTS employee_email_key14;

ALTER TABLE public.employer DROP CONSTRAINT IF EXISTS employer_email_key1;
ALTER TABLE public.employer DROP CONSTRAINT IF EXISTS employer_email_key2;
ALTER TABLE public.employer DROP CONSTRAINT IF EXISTS employer_email_key3;
ALTER TABLE public.employer DROP CONSTRAINT IF EXISTS employer_email_key4;
ALTER TABLE public.employer DROP CONSTRAINT IF EXISTS employer_email_key5;
ALTER TABLE public.employer DROP CONSTRAINT IF EXISTS employer_email_key6;
ALTER TABLE public.employer DROP CONSTRAINT IF EXISTS employer_email_key7;
ALTER TABLE public.employer DROP CONSTRAINT IF EXISTS employer_email_key8;
ALTER TABLE public.employer DROP CONSTRAINT IF EXISTS employer_email_key9;
ALTER TABLE public.employer DROP CONSTRAINT IF EXISTS employer_email_key10;
ALTER TABLE public.employer DROP CONSTRAINT IF EXISTS employer_email_key11;
ALTER TABLE public.employer DROP CONSTRAINT IF EXISTS employer_email_key12;
ALTER TABLE public.employer DROP CONSTRAINT IF EXISTS employer_email_key13;
ALTER TABLE public.employer DROP CONSTRAINT IF EXISTS employer_email_key14;
