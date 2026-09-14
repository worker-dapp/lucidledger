# Follow-ups raised during #66 / #71 (session 2026-09-10)

Inventory of everything flagged while doing the identity-binding work but **not** fixed in
it. Each entry says what it is, why it matters, and whether it was pre-existing or
introduced. Nothing here blocks #66a/#71.

Ordered roughly by severity.

---

## 1. Rate limiter keys on a client-controlled header — **security, pre-existing**

**Filed as #142.**

`server.js:46` — `perUserKeyGenerator` keys the production rate limiter on
`req.headers['x-wallet-address']`, falling back to IP.

Two consequences:
- **Evasion:** a caller can rotate the header per request and get an unlimited number of
  fresh 300-request buckets, defeating the limit entirely.
- **Targeted exhaustion:** a caller can set the header to *another user's* wallet and burn
  that user's quota, producing a cheap per-victim denial of service. Wallet addresses are
  public on-chain.

Not introduced by this work, but it is now the **last remaining place** where the header
influences behavior, so it stands out. The reason it uses the header is structural: the
limiter is mounted at `server.js:62`, before any route, so `req.authSubject` does not
exist yet. Fixing it means either decoding/verifying the JWT inside the key generator or
moving per-user limiting behind auth and keeping a coarse IP limit in front.

Production-only (`NODE_ENV === 'production'`), so not reachable in dev.

## 2. Mediators and recruiters are authorized by a mutable email on every request — **security hardening**

**Filed as #143.**

Neither table has an `auth_subject` column, so both resolve by Privy-verified email on
every request:
- `deployedContractController.resolveMediator` → `mediators.email`
- `recruiterController` (~line 121) → compares `req.user.email` to `recruiter.email`

The email is Privy-verified, so this is **stronger than before** (mediators previously
matched the forgeable `wallet_address` header). But it is weaker than employee/employer:
the email is typed in by an admin, is mutable, and re-deriving authorization from it on
every request means changing that one field reassigns who the mediator *is*.

Unlike employee/employer, these rows cannot have `auth_subject NOT NULL` — an admin
creates them before the person has ever logged in, so there is no subject to bind at
creation. They need a genuine **claim-on-first-login** step, gated on the verified email,
after which authorization keys off the stamped subject. That is narrow and one-time, which
is a different thing from the wallet fallback that was deleted.

Both tables are referenced by foreign keys (`deployed_contracts.mediator_id`,
`dispute_history.mediator_id`), so they must stay DB rows — the env-var allowlist model
used for admins is not available to them.

Drafted as a GitHub issue; see "Proposed follow-up issue" below.

## 3. A Privy `getUser()` failure silently un-privileges mediators and admins — **reliability**

**Filed as #145** (with item 6).

`authMiddleware.js:137` — if the Privy user lookup throws, `verifyToken` only
`console.warn`s and leaves `req.user.email` unset. Authorization continues with no email,
so `isAdminRequest` and `resolveMediator` both return false/null.

Fails **closed**, which is the right direction, but opaquely: a transient Privy outage
presents as "admin and mediator endpoints started returning 403" with no signal tying it
to the cause. Worth either surfacing it as a distinct 503 for email-dependent paths, or at
minimum logging at error level with a counter.

## 4. Duplicate profiles are possible via an unlinked login method — **correctness / UX**

**Filed as #144.**

`auth_subject` and `wallet_address` are UNIQUE on employee/employer, but **email is not**
(migration 027 dropped the email unique constraints).

So: a user signs up with email → DID-A, wallet-A. Later they log in with a phone number
that was never linked to that Privy account → Privy issues a **different** DID and a
different smart wallet. Nothing matches, so they are routed to onboarding and create a
**second** profile with the same email. Both unique constraints are satisfied, so the DB
accepts it.

This is inherent to binding identity to the auth subject and is not a regression — but it
is newly *reachable* now that there is no wallet fallback to accidentally reunite them.
Mitigations worth considering: detect an existing row with the same verified email during
onboarding and prompt to link the login method instead; or treat email as unique again.

Also note the near-miss: if the unlinked login somehow produced the *same* wallet, the
`wallet_address` UNIQUE constraint would reject the insert as an opaque 500 rather than a
useful message.

## 5. `db:reset` is stale — **operational**

**FIXED 2026-09-10** in this change: the script now discovers tables from `pg_tables`
instead of carrying a hardcoded list. Verified clearing 18 tables, up from the 11 of its
listed 12 that still existed.

`server/scripts/resetDb.js` truncates 12 tables but misses every table added since it was
written: `recruiters`, `recruiter_fee_payments`, `audit_log`, `kiosk_devices`, `qr_tokens`,
`presence_events`, `nfc_badges`.

So "reset all data" silently leaves recruiters and audit history behind — during this
session a "reset" DB still had 2 recruiters in it. Anything relying on reset for a clean
slate (including the QA pass) is working from a false premise. Worth either enumerating
the tables from the migration list or truncating everything in `public` except a
allowlist.

## 6. Invalid bearer token returns 403 where 401 is correct — **cosmetic, pre-existing**

**Filed as #145** (with item 3).

`authMiddleware.js:118` — a malformed or unverifiable token yields 403. A *missing* token
correctly yields 401. Per RFC 7235, a bad credential is 401 (re-authenticate); 403 means
"authenticated but not permitted", which misleads clients into not refreshing the token.

Identical in the committed version, so unrelated to this work. Confirmed by diffing
against `HEAD`.

## 7. `ADMIN_WALLETS` is now entirely unused — **cleanup**

**FIXED 2026-09-10** in this change: removed from `CLAUDE.md` (the only place that still
documented it) and from the test that set it. It was never present in `server/.env`.

No code references it after this change (`isAdminWallet` was deleted). It is still present
as an empty env var in the Docker env and is documented in `CLAUDE.md`. Worth removing from
both so nobody later populates it expecting it to do something.

Worth noting it was **already** empty in the dev environment, which means admin contract
overrides keyed on `ADMIN_WALLETS` matched nobody before this change. The move to
`ADMIN_EMAILS` was a fix, not just a tidy-up.

## 8. Migrations 032 + 033 could be one migration — **minor**

032 adds `auth_subject` nullable; 033 makes it NOT NULL. The two-step shape is a historical
artifact of the backfill plan. For a fresh deploy one migration would be clearer. Low
value to change now (032 has already run in environments), and issue **#107** already
tracks squashing historical migrations into a baseline pre-pilot — fold it in there.

## 9. Deferred, already tracked elsewhere

- **#66b** — the remaining half of #66: by-subject lookup endpoints and rewriting the
  `App.jsx` email→wallet→phone fallback chain. Deliberately deferred; no security stakes.
  Partly overtaken by events, since `profile-status` now resolves purely by subject.
- **#89** — server-side EIP-712 signature verification on offer signing
  (`jobApplicationController.js:382`). The comment there notes the real obstacle: the
  header carries the smart-wallet (contract) address while the actual signer is the
  underlying EOA, so correct verification needs the EOA stored. Unrelated to this work but
  it is the other place a wallet address is taken on faith.
- **#72** — migrate the frontend admin check off `VITE_ADMIN_EMAILS`. Information exposure
  only (admin emails in the JS bundle); backend admin authorization is unaffected.

## 10. Consequence of clearing production — **accepted, not a defect**

Clearing `deployed_contracts` orphans the existing Base Sepolia contracts: they remain
on-chain forever but the app no longer knows about them. Acceptable for testnet demo data;
recorded because it is irreversible.

---

## Filed issues

| Item | Issue | Title |
| --- | --- | --- |
| 1 | [#142](https://github.com/worker-dapp/lucidledger/issues/142) | Rate limiter keys on client-controlled `x-wallet-address` header |
| 2 | [#143](https://github.com/worker-dapp/lucidledger/issues/143) | Bind mediator/recruiter identity to `auth_subject` via claim-on-first-login |
| 4 | [#144](https://github.com/worker-dapp/lucidledger/issues/144) | Duplicate profiles when logging in with an unlinked auth method |
| 3, 6 | [#145](https://github.com/worker-dapp/lucidledger/issues/145) | Auth middleware hygiene: silent Privy lookup failure; 403 vs 401 |

Items 5 and 7 were fixed in this change. Item 8 folds into #107; item 9 was already
tracked; item 10 is accepted.

---

## Appendix — #143 body as drafted

`employee` and `employer` now resolve authorization from `auth_subject` (the verified JWT
`sub`), which is NOT NULL and written at record creation (#71). `mediators` and
`recruiters` were not converted and still resolve by Privy-verified email on every
request:

- `deployedContractController.resolveMediator` → `mediators.email`
- `recruiterController.updateRecruiter` → `req.user.email` vs `recruiter.email`

This is not a regression — mediators previously matched the client-set `x-wallet-address`
header, so a verified email is strictly stronger. But it leaves two privileged roles
(mediators resolve disputes and can move escrowed funds) authorized by a mutable,
admin-entered field, re-derived on every request. Editing one email field reassigns who
that mediator is.

These rows cannot simply get `auth_subject NOT NULL`: an admin creates them *before* the
person has ever logged in, so no subject exists at creation time.

**Proposed fix:**
1. Add nullable `auth_subject` to `mediators` and `recruiters` (UNIQUE).
2. On first login, if the verified email matches a row with a NULL `auth_subject`, stamp
   the subject onto it — a one-time claim, gated on an attribute the server verifies via
   Privy rather than anything the client supplies.
3. Thereafter resolve by `auth_subject` only; email stops being an authorization input.
4. Surface unclaimed rows in the admin UI as "invited, not yet activated" so a stuck
   invite is visible.

**Also worth deciding:** whether a claim should be refused when the row's email has been
edited since the invite was sent, to prevent an admin redirecting an invite to a different
person after the fact.

**Depends on:** #71
