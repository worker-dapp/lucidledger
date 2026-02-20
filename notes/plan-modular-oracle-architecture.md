# Plan: Modular Oracle Architecture & Contract Redesign (Issue #38)

## Context

The current smart contract system has a fundamental gap: oracle types are selected in the UI (Oracles.jsx, 6 types), stored in the database (`selected_oracles` TEXT column), but **never passed to smart contracts on-chain**. Every deployed contract is a `ManualWorkContract` regardless of what the employer selects. The factory hardcodes `new ManualWorkContract(...)`, making it impossible to deploy oracle-aware contracts without redeploying the factory.

This plan designs a modular oracle architecture that:
- Bridges the UI/DB oracle selection to on-chain enforcement
- Creates a pluggable `IWorkOracle` interface for adding new verification methods
- Builds all v0.2 and v0.3 extension points into the contract from day one (#42 worker signature, #27 cancellation, #32 percentage disputes, #43 top-ups) so the factory only needs to be deployed once
- Maintains backward compatibility with existing deployed v1 contracts

## The Oracle Selection Gap (current flow)

```
Oracles.jsx (UI) → formData.selectedOracles (array)
    → job_postings.selected_oracles (comma-separated TEXT in DB)
        → AwaitingDeploymentTab saves to deployed_contracts.selected_oracles (DB only)
            → deployViaFactory.js passes [worker, mediator, amount, jobId] (NO oracle types)
                → WorkContractFactory deploys ManualWorkContract (hardcoded)
```

Oracle selection is purely cosmetic metadata today. This plan makes it functional.

## Key Design Decisions

1. **Oracle auth keyed by contract address, not (jobId, worker).** Verification is bound to a specific deployed contract to prevent replay/collision across contracts sharing the same job and worker. `ManualOracle.verify(address workContract)` looks up the employer from the contract itself for authorization.

2. **Keep `uint256 jobId` on-chain.** The current system uses numeric IDs end-to-end (DB → API → frontend → contract). Switching to `bytes32` would add frontend hashing logic and canonicalization risk with no concrete benefit. We keep `uint256`.

3. **No oracle key normalization layer.** The UI write path (`Oracles.jsx` → `JobCreationWizard`) already stores canonical lowercase keys (`manual`, `gps`, `time-clock`, etc.). Legacy formats like `GPS` and `Time Clock` only exist in migration SQL comments and old test fixtures — not in actual data. The factory reverts on unknown keys, which is sufficient protection. A normalization layer can be added later if external API consumers or data imports introduce mixed formats.

4. **Deploy once, activate incrementally.** The Solidity contract includes the full state machine and all extension point functions from day one (oracle plumbing, worker acceptance, cancellation, percentage disputes, top-ups). The factory deploys once. Frontend PRs activate features incrementally — PR 3 wires up oracle verification, PR 4 wires up the new states and actions. This avoids a second factory redeployment and aligns with #38's guidance to build extension points into the contract from the start.

5. **Separate Solidity completeness from frontend activation.** The contract is feature-complete in PR 1, but the frontend exposes features progressively across PRs 3 and 4. This keeps each frontend PR focused and testable while the on-chain foundation is stable.

## PR Sequence

### PR 1: Solidity — Full WorkContract, ManualOracle, Updated Factory

All smart contract work in one PR. The WorkContract includes oracle plumbing AND the expanded state machine with all extension points. Deploy the factory once.

#### New Files
- **`contracts/src/interfaces/IWorkOracle.sol`** — Oracle interface:
  ```solidity
  interface IWorkOracle {
      function isWorkVerified(address workContract) external view returns (bool);
      function oracleType() external pure returns (string memory);
  }
  ```
  - `isWorkVerified(address workContract)`: Called by WorkContract to check if oracle considers work complete. Oracle reads jobId/worker from the contract itself — no (jobId, worker) tuple needed.
  - `oracleType()`: Returns identifier string (e.g. `"manual"`) for registry lookup.
  - Oracles are **singleton contracts** — one ManualOracle serves all contracts, not one per contract.

- **`contracts/src/oracles/ManualOracle.sol`** — First oracle implementation:
  - Implements `IWorkOracle`, `oracleType()` returns `"manual"`.
  - Stores `mapping(address => bool)` keyed by contract address for verifications.
  - `verify(address workContract)` — called by employer. Reads `WorkContract(workContract).employer()` to authorize the caller, then marks that contract as verified.
  - `isWorkVerified(address workContract)` — returns the stored verification status.

- **`contracts/src/WorkContract.sol`** — Unified contract with full state machine and oracle support:

  **State machine:**
  ```
  Funded(0) → Active(1)       worker calls acceptContract()
  Funded(0) → Cancelled(5)    employer calls cancelContract(), auto-refund

  Active(1) → Completed(2)    employer calls approveAndPay(), oracles must pass
  Active(1) → Disputed(3)     either party calls raiseDispute()

  Disputed(3) → Completed(2)  mediator calls resolveDispute(workerPct), split payment
  Disputed(3) → Refunded(4)   mediator calls resolveDispute(0), full refund
  ```

  **Constructor:**
  ```solidity
  constructor(
      address _employer,
      address _worker,
      address _mediator,
      address _paymentToken,
      uint256 _paymentAmount,
      uint256 _jobId,
      address _admin,
      IWorkOracle[] memory _oracles
  )
  ```

  **Oracle functions:**
  - `getOracleCount()` — public view, returns oracle array length. Used by frontend for version detection.
  - `getOracle(uint256 index)` — returns oracle address at index.
  - `checkOracles()` — public view, loops `IWorkOracle[].isWorkVerified(address(this))`, returns true if all pass.
  - `approveAndPay()` — employer entrypoint, internally calls `_checkOracles()`. If any oracle returns false, reverts. If no oracles configured, proceeds freely (pure manual mode, backward compatible with v1 UX).

  **Extension point functions (on-chain from day one, frontend wired in PR 4):**
  - `acceptContract()` — worker only, Funded → Active (#42).
  - `cancelContract()` — employer only while in Funded state, auto-refunds USDC (#27).
  - `resolveDispute(uint8 workerPercentage)` — mediator only, splits funds 0-100% (#32). `resolveDispute(100)` = full pay to worker, `resolveDispute(0)` = full refund to employer.
  - `topUp(uint256 amount)` — employer can add funds to escrow (#43). Accepts USDC transfer, increases contract balance. Extension point for v0.3 streaming/per-unit economics.

  **Other:**
  - `jobId` remains `uint256`.
  - `getDetails()` returns expanded tuple including oracle count and state.
  - Events: `ContractAccepted(worker)`, `ContractCancelled(employer, refundAmount)`, `DisputeResolved(mediator, workerAmount, employerAmount)`, `EscrowTopUp(sender, amount, newBalance)`.

- **`client/src/contracts/WorkContract.json`** — v2 ABI (generated from compilation).

#### Modified Files
- **`contracts/src/WorkContractFactory.sol`** — Oracle registry + updated deploy:
  ```solidity
  // Oracle registry
  mapping(string => address) public oracleRegistry;

  function registerOracle(address oracle) external onlyAdmin;
  function removeOracle(string calldata oracleType) external onlyAdmin;

  // Updated deploy — resolves oracle type strings to addresses
  function deployContract(
      address worker, address mediator, uint256 amount,
      uint256 jobId, string[] calldata oracleTypes
  ) external returns (address);

  function deployBatch(
      address[] workers, address[] mediators, uint256[] amounts,
      uint256[] jobIds, string[][] oracleTypesPerContract
  ) external returns (address[]);
  ```
  - Factory resolves each oracle type string to an address via registry.
  - Reverts if any oracle type is not registered.
  - Passes resolved `IWorkOracle[]` to `new WorkContract(...)`.
  - Updated `ContractDeployed` event includes `string[] oracleTypes`.

- **`client/src/contracts/WorkContractFactory.json`** — Regenerated ABI.

#### Acceptance Criteria
- Deploying with `["manual"]` creates a v2 contract with the ManualOracle address stored on-chain.
- `approveAndPay()` reverts if the ManualOracle has not verified that contract.
- `approveAndPay()` succeeds after `ManualOracle.verify(contractAddress)` is called by the employer.
- Deploying with `[]` (no oracles) creates a contract that behaves identically to v1.
- Factory reverts on unregistered oracle type strings.
- v1 contracts remain fully operable and unaffected.
- `acceptContract()` transitions Funded → Active.
- `cancelContract()` transitions Funded → Cancelled and refunds USDC.
- `resolveDispute(60)` sends 60% to worker, 40% to employer.
- `topUp()` increases contract USDC balance.

#### Tests (Foundry)
- Oracle registry: add, remove, unknown type reverts.
- Deploy with `["manual"]`: oracle stored on-chain, `getOracleCount()` returns 1.
- Payment blocked without verification, succeeds after `ManualOracle.verify()`.
- Deploy with no oracles: `approveAndPay()` works without any oracle calls.
- Batch deploy with per-contract oracle arrays.
- Full state machine: Funded → Active → Completed, Funded → Cancelled + refund, Active → Disputed → resolved with percentage split.
- Top-up: employer adds funds, balance increases.
- Dispute + resolution: 0% (full refund), 50% (split), 100% (full pay to worker).
- Access control: only worker can accept, only employer can cancel (while Funded), only mediator can resolve.

---

### PR 2: DB + API Versioning

Database migration and API support for tracking contract versions.

#### New Files
- **`server/migrations/015-contract-version-and-oracle-addresses.sql`**:
  ```sql
  ALTER TABLE deployed_contracts
    ADD COLUMN IF NOT EXISTS contract_version SMALLINT DEFAULT 1,
    ADD COLUMN IF NOT EXISTS oracle_addresses TEXT;
  ```

#### Modified Files
- **`server/models/DeployedContract.js`** — Add `contract_version` (SMALLINT) and `oracle_addresses` (TEXT) fields.
- **`server/controllers/deployedContractController.js`** — Include new fields in create allowlist.
- **`client/src/EmployerPages/ContractFactory/AwaitingDeploymentTab.jsx`** — Send `contract_version: 2` and `oracle_addresses` when creating DB record after v2 deployment. Parse `deployment.job.selected_oracles` string into array and pass to `deployBatchViaFactory()`.

#### Acceptance Criteria
- Existing rows default to `contract_version = 1`.
- New v2 deployments persist `contract_version = 2` and `oracle_addresses`.
- Migration is additive only — no destructive schema changes.

---

### PR 3: Frontend — Oracle Verification Flow

Wire up oracle verification and deployment with oracle types. Does NOT activate new states (Active, Cancelled) — contracts still use the Funded → Completed/Disputed path from the frontend's perspective.

#### Modified Files
- **`client/src/contracts/deployViaFactory.js`** — Pass oracle types:
  - `deploySingleViaFactory()` accepts new `oracleTypes` param (string array).
  - Args become `[worker, mediator, amount, BigInt(jobId), oracleTypes]`.
  - `deployBatchViaFactory()` accepts `oracleTypesPerContract` (array of string arrays).
  - `extractDeployedAddress()` updated for new event signature.

- **`client/src/contracts/workContractInteractions.js`** — Version-aware reads/writes:
  - ABI detection: primary = `contract_version` from DB; fallback = try `getOracleCount()` call (exists only in v2, reverts on v1).
  - v1 contracts continue using `ManualWorkContractABI` with states `{Funded:0, Completed:1, Disputed:2, Refunded:3}`.
  - v2 contracts use `WorkContractABI`. For this PR, frontend maps states to v1-equivalent display names (Active shows as "Funded" until PR 4 activates it).
  - New helper: `verifyWorkViaOracle({ smartWalletClient, contractAddress, oracleAddress })` — calls `ManualOracle.verify(contractAddress)`.

- **`client/src/Form/Oracles.jsx`** — Grey out unimplemented oracles:
  - Maintain an `availableOracles` list (initially `["manual"]` only).
  - Unregistered oracle cards render as disabled with a "Coming Soon" label.
  - Disabled cards cannot be toggled/selected.
  - Expand the list as new oracles are registered on-chain (e.g., add `"qr-code"` after QRCodeOracle is deployed).

- **`client/src/EmployerPages/WorkforceDashboard.jsx`** — Use version-aware interaction functions.
- **`server/scripts/syncContractState.js`** — Handle both v1 and v2 ABI when syncing on-chain state to DB.

#### Acceptance Criteria
- v1 contract: approve/dispute flows work unchanged.
- v2 contract: employer can verify via ManualOracle then approve, full flow works.
- Unimplemented oracle types show as "Coming Soon" in job creation wizard.
- No regression in dashboard status rendering for either version.
- `cd client && npm run build` passes.

---

### PR 4: Frontend — New States & Actions

Wire up the remaining contract features: worker acceptance, cancellation, percentage disputes, top-ups. The contract already supports all of this on-chain since PR 1 — this PR just exposes it in the UI.

#### Modified Files
- **`client/src/contracts/workContractInteractions.js`** — New interaction functions:
  - `acceptContract({ smartWalletClient, contractAddress })` — worker accepts, Funded → Active.
  - `cancelContract({ smartWalletClient, contractAddress })` — employer cancels, Funded → Cancelled + refund.
  - `resolveDispute({ smartWalletClient, contractAddress, workerPercentage })` — percentage-based resolution.
  - `topUpEscrow({ smartWalletClient, contractAddress, amount })` — add funds.
  - Updated `ContractState` enum:
    ```javascript
    export const ContractState = {
      Funded: 0,
      Active: 1,
      Completed: 2,
      Disputed: 3,
      Refunded: 4,
      Cancelled: 5,
    };
    ```

- **`client/src/EmployerPages/WorkforceDashboard.jsx`** — UI for new states and actions:
  - Show "Active" status for accepted contracts.
  - Show "Cancelled" status with refund info.
  - Cancel button for Funded contracts.
  - Top-up button for active contracts.

- **`client/src/EmployerPages/ContractFactory/AwaitingDeploymentTab.jsx`** — Update status handling for new states.

- **`client/src/EmployeePages/JobTracker.jsx`** — Worker acceptance flow:
  - "Accept Contract" button for Funded contracts assigned to the worker.
  - Updated status display for Active, Cancelled states.

- **`client/src/pages/MediatorResolution.jsx`** — Percentage-based dispute resolution:
  - Slider or input for `workerPercentage` (0-100) instead of binary pay/refund toggle.
  - Preview showing split amounts before confirmation.

- **`server/scripts/syncContractState.js`** — Handle expanded state enum for v2 contracts.

#### Acceptance Criteria
- Worker can accept a Funded contract → status becomes Active.
- Employer can cancel a Funded contract → USDC refunded, status becomes Cancelled.
- Mediator can resolve with percentage → funds split correctly.
- Employer can top up an active contract → escrow balance increases.
- All new states render correctly in dashboard, job tracker, and mediator views.
- v1 contracts remain unaffected — no new states shown for old contracts.

---

## Factory Deployment (one-time, after PR 1)

The factory has `new ManualWorkContract(...)` hardcoded in Solidity bytecode. Changing to `new WorkContract(...)` **requires deploying a new factory**. This is the only factory deployment needed for the entire v0.2 milestone.

**Deployment steps:**
1. Deploy `ManualOracle` singleton.
2. Deploy new `WorkContractFactory` with updated bytecode.
3. Call `factory.registerOracle(manualOracleAddress)` to register the manual oracle.
4. Update `VITE_FACTORY_ADDRESS` env var to new factory address.
5. Update GitHub Actions variables for production.
6. Smoke test: single deploy and batch deploy via UI.
7. Confirm v1 contract reads still work in dashboard.

Old factory remains on-chain — existing v1 contracts finish their lifecycle naturally. Adding new oracle types (QR, NFC, etc.) requires only `registerOracle()` — no factory redeployment.

## Rollback Plan

- If v2 deploys fail: revert `VITE_FACTORY_ADDRESS` to old factory address. New deployments use v1 again.
- Existing v1 contracts are never affected by any of these changes.
- DB migration is additive only (new columns with defaults) — no destructive schema changes.

## Gas Cost Considerations

Base Sepolia gas costs are minimal (~$0.001-0.01 per tx). The oracle array adds:
- ~5,000 gas per oracle address stored (SSTORE).
- ~2,100 gas per `isWorkVerified()` external call during completion.
- For 1-2 oracles this is negligible on L2.

## Issue #38 Compliance Check

| # | Feature | Status | Location |
|---|---------|--------|----------|
| #54 | QR code oracle | Future — plugs into IWorkOracle after registration | Future Work |
| #46 | NFC oracle | Future — same pattern as QR | Future Work |
| #42 | Worker signature / proof of acceptance | `acceptContract()` in PR 1 contract, wired in PR 4 | WorkContract.sol, PR 4 |
| #27 | Contract cancellation | `cancelContract()` in PR 1 contract, wired in PR 4 | WorkContract.sol, PR 4 |
| #32 | Percentage-based disputes | `resolveDispute(uint8)` in PR 1 contract, wired in PR 4 | WorkContract.sol, PR 4 |
| #43 | Escrow top-ups | `topUp()` in PR 1 contract, wired in PR 4 | WorkContract.sol, PR 4 |
| #44 | Streaming wages | Extension point via `topUp()` + future `PER_UNIT` payment mode | Future Work (v0.3) |
| #48 | Dispute resolution improvements | Percentage splits address the core ask; further improvements in v0.4 | Future Work |
| #45 | Factory enhancements (templates, multi-token, admin rotation) | Out of scope for v0.2 | Future Work (v0.4) |

## Future: Quantitative Oracles & Per-Unit Payment (v0.3)

The current `IWorkOracle` interface returns a boolean (`isWorkVerified`), which is correct for binary verification (manual approval, QR clock-in/out, NFC tap, GPS presence). But quantity-based work — agricultural piece-rate ($/kg), manufacturing ($/unit), volume-based ($/bushel) — requires a different model where the oracle reports *how much* work was done, not just whether it happened.

**Planned interface extension:**
```solidity
interface IWorkOracle {
    function isWorkVerified(address workContract) external view returns (bool);
    function unitsCompleted(address workContract) external view returns (uint256);  // NEW
    function oracleType() external pure returns (string memory);
}
```

- Binary oracles (manual, QR, NFC, GPS): implement `isWorkVerified`, return `0` from `unitsCompleted`.
- Quantitative oracles (weight, image-count): implement `unitsCompleted`, derive `isWorkVerified` as `unitsCompleted > 0`.

**Payment modes (configured at deployment):**
- `PaymentMode.FIXED` — current model. Full escrow released on binary completion. Used for attendance, shift work, milestone contracts.
- `PaymentMode.PER_UNIT` — escrow released incrementally as units are verified. Contract stores a per-unit rate (e.g., $0.50/kg). Each oracle update triggers proportional payment from escrow. Employer tops up escrow as needed (#43).

**Example: tea leaf picking**
1. Employer creates job: "$0.50/kg, escrow $500 (covers 1,000 kg)."
2. Contract deploys with `PER_UNIT` mode, WeightOracle attached.
3. Worker picks tea, brings to weigh station → WeightOracle records "45 kg verified."
4. Contract releases 45 x $0.50 = $22.50 USDC to worker.
5. Repeat until escrow depletes or job ends; employer tops up as needed.

**Architecture impact:** The factory does not change — it passes a `paymentMode` config parameter to WorkContract alongside the oracle array. Binary oracles can coexist with quantitative oracles on the same contract (binary oracles act as gates, quantitative oracles drive payment). No separate factory or contract type needed. This will require a factory redeployment (v0.2 → v0.3) since the WorkContract constructor changes.

See `notes/quantitative-oracles-per-unit-payment.md` for full details including IoT hardware strategy, cost analysis, and NFC card vs. phone-based verification decision guide.

## Factory Deployment Roadmap

The factory must be redeployed whenever the WorkContract constructor or bytecode changes. Each redeploy bundles related changes to avoid unnecessary churn.

```
v0.2  Factory v2 (PR 1 of this plan)
      - Oracle plumbing (IWorkOracle, registry, ManualOracle)
      - Full state machine (Active, Cancelled, percentage disputes)
      - Extension points (topUp, acceptContract, cancelContract)
      - Adding new boolean oracles (QR, NFC) does NOT require redeploy
        — just registerOracle()

v0.3  Factory v3
      - Quantitative oracles (unitsCompleted interface extension)
      - PER_UNIT payment mode (new constructor param)
      - Dispute timeout (#48 item 1) — on-chain backstop with
        configurable deadline, added here once real dispute patterns
        inform the right default (not hardcoded prematurely)
      - Admin transfer with two-step propose/accept (#45)
      - Any other contract-level changes from v0.3 scope

v0.4  Factory v4 (if needed)
      - Multi-token support (#45) — token allowlist, employer selects
        payment token at deploy time
      - Further factory enhancements
```

Items that do NOT require factory redeployment at any stage:
- New boolean oracle types (QR, NFC, GPS) — `registerOracle()` only
- Dispute workflow improvements (#48 items 2-7) — backend/DB work
- Contract crafting UI (#45) — frontend/admin only
- Mediator performance tracking (#48 item 5) — backend/DB only
- Notification system (#48 item 3) — backend integration

## Other Future Work (out of scope)

- QR-code oracle implementation (#54) — plugs into the IWorkOracle interface with `registerOracle()`. No factory redeploy.
- NFC oracle (#46) — binary verification, same pattern as QR. No factory redeploy.
- GPS/image/weight oracles — v0.3. GPS and image are binary; weight is quantitative (see above). Weight requires factory v3.
- Streaming wages (#44) — v0.3, pairs naturally with `PER_UNIT` payment mode. Requires factory v3.
- Full top-up economics (#43) — v0.3, essential for `PER_UNIT` contracts where escrow depletes over time.
- Oracle logic modes (AND/OR/threshold) — v0.3+, currently all oracles must pass (AND). Future: support "any 2 of 3" or "GPS or NFC" redundancy.
- Dispute timeout on-chain (#48 item 1) — deferred to factory v3. Backend cron (#48 item 2) provides equivalent worker protection with more flexibility in the meantime.
- Dispute workflow improvements (#48 items 2-7) — backend/DB work, no contract changes.
- Factory enhancements (#45) — admin transfer in v0.3, multi-token in v0.4.
- Cross-chain support.
