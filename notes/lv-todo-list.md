# Lucid Verify — Execution Todo List

**Created:** July 30, 2026
**Source plan:** `notes/lucid-verify.md` (see "Technical Implementation Plan" section for sizing/reuse detail)
**Purpose:** Ordered, checkable steps from here to a demoable Lucid Verify prototype.

---

## Track A: Finish & Test the Recruiter Role in Lucid Ledger (upstream, open source)

Do this first — it's a prerequisite for the fork, and has standalone value regardless of the Verité partnership.

- [x] Rebuild Docker containers — **not actually needed**: both containers use bind-mounted volumes with nodemon/Vite hot-reload, so they've been running current code all along (container was just *created* weeks ago; nodemon restarts on every save)
- [x] Manually test existing recruiter scaffold end-to-end — **confirmed via backend logs**: recruiter self-signup, employer assigning a recruiter to a job posting, and the recruiter dashboard re-fetching assigned jobs all ran successfully with no errors (account `manny.teitelbaum@gmail.com`, job posting #2)
- [x] Visually confirm in-browser — **confirmed end-to-end** with a fresh test account (`ethical_recruiter@yahoo.com`): recruiter signup, employer assignment, and dashboard rendering all verified visually, not just via logs
- [x] Fix any bugs surfaced by that walkthrough — **found and fixed**: recruiter signup never captured the Privy smart wallet address (`RecruiterLandingPage.jsx` didn't send `wallet_address`, unlike the employer/worker onboarding flow); fixed and backfilled existing test recruiters
- [x] Recruiter wallet exposure — decided recruiters get a visible wallet (address + USDC balance, via the existing `SmartWalletInfo` component in the recruiter nav), same treatment as employers. Reasoning: recruiters are businesses that can self-manage their own off-ramp, unlike workers, who are shielded from crypto entirely because they typically can't clear KYC for a licensed exchange. See `lucid-verify.md` for the full writeup.
- [ ] Build candidate pipeline (applied → screened → selected → contracted) — currently just a flat "assigned jobs" list
- [ ] Build three-party contract generation (employer + recruiter + worker; states recruiter fee is employer-paid, worker owes zero fees)
- [ ] Build worker-facing contract view/sign flow (timestamped, ESIGN-style — no blockchain needed for this)
- [x] Build recruiter fee payment recording UI — **done and tested end-to-end**: employer-side "Pay Fee" button sends a direct sponsored USDC transfer (no new escrow contract needed — this is a one-time, undisputed payment) straight to the recruiter's wallet, then records the `RecruiterFeePayment` with the tx hash. Both employer and recruiter dashboards show live paid/pending status with a Basescan link. Confirmed with a real balance change (149 → 148 USDC) and a verified on-chain tx hash.
- [ ] Commit the recruiter role work to Lucid Ledger main (currently all uncommitted)

## Track B: Fork to Lucid Verify

Only start once Track A is committed and tested.

- [ ] Copy `lucidledger/` to `../lucidverify/` off a clean git ref (not the raw working tree — avoid dragging in unrelated in-flight Lucid Ledger changes)
- [ ] Strip blockchain/oracle/kiosk code: `client/src/contracts/`, `DeployedContract`, `OracleVerification`, `PaymentTransaction`, `KioskDevice`, `NfcBadge`, `PresenceEvent`, `QrToken`, `Mediator`, `DisputeHistory`, and their controllers/routes/pages
- [ ] Remove `ethers`/`viem`/`permissionless` from `package.json`; trim unused Privy smart-wallet usage
- [ ] Set up new `.env`, new DB (`lucidverify_dev`), fresh git history
- [ ] Carry over only Verify-relevant notes (`lucid-verify.md`, `verite-shawn-macdonald-june-2026.md`)
- [ ] Prove the stripped scaffold still runs (login, job posting, application) before adding anything new
- [ ] Build `MockWiseService` — simulated payment initiation returning a fake transaction ID/confirmation
- [ ] Wire employer-facing "Pay recruiter fee" action to the mock service, updating `RecruiterFeePayment` status/`payment_reference_id` (renamed from `wise_transaction_id` in the Lucid Ledger base schema, since Wise isn't part of that repo — reserve the Wise-specific name for the Verify fork's copy)
- [ ] Build mocked CUMULUS submission action + a verified-record view (contract + transaction confirmation)
- [ ] Demo polish: Lucid Verify branding/copy, seed data, demo script

## Track C: Verité / Shawn MacDonald — parallel, doesn't block A or B

- [ ] Send short email to Shawn: confirm the third document required in CUMULUS Employer Pays Verification; ask his deployment preference (native CUMULUS integration vs. standalone tool)
- [ ] Once Track B has a working demo, schedule the full follow-up meeting with Shawn (target: show a working prototype, not just a concept)
- [ ] Ask Shawn for a Skoll Foundation introduction (Skoll funds CUMULUS)

## Track D: Business / legal — parallel, no urgency until real integrations needed

- [ ] Apply to Wise Platform partnership program (wise.com/platform) — only needed once moving past the mocked prototype
- [ ] Draft dual-license terms for Lucid Verify (commercial license under Lucid Strategies PBC, distinct from Lucid Ledger's AGPL) — consult an IP lawyer
- [ ] File trademark for "Lucid Verify" before any public announcement
- [ ] Budget for a payments regulatory lawyer to review Wise partnership structure and FinCEN/MSB exposure — only needed before real-money flows

---

*Update this file as steps complete or the plan changes. Full context and rationale: `notes/lucid-verify.md`.*
