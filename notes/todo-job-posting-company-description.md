# TODO: Job Posting Company Description Override

## Problem

When creating a new job posting, the company description field appears to be auto-filled from the employer profile and either:
1. Doesn't allow editing, or
2. Resets to the profile value on submit

User entered a custom description but the saved job posting has the shorter employer profile description instead.

## Expected Behavior

Either:
- Allow custom company description per job posting (override profile default)
- Or make it clear the field is read-only and pulls from profile

## Where to Fix

- **Frontend**: Check job creation form in `client/src/Form/` or `client/src/EmployerPages/ContractFactory.jsx`
- **Backend**: Check if `jobPostingController` overwrites company_description with employer profile data

## Test Case

User entered:
> Atlas-Meridian is a manufacturing firm specializing in precision industrial and consumer components. Our operations integrate standardized processes with a commitment to quality and continuous improvement. We serve a diverse set of clients across sectors, delivering reliable products through efficient production practices and a highly collaborative workforce. At Atlas-Meridian, safety, consistency, and operational excellence are central to how we design, build, and deliver value.

But job posting saved:
> Atlas-Meridian is a mid-sized manufacturer of precision consumer and industrial components.

(which matches the employer profile's company_description)
