# Auth / Infra Hardening — Sequenced To-Do (pre- and around the Verify fork)

**Purpose:** Ordered, checkable plan for the open auth/infra issues, grouped into waves by
dependency and risk rather than issue-number order.
**Context:** Track A (recruiter role) is committed and merged to `main` via PR #133 (2026-08-03).
Track B (fork to Lucid Verify) is next — see `lv-todo-list.md`. Several issues below are
foundational enough that Verify inherits them for free if done here first.

---

## Open decision (resolve before going past #66)

**Do we harden auth in Ledger and then fork, or fork first and build DID-based auth into
Verify from day one?** This changes whether #71 / #30 / #127 are Ledger work or Verify work.
Verify needs no wallet addresses at all, so it's a cleaner fit for DID-based auth than Ledger
(which is retrofitting). #66 is worth doing in Ledger regardless — it's pure groundwork with no
behavior change — so it doesn't force this decision. Decide before starting #71.

---

## Relevance triage (for the Verify fork)

**Foundational — do here so Verify inherits it:**
- **#71** — `x-wallet-address` is a client-set header used for authorization in several controllers,
  with nothing cryptographically tying it to the logged-in user. Fix: authorize off the Privy DID
  from the verified JWT; demote wallet address to a display field. Verify can adopt this from day one.

**General auth/infra, no blockchain dependency (all port to Verify):**
- #30 (centralize authorization), #66 (store Privy DID on records), #72 (admin check via API not env
  var), #74 (admin MFA), #127 (Privy auth → HttpOnly cookies), #13 (international phone/login —
  directly useful for Verify's target markets), #118 (account deletion), #121 (audit-log reliability —
  reliable record-keeping is Verify's whole value proposition), #94 (worker profile enrichment),
  #96 (KYC field validation), plus small UI/bug issues #63, #70, #98, #122, #130.

**Conceptually relevant (literal fix doesn't port, lesson does):**
- **#132** — recruiter-fee `tx_hash` trust. Literal fix (decode an ERC-20 Transfer log) is
  blockchain-specific and irrelevant to Verify. The lesson — never trust a client-submitted
  "payment succeeded" claim; verify against the source of truth — applies directly to the Wise
  integration. When building `MockWiseService` and the real integration, the backend must call
  Wise's API to confirm the transaction server-side, not trust the frontend. Same bug, different rail.

**Not relevant:** anything smart-contract-labeled; #49/#68/#69/#73/#76/#91 (wallet/gas/on-chain);
#100–#106/#112/#124–#126 (attendance oracles — Verify is one-time fee verification, not ongoing
wage/attendance tracking); #111/#129 (kiosk); #33/#48/#60/#75/#86 (dispute/mediator — a one-time
fee payment needs no DAO-style arbitration).

---

## The plan

### Wave 0 — Live security bugs
Exploitable today, independent of everything else.
- [x] **#131** — profile `PUT` mass-assignment / self-approval bypass (privilege escalation).
      Fixed and merged via PR #133 (2026-08-03): ownership check + field allowlist on both
      `PUT /api/employees/:id` and `PUT /api/employers/:id`.
- [x] **#132** — recruiter fee recorded from client-submitted `tx_hash`. **Done — PR #137 open (not
      yet merged).** Wallet-ownership check was already added; on-chain verification now implemented in
      `server/services/txVerificationService.js` (re-derives the ERC-20 Transfer from the receipt;
      `paid` only on match, `400` on definitive mismatch, `pending` on RPC/unmined). Shipped with the
      repo's first unit tests (15 cases, `node:test`) — the **first brick for #136**. Do NOT skip the
      lesson for Track B — see triage above.

### Wave 0.5 — Warm-up cleanup (parallel, not a blocker)
- [x] **#130** — ESLint cleanup. **Done — PR #137 open (not yet merged).** `npm run lint` 55 problems →
      0: dead-code removal, Fast-Refresh context extraction (3 new context files), Web NFC global, and
      documented/genuine hook-dep fixes. Landed as its own commit; gated nothing.

### Wave 1 — Identity foundation  ← **start substantive work here**
The spine the whole auth milestone leans on. **The one true hard dependency: #66 → #71.**
- [ ] **#66** — add `privy_did` column + capture-on-login (column + fill only; defer the frontend
      lookup-rewrite). No behavior change; safe to do regardless of fork timing.
- [ ] **#71** — wallet identity binding via DID. The big security win: kills the client-controlled
      `x-wallet-address` authorization across the affected controllers. (Resolve the fork decision first.)

### Wave 2 — Authorization + validation consolidation
Do this *after* #71 — otherwise you centralize the old header pattern and immediately redo it.
- [ ] **#30** — centralize authorization & input validation into a shared helper as the canonical
      pattern; #71's DID lookup becomes the standard authz primitive.
- [ ] **#96** — conditional US/CA state validation. Ride it along on #30's validation scaffolding.
- [ ] **#121** — audit-log reliability. Pulled up from v0.5.0 to here: #131 and #118 are exactly the
      security-sensitive actions you want guaranteed-logged, and reliable records are Verify's core value.
- [ ] **#136** — stand up the unit-test harness *here*, alongside #30, so #30's shared authz/validation
      helper ships tested from day one rather than retrofitted. `node:test` (zero deps); target the
      security/money-critical paths (#132 verification, #131/#132 ownership checks, #30 helper, #96),
      not a coverage number. See the cross-cutting Testing note below.

### Wave 3 — Admin hardening
- [ ] **#72** — admin check via `GET /api/admin/check` instead of the frontend env var. Small.
- [ ] **#74** — admin MFA (evaluation / exploratory). Do alongside the admin path.
- [ ] **#122** — idle-timeout auto-logout not firing. Promoted here from the UI bucket for its
      security angle.

### Wave 4 — Transport hardening (last in the auth milestone)
- [ ] **#127** — Privy auth → HttpOnly cookies. Changes how the token *arrives*, not the DID authz
      logic. Do it once, against a settled identity/authz model, so you don't re-touch it.

### Wave 5 — Identity-adjacent features
- [ ] **#13** — international phone/login. Benefits from the settled lookup path; directly relevant
      to Verify's target markets.
- [ ] **#118** — account deletion. Needs the identity model and reliable audit logging (#121) first.
- [ ] **#94** — worker profile enrichment. Independent; no dependency pressure — slot in anytime.

### Cross-cutting — interleave as palate cleansers
- [ ] **#63 / #70 / #98** — low-risk UI/bug fixes. Interleave between the heavy auth waves.

### Cross-cutting — Testing (#136)
An *ongoing practice*, not a single bottom-of-list task. Rationale: tests don't improve the demo — a
viewer never sees them — but the fork copies the shared spine (authz, identity, validation, payment
verification) into two products at once, so a bug there ships twice. Tests written in Ledger for that
foundational logic port to Verify for free.
- **Harness:** Node's built-in `node:test` — zero new deps; wire `server`'s `npm test` to `node --test`.
- **Scope by value, not percentage.** Cover pure security/money-critical logic; skip brittle UI/coverage
  chasing. Keep unit tests deterministic and offline (inject fakes for RPC/DB).
- **Anchor at Wave 2 (with #30), then ride each later wave** — add tests for a wave's security-critical
  pieces as it lands (#66/#71 identity, #72/#74 admin, #96 validation).
- **First brick:** `verifyUsdcPayment` (#132) — can land immediately with the Wave 0 fix.

---

## Where this diverges from the milestone tags
- Pull **#121** from v0.5.0 up to the auth work (Wave 2).
- Do **#130** and **#122** earlier than v0.5.0.
- Stand up testing (**#136**) at Wave 2 alongside #30 — an ongoing practice, not a dead-last chore.
- Within v0.3.2, strict internal order: **#72 → #74 → #127** (#127 last is the key one people get wrong).
- The only hard dependency is **#66 → #71**. Everything else is soft ordering optimized for two rules:
  don't build on unsettled ground, and don't touch the same file twice.
