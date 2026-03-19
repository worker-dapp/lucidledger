# Student Testing Issues

Running platform tests with students (first class session: 2026-03-17). This is a running list of issues to investigate and address.

**Session summary**: First time with more than 2 users. Most students could not complete the basic flow. The dominant failure was the platform not recognizing existing accounts, routing users back to onboarding repeatedly, and locking them out of Privy due to excessive OTP retries.

---

## 1. Worker name not enforced — applications showing "Unknown"

**Symptom**: Employer-side application review shows "Unknown" for worker names (fallback in `ApplicationReviewTab.jsx:303`, `AwaitingDeploymentTab.jsx:466`, `WorkforceDashboard.jsx:506`).

**Root cause (confirmed)**:
- Onboarding form (`UserProfile.jsx`, `validateForm` lines 163–164) DOES require first/last name client-side — students cannot skip it during sign-up.
- The "Unknown" names are coming from **the employee profile edit page** (`EmployeeProfile.jsx`), not onboarding.

**Specific bugs in `EmployeeProfile.jsx`**:

1. **Race condition on load** (lines 179–188): A `useEffect` fires immediately on mount with `!userDetails` (before the async `fetchUserDetails()` API call returns). It sets `firstName = user.first_name || ''` — but the Privy `user` object has no `first_name`, so it sets the state to `''`. If a student clicks **Edit → Save** on the contact section before the page finishes loading, they overwrite the DB with an empty name.

2. **No validation on save** (`handleSaveContact`, lines 247–257): `first_name: firstName` is saved unconditionally — no check that the field is non-empty. No validation anywhere in the edit profile save path.

3. **Backend has no validation either**: `employeeController.js` does `Employee.create/update(req.body)` with no required-field checks. DB model has `allowNull: true` on both name fields.

**To do**:
- Add required-field validation to `handleSaveContact` (and any other section saves that include name fields) in `EmployeeProfile.jsx`.
- Fix the race condition: either disable the Edit button until data loads, or initialize state from DB data only, not from the Privy user object fallback.
- Add server-side validation in `employeeController` for create and update to reject missing/empty `first_name` / `last_name`.
- Consider `allowNull: false` on name fields in the DB model (requires a migration).
- Audit same pattern in `EmployerProfile.jsx`.

---

## 2. CRITICAL: Existing accounts not recognized — users rerouted to onboarding (the dominant failure)

**Symptom**: Students who had already completed onboarding were being sent back to `/user-profile` and told "No account found!" on subsequent logins. Some went through onboarding 2–3 times. Screenshots confirm: verified email + phone, but "No account found" modal or blank onboarding form shown.

**Root cause (confirmed)**: The App.jsx profile check (`checkProfileAndRedirect`) looks up the profile by wallet address (`smartWalletAddress || primaryWallet?.address`). If the wallet address is `null` at check time, the entire lookup block is skipped, `profileExists = false`, and the user is routed to onboarding or shown the "No account found" modal.

The check runs after a hardcoded 300ms delay (App.jsx line 315). Under normal load with 1–2 users, Privy's smart wallet initializes in time. Under class-size load (20+ concurrent users), the smart wallet takes longer, and the 300ms window is too short. The check fires with no wallet address and incorrectly concludes the user has no account.

The "No account found" modal (screenshot confirmed) is shown when `loginIntent === 'login'` and `profileExists = false` — which is triggered by this exact failure.

**Secondary effect**: Students who hit the "No account found" modal tried logging in repeatedly, which triggered Privy OTP rate limiting (see issue #3).

**To do**:
- Replace the fixed 300ms delay with a proper wallet-ready wait — poll/watch for `smartWalletAddress` to be non-null before running the profile check, with a reasonable timeout (e.g. 5–8 seconds).
- Do NOT route to `/user-profile` or show the "no account" modal if the wallet address was never available — treat it as an indeterminate state and show a loading screen instead.
- After a timeout with no wallet, show an error with a "Try again" option rather than sending users to onboarding.

---

## 3. Privy "Too many attempts" lockout

**Symptom**: Students hitting "Request failed — Too many attempts" from Privy (screenshot confirmed). Locked out, "Try again later" with no indication of how long to wait.

**Root cause**: Privy rate-limits OTP requests per email/phone. Students who were being incorrectly told "No account found" (issue #2) kept re-requesting login codes trying to get back in. After ~5–10 attempts, Privy locks them out for 15 minutes.

**To do**:
- Fix issue #2 — it eliminates the cause of the retry loop.
- When Privy throws the "too many attempts" error, surface a human-readable message explaining the 15-minute lockout rather than the raw error modal.

---

## 4. Sign & Accept button broken on All Jobs tab

**Symptom**: "Unable to find the application record for this offer" alert when clicking Sign & Accept from the All Jobs tab (screenshot confirmed). Workaround: go to the Offers tab.

**Root cause (confirmed)**: `EmployeeJobsPage.jsx` fetches different data depending on the active filter. For the `all` filter (line 126–129), it calls `getActiveJobPostings()`, which returns job records but does NOT include `application_id`. The `application_id` is only mapped onto job objects in the `saved`, `applied`, and `offers` filter branches (lines 139, 150, 163). `handleSignContract` checks `selectedJob?.application_id` at line 324 and fails immediately when it is undefined.

**To do**:
- Either: include `application_id` in the data shape returned for the `all` filter by joining application data server-side or client-side.
- Or (simpler): hide the Sign & Accept / Decline buttons when `selectedJob.application_id` is undefined (i.e., when viewed from All Jobs tab) and show a prompt directing the user to the Offers tab.

---

## 5. Idle timeout too aggressive for classroom use

**Symptom**: Students reported being logged out multiple times within a ~10 minute span while actively using the site (reading job descriptions, filling forms).

**Root cause**: Idle timeout fires after 13 minutes of no mouse/keyboard/scroll activity (`useIdleTimeout.js`, `idleMs = 13 * 60 * 1000`). For demo/classroom use this is too short — students read slowly, get interrupted, or switch tabs to fill in address info. When they get logged out, they hit issue #2 on re-login.

**To do**:
- Extend `idleMs` to at least 30 minutes for demo mode, or make it configurable via an env var.
- Consider not auto-logging out during demo mode at all.

---

## 6. Employer "Profile Required" shown after successful login

**Symptom**: Student employer account (chloek@gwmail.gwu.edu) successfully authenticated and landed on `/contract-factory`, but the Contract Library tab shows "Profile Required — Please complete your employer profile to create contracts" (screenshot confirmed).

**Root cause (unknown, needs investigation)**: The App.jsx profile check found the employer record (otherwise they wouldn't have reached `/contract-factory`), but `ContractLibrary.jsx` is then failing its own profile check. Possible causes:
- Employer `approval_status` is `pending` — employer accounts require admin approval, and the contract library may be checking for `approved` status.
- The employer profile was created but incomplete (e.g., missing `company_name`) due to the wallet timing bug causing an interrupted onboarding.

**To do**:
- Check the employer's record in the DB — is `approval_status` still `pending`?
- Clarify in the UI whether the block is pending approval vs. incomplete profile — currently both show the same "Profile Required" message.
- During testing: ensure student employers are approved by admin before class.

---

## 7. Performance degradation under concurrent load

**Symptom**: Jobs tab failed to load during class. General slowness ("loads every page forever") reported by multiple students.

**Possible causes**:
- Backend/RDS under-resourced for 20+ concurrent users each making multiple API calls on login.
- The profile check on login makes 2–3 sequential API calls per user (intended role lookup + other role lookup + hasOtherRole check). With 20 students logging in simultaneously, that's 40–60 rapid DB queries.
- The catch block in `checkProfileAndRedirect` on API failure routes to `/user-profile`, which compounded issue #2.

**To do**:
- Profile the backend under load before the next class session.
- Combine the 2–3 role-check API calls into a single endpoint that returns both role statuses at once.
- Consider whether RDS instance size needs to be upgraded for class-size usage.
