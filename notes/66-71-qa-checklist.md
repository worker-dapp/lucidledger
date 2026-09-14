# #66 / #71 — QA Smoke Test (identity binding via `auth_subject`)

Manual end-to-end pass for the identity work. Run in **Docker** (migrations must run
against the DB and you need real Privy JWTs). Nothing is committed until this passes.

> **Rewritten 2026-09-10.** The first version of this checklist tested a backfill-on-login
> path that no longer exists. That path was found to be exploitable during the QA run (see
> "What changed and why"), and was deleted rather than fixed. The riskiest section of the
> old checklist is therefore moot, and what remains is ordinary.

---

## What changed and why

**Original design.** `auth_subject` (the verified JWT `sub`) was added as a nullable
column. Existing rows started NULL and were filled in on first login: if no row matched
the caller's subject, the code matched by wallet address and stamped the subject onto
whatever it found.

**The defect.** The wallet address came from the client-set `x-wallet-address` header. So
for any row with a NULL subject, an authenticated caller could send *someone else's*
wallet address, be handed that person's record, and have their own subject written
permanently onto it. That is the exact vulnerability #71 was filed to remove, still open
for un-backfilled rows — and worse than before, because the claim persisted. Wallet
addresses are public on-chain, and at deploy time **every** row is NULL simultaneously, so
exposure was widest at the moment the fix shipped.

Verified empirically, not just by reading: running the new regression assertions against
the old implementation showed the attacker receiving the victim's record and the victim's
row ending up stamped with `did:privy:attacker`.

**Current design.** Since this is pre-pilot, the tables are **cleared** rather than
backfilled, which allows the weak path to be deleted instead of guarded:

- `resolveEmployee` / `resolveEmployer` are a single lookup by verified subject. No
  fallback, no wallet, no secondary identifier.
- `auth_subject` is **NOT NULL** (migration 033) and is written at record creation from
  the verified token. A row with no bound identity cannot be stored.
- `x-wallet-address` is not an authorization input anywhere. It survives only as display
  metadata, the EIP-55 normalizer, and the rate-limit key (see open issues).

Net effect: the unauthorizable state is unrepresentable, so no code path has to decide
what to do about one.

---

## Pre-flight

- [ ] **Production employee/employer tables cleared before deploying.** Migrations run on
      startup, so a surviving NULL row makes migration 033 fail and the server will not
      boot. Intentional — failing loudly beats admitting a row that cannot be authorized —
      but it means **clear, then deploy**, never the reverse.
- [ ] Startup logs show `032-add-auth-subject.sql` → completed, then
      `033-auth-subject-not-null.sql` → completed.
- [ ] `information_schema.columns` reports `is_nullable = NO` for `auth_subject` on both
      tables.
- [ ] Admin account's email is in **`ADMIN_EMAILS`** (admin contract overrides key off
      this, not `ADMIN_WALLETS`, which is unused and empty).
- [ ] `npm test` in `server/` passes (includes the regression guards below).

## No backfill step any more

Every row is created by its own logged-in owner, so `auth_subject` is set at creation.
There is no "log in first to backfill" ordering requirement — the old checklist's main
source of procedural error is gone.

---

## Per-role checks (exercise the flipped endpoints, not just dashboard load)

Each role needs a **fresh profile** created through onboarding, since the tables are
empty. After each creation confirm: `SELECT id, auth_subject FROM employee;` → subject
populated immediately, never NULL.

### Employee
- [ ] Onboard → profile created, `auth_subject` populated at creation.
- [ ] Edit profile & save (`updateEmployee`).
- [ ] Job Tracker → own contracts list loads (`getByEmployee`).
- [ ] Open a single contract (`getById`).
- [ ] Raise a dispute / change contract status (`updateDeployedContractStatus`).
- [ ] (If testing oracles) generate a QR token.

### Employer (needs admin approval after onboarding)
- [ ] Onboard → `auth_subject` populated; `approval_status` starts `pending`.
- [ ] Approve via `/admin/employers`.
- [ ] Edit profile & save (`updateEmployer`).
- [ ] Deploy a contract (exercises `requireApprovedEmployer` + create authz).
- [ ] View posted contracts (`getByEmployer`).
- [ ] Complete a contract with payment (`completeContractWithPayment`).
- [ ] (If set up) record a recruiter fee (`createFeePayment`).

### Mediator — **must log in with the email on the mediator row**
Mediator rows are created by an admin before the person ever logs in, so they have no
`auth_subject` and are still resolved by the Privy-verified email. A phone-only login
leaves `req.user.email` unset and **every mediator endpoint 403s**.
- [ ] Create the mediator in `/admin/mediators`, then log in as that email.
- [ ] `/resolve-disputes` → disputed list loads.
- [ ] Resolve a disputed contract (`updateDeployedContract` mediator path).

### Recruiter — same email dependency as mediator
- [ ] Log in → lands on `/recruiter-dashboard`.
- [ ] Update recruiter profile (authorized by verified email vs `recruiter.email`).

### Admin
- [ ] `/admin` loads (email must be in `ADMIN_EMAILS`).
- [ ] An admin-acting-on-a-contract flow works.

---

## Negative test (confirms the fix bites)

Needs a **second employee** who is not a party to the contract under test. Use a
plus-alias (`...+qa1@gmail.com`) so the OTP lands in your normal inbox — and **not** an
address in `ADMIN_EMAILS`, or `isAdminRequest` legitimately grants access and the test
looks like a failure when the code is correct.

- [ ] As employee B, `GET /deployed-contracts/<A's contract id>` → **403**.
- [ ] As employee B, `GET /deployed-contracts/employee/<A's id>` → **403**.
- [ ] As employee B with **A's wallet forged into `x-wallet-address`** → still **403**.
      This is the original attack; it must now have no effect at all.
- [ ] Positive control: as employee B, reading B's *own* data → **200**. Without this, a
      broken token would make every check above pass for the wrong reason.

Automated coverage for the same property lives in
`server/services/identityService.test.js` ("Regression: the wallet header must never
influence identity"). Those assertions were confirmed to fail against the old
implementation, so they are real guards rather than tautologies.

---

## Already verified (2026-09-10, local Docker)

- [x] Migrations 032 + 033 run clean; `auth_subject` NOT NULL on both tables.
- [x] `INSERT` without `auth_subject` is rejected by the DB.
- [x] Server unit tests 24/24; client lint clean; client build passes.
- [x] Static sweep: **zero** client-supplied wallet authorization reads in `controllers/`,
      `middleware/`, `routes/`. `isAdminWallet` / `ADMIN_WALLETS` fully removed.
- [x] Unauthenticated calls to flipped endpoints → 401, including with a valid wallet in
      the header. No data mutated.
- [x] Backfill-on-login *did* work correctly before removal (NULL → `did:privy:...`, and
      only for the record that logged in) — removed for being forgeable, not for being
      broken.

## Open issues raised during this work

See `notes/66-71-followups.md` for the full inventory.
