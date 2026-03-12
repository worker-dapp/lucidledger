# QR Oracle and Factory Capabilities

Last updated: 2026-03-11

## Purpose

This note clarifies what the current v2 contract factory and oracle architecture can already do onchain, what the current QR flow is doing today, and where the gap is between "QR attendance feature" and "registered onchain QR oracle."

This is intentionally about current capability, not future design.

---

## What the Current Factory Can Do

The current v2 factory is modular onchain.

- `WorkContractFactory` maintains an onchain oracle registry keyed by oracle type string.
- The admin can register a new oracle contract by calling `registerOracle(address oracle)`.
- At deployment time, the factory resolves requested oracle type strings to oracle contract addresses and passes those oracle contracts into the new `WorkContract`.
- Each deployed `WorkContract` stores an array of `IWorkOracle` contracts.
- `approveAndPay()` requires all attached oracles to return `true` before payment is released.

Relevant code:
- [WorkContractFactory.sol](/Users/ejt/Documents/lucidledger/contracts/src/WorkContractFactory.sol)
- [WorkContract.sol](/Users/ejt/Documents/lucidledger/contracts/src/WorkContract.sol)
- [IWorkOracle.sol](/Users/ejt/Documents/lucidledger/contracts/src/interfaces/IWorkOracle.sol)

In other words: the factory is already capable of supporting new oracle types without redeploying the factory itself, as long as there is a real oracle contract implementing `IWorkOracle` and the admin registers it.

---

## What an Oracle Means in the Current Contract Model

In the current onchain model, an oracle is:

- a smart contract that implements `IWorkOracle`
- exposes `oracleType()`
- exposes `isWorkVerified(workContract)`
- can be attached to a `WorkContract` at deployment time through the factory registry

The current `IWorkOracle` interface is boolean. It answers:

- "Has this contract's work been verified yet?"

It does not natively answer:

- "What was the clock-in timestamp?"
- "What was the clock-out timestamp?"
- "How many attendance events happened?"
- "Which kiosk recorded the event?"

So the current oracle architecture is good for gating payment on a yes/no verification condition. It is not, by itself, an attendance-event ledger.

---

## What Is Actually Registered Today

As of now, the app deployment path only treats `manual` as a registered oracle type.

That is visible in the frontend deployment code:

- [AwaitingDeploymentTab.jsx](/Users/ejt/Documents/lucidledger/client/src/EmployerPages/ContractFactory/AwaitingDeploymentTab.jsx)

The deployment UI currently filters selected oracle types down to a hardcoded allowlist:

- `REGISTERED_ORACLE_TYPES = ["manual"]`

That means:

- `manual` is treated as an actual deployable onchain oracle
- `qr` is currently not

So even though the factory architecture supports modular oracle registration, the current app deployment path does not yet attach a QR oracle to new contracts.

---

## What the Current QR Feature Does Today

The current QR work is mostly app/backend functionality:

- worker generates a QR token
- kiosk scans it
- backend validates it
- backend stores presence events and oracle-verification records
- frontend shows QR-specific UI and attendance history

Relevant note:
- [todo-qr-oracle-buildout.md](/Users/ejt/Documents/lucidledger/notes/todo-qr-oracle-buildout.md)

What it does not currently do in a fully onchain sense:

- deploy a `QRCodeOracle` contract
- register `qr` in the factory registry
- attach a QR oracle contract to newly deployed `WorkContract`s
- make `approveAndPay()` depend on QR verification for QR-only contracts

So today QR is best understood as backend-managed attendance evidence, not yet a fully registered onchain oracle.

---

## Practical Consequence for Current Testing

Right now there is an important behavioral difference between selecting `qr` and selecting `qr + manual`.

### If a contract is created with `qr` only

- the UI may still show QR-related controls because it reads `selected_oracles` from the database
- but the deployment path filters `qr` out
- the deployed contract ends up with no attached onchain oracle for QR
- `approveAndPay()` is therefore not blocked by QR verification onchain

### If a contract is created with `qr + manual`

- the QR UI still appears
- the deployment path keeps `manual`
- the deployed contract gets the ManualOracle attached
- payment is oracle-gated onchain, but effectively through `manual`, not through QR

This is why the current QR flow can feel "oracle-like" in the app while not yet being an actual QR oracle from the blockchain's perspective.

---

## What "Registering QR" Actually Means

To make QR a real onchain oracle in the current architecture, the following must happen:

1. Create a `QRCodeOracle.sol` contract that implements `IWorkOracle`
2. Deploy that contract
3. Register it in the factory via `registerOracle(qrOracleAddress)`
4. Update the frontend deployment allowlist so `qr` is no longer filtered out
5. Ensure the backend calls the QR oracle contract after a validated scan

Only after that sequence will new contracts with `qr` selected actually carry a QR oracle in their onchain oracle array.

---

## Important Limitation of the Current Oracle Interface

Even after QR is registered, the current `IWorkOracle` interface only supports boolean verification.

That means the simplest registered QR oracle would be able to answer:

- "Has this contract had a valid QR verification event yet?"

But it would still not by itself record detailed attendance history onchain.

If the goal is only:

- payment gating based on a verified QR event

then the current oracle architecture is sufficient.

If the goal is also:

- onchain clock-in events
- onchain clock-out events
- onchain timestamps
- onchain attendance audit trail

then that is a separate design step beyond simple oracle registration.

The current architecture can support QR as a yes/no oracle. Recording richer attendance data onchain will require either:

- extending the QR oracle contract to emit per-scan events and/or store more state, or
- introducing a more expressive oracle/event model than the current boolean interface alone

---

## Bottom Line

The current factory is already modular enough to support new registered onchain oracles.

The gap is not that the factory lacks modularity. The gap is that QR has not yet been completed as a deployed and registered onchain oracle implementation.

Today:

- `manual` is a real onchain oracle in the deployed-contract path
- `qr` is mostly backend/UI attendance evidence

Next decision:

- decide whether QR only needs to become a boolean onchain verification gate, or whether clock-in/clock-out details themselves need to be recorded onchain

Those are related, but they are not the same task.
