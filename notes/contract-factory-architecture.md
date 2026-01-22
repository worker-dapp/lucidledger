# Contract Factory Architecture: Oracle Modularity

## The Question

The whitepaper describes a "contract factory" where employers can create contracts with different oracle combinations for work verification (GPS, Image, Weight, Time Clock, Manual, etc.). How does this work in production?

**Do we compile a contract for every possible oracle combination?**

No. We use a modular architecture.

---

## Key Insight: Compile Once, Deploy Many

Smart contract bytecode is compiled **once** during development and bundled with the frontend. When an employer clicks "Deploy", the same bytecode is deployed as a new contract instance with different constructor parameters.

```
Same bytecode → Deploy with (worker: Alice, amount: 100, jobId: 1) → Contract at 0xABC...
Same bytecode → Deploy with (worker: Bob, amount: 500, jobId: 2)   → Contract at 0xDEF...
```

Each instance has its own address, state, and escrow balance. No runtime compilation needed.

---

## Modular Oracle Architecture

### The Pattern

One work contract template + pluggable oracle contracts

```
┌─────────────────────────────────────────────────────────┐
│                    WorkContract.sol                      │
│  - Holds escrow (USDC)                                  │
│  - References oracle address(es)                        │
│  - Calls oracle.isWorkVerified(jobId) before payment    │
│  - Handles disputes via mediator                        │
└─────────────────────────────────────────────────────────┘
                          │
                          │ calls
                          ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ GPSOracle   │  │ ImageOracle │  │ TimeOracle  │  ...
│ 0xAAA...    │  │ 0xBBB...    │  │ 0xCCC...    │
└─────────────┘  └─────────────┘  └─────────────┘
      │                │                │
      └────────────────┴────────────────┘
                All implement IWorkOracle
```

### Standard Oracle Interface

Each oracle type implements the same interface:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IWorkOracle {
    function isWorkVerified(uint256 jobId, address worker) external view returns (bool);
}
```

### Unified Work Contract

One contract template that accepts an array of oracle addresses:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IWorkOracle {
    function isWorkVerified(uint256 jobId, address worker) external view returns (bool);
}

contract WorkContract {
    address public employer;
    address public worker;
    address public mediator;
    IERC20 public paymentToken;
    uint256 public paymentAmount;
    uint256 public jobId;
    address[] public oracles;  // Selected oracles for this job
    string public disputeReason;

    enum State { Funded, Completed, Disputed, Refunded }
    State public state;

    constructor(
        address _worker,
        address _mediator,
        address _paymentToken,
        uint256 _amount,
        uint256 _jobId,
        address[] memory _oracles  // GPS, Image, Manual, etc.
    ) {
        require(_worker != address(0) && _worker != msg.sender, "Invalid worker");
        require(_mediator != address(0), "Invalid mediator");
        require(_amount > 0, "Invalid amount");

        employer = msg.sender;
        worker = _worker;
        mediator = _mediator;
        paymentToken = IERC20(_paymentToken);
        paymentAmount = _amount;
        jobId = _jobId;
        oracles = _oracles;
        state = State.Funded;

        // Transfer payment to escrow
        require(paymentToken.transferFrom(msg.sender, address(this), _amount), "Funding failed");
    }

    // Release payment when ALL oracles verify work is complete
    function releasePayment() external {
        require(state == State.Funded, "Invalid state");

        // Check all selected oracles
        for (uint i = 0; i < oracles.length; i++) {
            require(
                IWorkOracle(oracles[i]).isWorkVerified(jobId, worker),
                "Oracle verification failed"
            );
        }

        state = State.Completed;
        require(paymentToken.transfer(worker, paymentAmount), "Payment failed");
    }

    // Manual approval bypass (employer can approve without oracle check)
    function approveAndPay() external {
        require(msg.sender == employer, "Only employer");
        require(state == State.Funded, "Invalid state");

        state = State.Completed;
        require(paymentToken.transfer(worker, paymentAmount), "Payment failed");
    }

    // Dispute handling (same as ManualWorkContract)
    function raiseDispute(string calldata reason) external {
        require(msg.sender == employer || msg.sender == worker, "Not a party");
        require(state == State.Funded, "Invalid state");

        state = State.Disputed;
        disputeReason = reason;
    }

    function resolveDispute(bool payWorker) external {
        require(msg.sender == mediator, "Only mediator");
        require(state == State.Disputed, "Not disputed");

        address recipient = payWorker ? worker : employer;
        state = payWorker ? State.Completed : State.Refunded;

        require(paymentToken.transfer(recipient, paymentAmount), "Transfer failed");
    }
}
```

### Deployment Flow

```
1. Employer creates job, selects: GPS + Image verification
                      ↓
2. Frontend looks up oracle addresses:
   - GPSOracle: 0xAAA...
   - ImageOracle: 0xBBB...
                      ↓
3. Deploy WorkContract with oracles array: [0xAAA..., 0xBBB...]
                      ↓
4. New contract instance at 0xNEW... references both oracles
                      ↓
5. Payment released only when BOTH oracles return true
```

---

## What Gets Compiled Once

| Contract | Deployed | Purpose |
|----------|----------|---------|
| `GPSOracle.sol` | Once globally | Verifies GPS check-ins for any job |
| `ImageOracle.sol` | Once globally | Verifies photo submissions |
| `TimeClockOracle.sol` | Once globally | Verifies time tracking data |
| `WeightOracle.sol` | Once globally | Verifies weight/quantity measurements |
| `ManualOracle.sol` | Once globally | Always returns true (used with manual verification) |
| `WorkContract.sol` | Per job | Holds escrow, checks selected oracles, handles disputes |

The oracle contracts are **singleton deployments** - one instance serves all jobs. The work contract is deployed **per job** with references to whichever oracles the employer selected.

---

## Current State (MVP)

### What Exists

- `ManualWorkContract.sol` - Standalone contract for manual verification only
- `GPSOracle` at `0xB420dDcE21dA14AF756e418984018c5cFAC62Ded`
- `GPSBasedPayment` at `0xE7B08F308BfBF36c752d1376C32914791ecA8514`

### MVP Approach

Keep `ManualWorkContract` as-is for the initial implementation. It works for demonstrating the core escrow + dispute resolution flow.

### Phase 2: Unified Architecture

1. Create `IWorkOracle` interface
2. Update existing `GPSOracle` to implement it
3. Create additional oracle contracts (Image, Time, Weight)
4. Create unified `WorkContract.sol` that accepts oracle array
5. Update frontend to pass selected oracle addresses during deployment

---

## Alternative: Manual Oracle Contract

For the "Manual Verification" option, we can create a simple oracle that always returns true:

```solidity
contract ManualOracle is IWorkOracle {
    // Always returns true - employer verifies off-chain
    function isWorkVerified(uint256, address) external pure returns (bool) {
        return true;
    }
}
```

This way, even manual verification uses the same `WorkContract.sol` template:
- Manual verification: `oracles = [ManualOracle]`
- GPS only: `oracles = [GPSOracle]`
- GPS + Image: `oracles = [GPSOracle, ImageOracle]`

The `releasePayment()` function works identically in all cases.

---

## Questions to Resolve

1. **AND vs OR logic**: Should ALL oracles pass, or ANY oracle? (Current design: ALL must pass)

2. **Oracle data submission**: How do workers submit GPS coordinates, photos, etc. to oracle contracts? (Separate UI flow needed)

3. **Oracle trust model**: Who operates the oracles? Lucid Ledger? Third parties? On-chain vs off-chain verification?

4. **Gas costs**: Checking multiple oracles costs more gas. Acceptable on Base L2?

---

## Summary

- **No per-combination compilation** - one contract template handles all oracle combinations
- **Bytecode bundled in frontend** - no runtime compilation or Hardhat in production
- **Oracles are pluggable** - deployed once, referenced by address
- **MVP uses ManualWorkContract** - simpler, already working
- **Phase 2 unifies architecture** - single WorkContract with oracle array parameter
