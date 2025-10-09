-- Add missing street_address2 column to employee table
ALTER TABLE public.employee 
ADD COLUMN IF NOT EXISTS street_address2 character varying(255) NULL;

-- Add missing street_address2 column to employer table
ALTER TABLE public.employer 
ADD COLUMN IF NOT EXISTS street_address2 character varying(255) NULL;

-- Add company information columns to employer table
ALTER TABLE public.employer 
ADD COLUMN IF NOT EXISTS company_name character varying(255) NULL,
ADD COLUMN IF NOT EXISTS company_description text NULL,
ADD COLUMN IF NOT EXISTS industry character varying(100) NULL,
ADD COLUMN IF NOT EXISTS company_size character varying(50) NULL,
ADD COLUMN IF NOT EXISTS website character varying(255) NULL,
ADD COLUMN IF NOT EXISTS linkedin character varying(255) NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.employee.street_address2 IS 'Secondary address line (apartment, suite, unit, etc.)';
COMMENT ON COLUMN public.employer.street_address2 IS 'Secondary address line (apartment, suite, unit, etc.)';
COMMENT ON COLUMN public.employer.company_name IS 'Name of the company';
COMMENT ON COLUMN public.employer.company_description IS 'Description of the company, its mission, and what makes it unique';
COMMENT ON COLUMN public.employer.industry IS 'Industry sector of the company';
COMMENT ON COLUMN public.employer.company_size IS 'Size of the company (number of employees)';
COMMENT ON COLUMN public.employer.website IS 'Company website URL';
COMMENT ON COLUMN public.employer.linkedin IS 'Company LinkedIn profile URL';

