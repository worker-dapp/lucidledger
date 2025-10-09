# Database Migrations

## Running Migrations

### For Existing Databases

If you have an existing database that needs the new fields, run:

```bash
# Connect to your PostgreSQL database and run:
psql -U your_username -d your_database -f server/migrations/add-missing-fields.sql
```

Or using Node.js migration script:

```bash
cd server
node scripts/run-migration.js add-missing-fields.sql
```

### For New Databases

For new database setups, simply run the main migration file which now includes all fields:

```bash
psql -U your_username -d your_database -f server/migrations/create-all-tables.sql
```

Or using Node.js:

```bash
cd server
node scripts/run-migration.js create-all-tables.sql
```

## New Fields Added

### Employee Table
- `street_address2` - Secondary address line (apartment, suite, unit, etc.)

### Employer Table
- `street_address2` - Secondary address line (apartment, suite, unit, etc.)
- `company_name` - Name of the company
- `company_description` - Description of the company, its mission, and what makes it unique
- `industry` - Industry sector of the company
- `company_size` - Size of the company (number of employees)
- `website` - Company website URL
- `linkedin` - Company LinkedIn profile URL

## Existing Fields (No Action Needed)
- `country_code` - Already exists in both tables

## Verification

After running the migration, verify the changes:

```sql
-- Check employee table structure
\d public.employee

-- Check employer table structure
\d public.employer
```

