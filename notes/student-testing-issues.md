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

---

## Post-Session Fix Attempt (2026-03-18) — What Was Done and What Still Fails

### Fixes shipped (commit `d53306e`)

The following issues were addressed and deployed:

**Issue #2 (dominant failure — accounts not recognized)**
- Replaced hardcoded 300ms delay with a `!!smartWalletAddress` gate on `shouldCheck` in `App.jsx`. The profile check now waits until Privy's smart wallet is initialized before firing. This eliminates the false "no account found" error caused by the wallet not being ready under load.
- Fixed the catch block to reset redirect flags instead of routing to `/user-profile` on transient API errors, stopping the cascade into repeated onboarding.

**Issue #7 (performance under load)**
- Replaced 3 sequential profile-check API calls (one per role + hasOtherRole) with a single `/api/profile-status` endpoint that queries both `employee` and `employer` tables in parallel (`Promise.all`). Cuts login DB load by ~60%.
- Increased Sequelize connection pool from `max: 5` to `max: 10` (safe ceiling for db.t3.micro/t3.small).
- RDS instance manually upgraded from db.t3.micro to db.t3.small via AWS console (2x RAM, better burst headroom).

**Issue #1 (worker names showing "Unknown")**
- Removed race-condition `useEffect` in `EmployeeProfile.jsx` that was overwriting `firstName`/`lastName` with empty strings from the Privy user object (which has no name fields).
- Added first/last name validation to `handleSaveContact` — save is blocked if either field is empty.

**Issue #4 (Sign & Accept broken on All Jobs tab)**
- Replaced broken button with a redirect prompt directing workers to the Offers tab when `application_id` is not available in the All Jobs data shape.

**Issue #6 (false "Profile Required" banner)**
- Added `isLoading` state to `EmployerLayout` and `EmployeeLayout` contexts.
- `ContractLibrary` now shows a spinner while employer data is loading instead of immediately rendering the "Profile Required" banner. Eliminates the false positive caused by async employer fetch completing after initial render.

### Issues NOT yet fixed

- **Issue #3** (Privy OTP lockout): Fixing issue #2 removes the main cause of the retry loop, but no UI improvement for the lockout message yet.
- **Issue #5** (idle timeout too short): Still 13 minutes. Not extended yet.
- **Issue #1** (server-side validation): Frontend validation added, but `employeeController` still has no server-side name validation and DB `allowNull` is still `true`.

### Partial success (2026-03-19 follow-up session)

The redirect loop (issue #2) is **confirmed fixed** — students are no longer being sent to the onboarding wizard on re-login. However, a new symptom appeared: **students returning to their accounts found their profiles empty**.

Two possible causes (not yet diagnosed — DB check needed):

**Cause A — Data was corrupted during the March 17 broken session**: The issue #1 race condition in `EmployeeProfile.jsx` (now fixed) may have overwritten student names with empty strings during the first session. If a student clicked Save on their profile page before the DB data loaded, their name was wiped. The profiles exist in the DB but have null/empty fields. To confirm: query the `employee` table for affected students and check `first_name`/`last_name`.

**Cause B — Profile data not loading on the profile page**: The profile exists and has data in the DB, but the profile page is rendering blank. This would be a fetch or display bug introduced by or revealed by the recent changes.

Action: check DB records for affected students to distinguish A from B.

---

### Still failing under load (2026-03-19)

Despite the fixes above, the platform still breaks under class-size load (~5+ concurrent users). The smartWalletAddress gate was the most important fix but has not fully resolved the problem. Possible remaining causes:

1. **Privy smart wallet initialization is still too slow under load.** Even with the gate, if Privy's infrastructure is under heavy concurrent load (many students initializing smart wallets at once), `smartWalletAddress` may still take many seconds to resolve. The current code re-fires the profile check when `smartWalletAddress` becomes available — but if it takes too long, users may navigate away or trigger other issues first. A visible "waiting for wallet..." loading state would help.

2. **Privy RPC proxy returning 400 errors.** The browser console shows `base-sepolia.rpc.privy.systems` returning HTTP 400 on smart wallet RPC calls. This affects the employer-side contract deployment flow (gas simulation errors in Coinbase modal) and may be contributing to smart wallet initialization failures under load. See `notes/privy-rpc-400-error-2026-03-18.md` for full diagnosis. Next step: check Privy dashboard for chain/network configuration issues.

3. **Remaining DB/API pressure.** Even with the consolidated endpoint, each user still makes multiple API calls after login (employer profile, job postings, applications, contract templates). Under 20 concurrent users this adds up. The db.t3.small upgrade helps but may not be sufficient if students are all hitting authenticated pages simultaneously.

---

## 8. HTTP 429 rate limit errors during class (confirmed)

**Symptom**: Student received "HTTP error! status: 429" in the Clock In/Out modal on `/job-tracker` (screenshot confirmed, Mar 17 11:03 AM).

**Root cause (confirmed)**: Production rate limiting in `server.js` is set to **100 requests per 15 minutes per IP address** (`express-rate-limit`). On a university network, all students share the same public IP (NAT/proxy). With 15–20 students each making multiple API calls simultaneously (login, profile fetch, job data, clock in/out), the collective request count from that single IP easily exceeds 100 within the window, and all subsequent requests from any student are rejected with 429 until the window resets.

**Secondary symptom (confirmed)**: Under the same load, the employer was repeatedly being dumped back to the employee landing page (`/`) instead of routing to `/contract-factory`. Root cause: the `/api/profile-status` call inside `checkProfileAndRedirect` was itself getting 429'd. The catch block resets redirect flags and leaves the user on whichever landing page they started from. Since login typically starts at `/`, employers were stuck there with no profile check completing. Once concurrent load dropped, requests spread out, the profile check succeeded, and routing worked correctly.

**Fix applied (2026-03-19, commit `b5e35ee`)**:
- General rate limit: 100 → **5,000 req/15 min per IP**
- Admin rate limit: 20 → **200 req/15 min per IP**

Rationale: 50–100 students on a shared university NAT IP, each generating 10–15 API calls on login (many doubled due to React re-renders), can easily produce 3,000+ requests at class start. 5,000 gives headroom for realistic classroom and institutional deployment scenarios. Authenticated endpoints are still protected by Privy JWT verification, limiting the actual abuse surface even with a high IP ceiling.

**Additional fixes applied (2026-03-19):**

**Duplicate API calls eliminated (commit `4e7c1f8`)**: Both `EmployerLayout` and `EmployeeLayout` had `useEffect` hooks with multiple dependencies (`smartWalletAddress`, `user`, `primaryWallet`) that all resolved near-simultaneously after login, causing the employer/employee fetch to fire 2–3 times in rapid succession. Each duplicate fetch updated context state with a new object reference, which cascaded into all child tabs (PostedJobsTab, ApplicationReviewTab, AwaitingDeploymentTab, etc.) re-firing their own data fetches — roughly doubling total API requests per page load. Fixed by adding an `isFetchingRef` guard to prevent concurrent duplicate fetches in both layout components.

**Switched to per-user rate limiting (commit `e26c663`)**: Replaced IP-based limiting with per-wallet limiting using the `x-wallet-address` header sent by the frontend on all authenticated requests. Falls back to IP for unauthenticated requests. Each student is now completely independent — a full classroom on university WiFi won't affect anyone else's limit.

Final limits:
- General: **300 req / 15 min per wallet** — covers active job-seeker browsing (10 jobs viewed, 5 saved, 3 applied + page loads ≈ 80–100 requests; 300 gives comfortable headroom)
- Admin endpoints: **50 req / 15 min per wallet**
- Unauthenticated (no wallet header): falls back to IP at same caps

---

### Recommended next steps for colleague review

- **Is there a way to pre-warm or eagerly initialize Privy smart wallets** to reduce the initialization lag under load? Privy's `SmartWalletsProvider` may have options for this.
- **Is the `smartWalletAddress` gate sufficient or do we need a timeout + retry UI?** Currently users see a blank/loading state with no feedback while waiting. A visible progress indicator and a "this is taking longer than expected — try refreshing" message after 10s would reduce panic re-logins.
- **Should we move away from Privy's RPC proxy for smart wallet calls?** The 400 errors from `base-sepolia.rpc.privy.systems` suggest Privy's RPC routing has an issue for this app. If Privy support can't resolve it, we may need to configure `SmartWalletsProvider` with a direct RPC endpoint.
- **Load testing**: Before the next class session, simulate 20 concurrent logins against the staging environment to confirm fixes hold and identify remaining bottlenecks.
