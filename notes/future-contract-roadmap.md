# Future Contract & Factory Roadmap

This note captures deferred contract-level features and architectural decisions that aren't oracle-specific. For oracle evolution (quantitative oracles, per-unit payment, oracle logic modes), see `quantitative-oracles-per-unit-payment.md`.

---

## Oracle Trust Model

Work verification follows a trust spectrum. The platform starts at the simple end and can move toward more trust-minimized models as needed — the `IWorkOracle` interface supports all of these without contract changes.

### Level 1: User-operated (v0.2)
- **ManualOracle**: Employer calls `verify()` directly from their wallet to confirm work completion.
- Trust assumption: employer honestly confirms work was done.
- Worker's protection: dispute mechanism + mediator arbitration.

### Level 2: Platform-operated (v0.2 QR, future NFC/GPS)
- Worker performs an action (scans QR, taps NFC, GPS check-in) → frontend/app captures data → backend validates → **backend server wallet** calls `Oracle.verify(contractAddress)`.
- Trust assumption: LucidLedger platform honestly relays verification data.
- Key detail: the server wallet is a regular EOA, not a smart wallet. It needs a small ETH balance on Base for gas (~$0.001/tx). Not covered by the Coinbase paymaster (which is tied to user smart wallets).
- Oracles create an **on-chain audit trail** — every `verify()` call is a transaction anyone can inspect, providing transparency even with centralized operation.
- The employer still approves payment (`approveAndPay()`), but oracle data strengthens the worker's position in disputes by providing immutable evidence.

### Level 3: Multi-party (future)
- Multiple parties must agree (e.g., worker submits + employer confirms, or 2-of-3 signers).
- More trust-minimized but adds UX friction. Consider only if dispute rates indicate trust issues.

### Level 4: Decentralized oracle network (not planned)
- Chainlink, UMA, etc. Designed for objective data (price feeds), not subjective work verification.
- Not appropriate for this use case at any foreseeable scale.

---

## Factory Deployment Roadmap

The factory must be redeployed whenever the WorkContract constructor or bytecode changes. Each redeploy bundles related changes to minimize churn.

### v0.2 — Factory v2 (current plan, Issue #38)
- Oracle plumbing (IWorkOracle interface, registry, ManualOracle)
- Full state machine (Funded, Active, Completed, Disputed, Refunded, Cancelled)
- Extension points (acceptContract, cancelContract, resolveDispute with %, topUp)
- Adding new boolean oracles (QR, NFC) does NOT require redeploy — just `registerOracle()`

### v0.3 — Factory v3
- **Quantitative oracles**: `unitsCompleted()` interface extension (see quantitative-oracles note)
- **PER_UNIT payment mode**: new constructor param for per-unit rate
- **Dispute timeout on-chain** (#48 item 1): configurable deadline as an on-chain backstop. Deferred from v0.2 to let real dispute patterns inform the right default rather than hardcoding prematurely. Backend cron (#48 item 2) provides equivalent worker protection with more flexibility in the meantime.
- **Admin transfer**: two-step propose/accept pattern (#45) for factory admin rotation
- Any other contract-level changes from v0.3 scope

### v0.4 — Factory v4 (if needed)
- **Multi-token support** (#45): token allowlist, employer selects payment token at deploy time
- Further factory enhancements

### Items that NEVER require factory redeployment
- New boolean oracle types (QR, NFC, GPS) — `registerOracle()` only
- Dispute workflow improvements (#48 items 2-7) — backend/DB work
- Contract crafting UI (#45) — frontend/admin only
- Mediator performance tracking (#48 item 5) — backend/DB only
- Notification system (#48 item 3) — backend integration

---

## Backend Server Wallet (Platform-Operated Oracles)

For QR/NFC/GPS oracles where the backend validates worker actions and writes to the oracle contract:

- The server needs an EOA (externally owned account) funded with a small amount of ETH on Base.
- This wallet calls `QRCodeOracle.verify()`, `NFCOracle.verify()`, etc. after validating worker-submitted data.
- Pennies of ETH covers thousands of L2 transactions.
- Alternative: route server calls through a smart wallet for paymaster sponsorship. More complex, probably not worth it unless transaction volume is very high.
- **Security**: server wallet private key must be stored securely (env var, secrets manager). It has no special on-chain privileges beyond calling oracle `verify()` functions — compromise would allow fake verifications but not fund theft (only the contract's `approveAndPay()` releases escrow, and that requires the employer's wallet).

---

## Dispute Resolution Evolution

### v0.2 (current plan)
- Percentage-based resolution: `resolveDispute(uint8 workerPercentage)` splits funds 0-100%
- Mediator assigned by admin with conflict-of-interest check
- Dispute history recorded in `dispute_history` table

### v0.3 (#48 improvements)
- **On-chain dispute timeout**: if mediator doesn't resolve within X days, contract auto-resolves in worker's favor (or splits 50/50). Exact default TBD based on real dispute patterns from v0.2.
- **Backend cron for stale disputes**: notify mediator/admin of aging disputes before timeout triggers.
- **Escalation path**: if mediator is unresponsive, admin can reassign.
- **Mediator performance tracking**: resolution time, outcome fairness metrics.

### v0.4+
- Multi-round disputes (appeal mechanism)
- Reputation-weighted mediator selection
- Evidence submission on-chain (document hashes)
