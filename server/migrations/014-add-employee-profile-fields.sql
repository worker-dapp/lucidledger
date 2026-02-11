-- Add skills and work experience fields to employee table
ALTER TABLE public.employee
ADD COLUMN IF NOT EXISTS skills TEXT,
ADD COLUMN IF NOT EXISTS work_experience JSONB;
