-- Migration: Remove old jobs table and related foreign keys
-- This migration removes the legacy jobs table in favor of job_postings
-- Safe to run since no users exist yet

-- Drop foreign key constraints first
ALTER TABLE public.saved_jobs
DROP CONSTRAINT IF EXISTS saved_jobs_job_fkey;

ALTER TABLE public.job_applications
DROP CONSTRAINT IF EXISTS job_applications_job_fkey;

-- Drop job_id columns from related tables
ALTER TABLE public.saved_jobs
DROP COLUMN IF EXISTS job_id;

ALTER TABLE public.job_applications
DROP COLUMN IF EXISTS job_id;

-- Drop the old jobs table
DROP TABLE IF EXISTS public.jobs CASCADE;

-- Make job_posting_id NOT NULL in saved_jobs (it's now the only foreign key)
ALTER TABLE public.saved_jobs
ALTER COLUMN job_posting_id SET NOT NULL;

-- Make job_posting_id NOT NULL in job_applications (it's now the only foreign key)
ALTER TABLE public.job_applications
ALTER COLUMN job_posting_id SET NOT NULL;
