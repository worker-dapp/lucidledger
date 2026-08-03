# Employer Onboarding Failure: Phone-Only Signup

**Date**: 2026-04-03
**Reported by**: User (josh.young@gwu.edu)
**Symptom**: "Failed to update profile. Please try again." on employer onboarding form submission
**Resolution**: Switched from phone login to email login — succeeded immediately

---

## What Happened

A new user (first time on the platform) attempted to sign up as an employer via Privy phone/OTP authentication. After filling out all required fields on the employer onboarding form (`/user-profile`) and clicking submit, they received the generic "Failed to update profile. Please try again." error.

The browser console showed:
```
POST https://lucidledger.co/api/employers → 500
API request failed for /employers: Error: Error creating employer
Error updating profile: Error: Error creating employer
```

After switching to email OTP login, the same form submitted successfully.

---

## Why This Matters

The Employer model has `email: { allowNull: false }` both in the Sequelize model definition and in the underlying DB column (`email character varying(255) NOT NULL`). This constraint is only satisfied when a user logs in via email. A phone-only Privy user has `user.email.address = undefined`, so the frontend sends `email: ''` (empty string) or potentially the constraint is violated at the DB level.

---

## Theories

### Theory 1 (most likely): `email NOT NULL` constraint violated by phone-only users

The frontend builds the payload with:
```javascript
const currentEmail = user?.email?.address || '';
payload.email = currentEmail;
```

If the user authenticated via phone only, `user?.email?.address` is `undefined`, so `currentEmail = ''`. The DB column is `NOT NULL`, and Sequelize's `allowNull: false` treats empty string as valid (not null), so Sequelize does not reject it — but the DB may enforce `NOT NULL` with some additional check, or the empty string could collide with the `CONSTRAINT employer_email_key UNIQUE (email)` if that constraint was not successfully dropped by migration 018.

**Sub-theory 1a**: Migration 018 (`018-fix-email-wallet-constraints.sql`) drops the email unique constraint with `ALTER TABLE employer DROP CONSTRAINT IF EXISTS employer_email_key`. If this migration ran successfully, an empty-string email would insert without a unique violation. But if another employer row already exists with `email = ''` (e.g., from a previous phone-only signup attempt by any user), the unique constraint (if still present) would reject the insert.

**Sub-theory 1b**: Migration 018 failed partway through (the `ADD CONSTRAINT ... UNIQUE (wallet_address)` statements at the end may have failed if there were pre-existing duplicate wallet_address values in the DB). If the migration runner stopped at that failure, the DROP CONSTRAINT statements at the top might also not have executed — leaving the original `employer_email_key UNIQUE (email)` constraint in place. In that case, ANY two phone-only employer signups would conflict on `email = ''`.

### Theory 2: Sequelize `allowNull: false` rejects empty string in newer versions

Some Sequelize versions added a `notEmpty` implicit validator when `allowNull: false` is set, rejecting empty strings in addition to null. If the Sequelize version installed treats `''` as a violation of `allowNull: false`, the insert would throw a Sequelize `ValidationError` before hitting the DB. This would produce a 500 from `createEmployer`'s catch block.

### Theory 3: Phone number lookup path differs in profile-status check

The `/api/profile-status` endpoint only checks `wallet_address`, not phone. If a phone-only user previously submitted the form and a partial employer record was inserted (with the phone-derived identity but an empty/null wallet), the profile-status check would not find it (lookup is by wallet), routing the user back to onboarding. On the second attempt the email is still empty and the insert fails for the same reason, but now there IS a stale record in the employer table which might cause additional conflicts.

---

## What We Don't Know

The actual Sequelize/PostgreSQL error message was not captured. The frontend displays the generic "Failed to update profile" and the console only shows the server's outer message ("Error creating employer"). The inner `error.message` (the real DB/Sequelize error) is returned in the response body under the `error` key but the frontend doesn't display it.

---

## Resolution (2026-04-03)

Confirmed via production DB inspection. The employer table had 14 copies of the email unique constraint (`employer_email_key1` through `employer_email_key14`), accumulated during early development when Sequelize's `sync()` was called on every server restart while the model had `unique: true` on email. Migration 018 dropped only the original `employer_email_key` — unaware of the numbered duplicates.

The employee table had the same 14 duplicate constraints.

**Fix**: Migration 027 (`027-drop-duplicate-email-constraints.sql`) drops all numbered duplicates from both tables using `DROP CONSTRAINT IF EXISTS`. Deployed 2026-04-03, commit `aa4605d`. Migration ran successfully on production — confirmed by re-querying constraints after deployment.

Also confirmed: no orphaned partial records in the DB from failed phone-only signup attempts.

**To verify**: Have a user sign up as an employer using phone-only login in the next student session and confirm it succeeds.

---

## Steps to Debug / Confirm

### 1. Check the actual DB error from the response body
Have a test user reproduce the failure with phone-only login. In DevTools → **Network tab** (not Console), find the failed POST to `/api/employers`, open **Preview/Response**, and read the `"error"` field. This will give the exact PostgreSQL or Sequelize error (e.g., "null value in column email", "duplicate key value violates unique constraint employer_email_key", etc.).

### 2. Check migration 018 status on production
SSH into the production server and run:
```bash
cd /app/server
node -e "
const { sequelize } = require('./config/database');
sequelize.query(\`
  SELECT constraint_name, constraint_type
  FROM information_schema.table_constraints
  WHERE table_name = 'employer'
\`).then(([rows]) => { console.log(JSON.stringify(rows, null, 2)); process.exit(0); });
"
```
Verify whether `employer_email_key` is present (should be gone after migration 018) and whether `employer_wallet_address_key` is present (should have been added by migration 018).

### 3. Check for stale phone-only employer records
```sql
SELECT id, email, wallet_address, phone_number, created_at
FROM employer
WHERE email IS NULL OR email = ''
ORDER BY created_at DESC;
```
If rows exist with empty/null email, those are failed phone-only signups. Delete or update them as appropriate.

### 4. Reproduce deliberately
Create a new Privy account using phone-only (no email linked), go through employer onboarding, and attempt to submit. Confirm the 500. Then check the Network response body for the exact error.

---

## Fixes to Consider

1. **Immediate**: Make `email` nullable in both the Sequelize Employer model (`allowNull: true`) and the DB column (`ALTER TABLE employer ALTER COLUMN email DROP NOT NULL`). Email is not the identity anchor — wallet address is. There is no reason for it to be required.

2. **Onboarding guard**: Before submitting the employer form, validate that `currentEmail` is non-empty if the DB column remains `NOT NULL`. Show a user-facing error like "Please link an email address to your account before continuing" with a link email button (already available via `linkEmail()`).

3. **Better error surfacing**: In `createEmployer` controller, pass `error.message` through to the client response in a way the frontend can display, instead of the generic "Failed to update profile" message. This would make future issues immediately diagnosable without needing DevTools.

4. **Migration 018 audit**: Verify migration 018 fully applied on production. If the `employer_wallet_address_key` unique constraint is missing, add it manually.
