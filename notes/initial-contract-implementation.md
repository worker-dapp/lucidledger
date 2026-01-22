# First Contract Implementation Plan: Manual Verification on Base Sepolia

## Goal
Replace the mock deployment in `AwaitingDeploymentTab.jsx` with real smart contract deployment to Base Sepolia testnet, implementing the core escrow-based wage protection system described in the Lucid Ledger whitepaper.

---

## Whitepaper Alignment Tracker

### ✅ Aligned with Whitepaper
| Feature | Whitepaper Reference | Implementation |
|---------|---------------------|----------------|
| Escrow-based wage protection | Section 3.2: "secures payment funds at the outset" | Contract holds USDC until verification |
| Manual verification oracle | Section 3.3: oracles "trigger payments" | Employer approval releases funds |
| Neutral dispute resolution | Section 3.4: "structured arbitration" | Mediator address resolves disputes |
| Stablecoin payments | Section 4.2: "stable coins pegged to major currencies" | Testnet USDC via Circle faucet |
| Contract Factory flow | Section 3.1: employers "configure specific requirements" | Existing job creation wizard |

### ⚠️ Simplified for MVP (Return to Later)
| Feature | Whitepaper Vision | MVP Simplification | Future Work |
|---------|------------------|-------------------|-------------|
| Multi-sig escrow | "Multiple approvals for fund movement" | Single mediator address | Implement multi-sig with timelock |
| DAO governance | "Worker and Employer DAOs" | Designated mediator wallet | Build WorkerDAO + EmployerDAO contracts |
| Mediator selection | "balanced stakeholder representation" | Hardcoded admin address | DAO-based arbitrator election |
| Reputation system | "portable proof of skills and reliability" | Database records only | On-chain reputation tokens |
| Compliance monitoring | "monitors adherence to labor standards" | Not implemented | Add compliance oracle |
| Survey system | "anonymous feedback about working conditions" | Not implemented | Add worker feedback UI |

---

## Key Decisions
- **Chain**: Base Sepolia testnet (Coinbase L2) - low fees, industry backing
- **Currency**: Testnet USDC via [Circle Faucet](https://faucet.circle.com/)
- **Verification**: Manual employer approval (simplest oracle - aligns with whitepaper)
- **Disputes**: Neutral mediator resolves (NOT employer) - core to whitepaper vision
- **Authentication**: Dynamic Labs (email/phone login creates wallet automatically)

---

## Smart Contract Design

### `contracts/ManualWorkContract.sol`

**Key difference from earlier draft**: Mediator address for dispute resolution (not employer).

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract ManualWorkContract {
    address public employer;
    address public worker;
    address public mediator;  // Neutral third party
    IERC20 public paymentToken;  // USDC
    uint256 public paymentAmount;
    uint256 public jobId;
    string public disputeReason;

    enum State { Funded, Completed, Disputed, Refunded }
    State public state;

    event ContractFunded(address indexed employer, address indexed worker, uint256 amount, uint256 jobId);
    event WorkApproved(address indexed worker, uint256 amount);
    event DisputeRaised(address indexed raisedBy, string reason);
    event DisputeResolved(address indexed recipient, uint256 amount, bool paidWorker);

    constructor(
        address _worker,
        address _mediator,
        address _paymentToken,
        uint256 _paymentAmount,
        uint256 _jobId
    ) {
        require(_worker != address(0), "Invalid worker");
        require(_mediator != address(0), "Invalid mediator");
        require(_paymentAmount > 0, "Invalid amount");

        employer = msg.sender;
        worker = _worker;
        mediator = _mediator;
        paymentToken = IERC20(_paymentToken);
        paymentAmount = _paymentAmount;
        jobId = _jobId;
        state = State.Funded;

        // Transfer USDC from employer to contract (requires prior approval)
        require(paymentToken.transferFrom(msg.sender, address(this), _paymentAmount), "Funding failed");

        emit ContractFunded(employer, worker, _paymentAmount, _jobId);
    }

    // Employer approves work completion - releases payment to worker
    function approveAndPay() external {
        require(msg.sender == employer, "Only employer");
        require(state == State.Funded, "Invalid state");

        state = State.Completed;
        require(paymentToken.transfer(worker, paymentAmount), "Payment failed");

        emit WorkApproved(worker, paymentAmount);
    }

    // Either party can raise a dispute - freezes funds
    function raiseDispute(string calldata reason) external {
        require(msg.sender == employer || msg.sender == worker, "Not a party");
        require(state == State.Funded, "Invalid state");

        state = State.Disputed;
        disputeReason = reason;

        emit DisputeRaised(msg.sender, reason);
    }

    // ONLY MEDIATOR can resolve disputes - core to neutral resolution
    function resolveDispute(bool payWorker) external {
        require(msg.sender == mediator, "Only mediator");
        require(state == State.Disputed, "Not disputed");

        address recipient = payWorker ? worker : employer;
        state = payWorker ? State.Completed : State.Refunded;

        require(paymentToken.transfer(recipient, paymentAmount), "Transfer failed");

        emit DisputeResolved(recipient, paymentAmount, payWorker);
    }

    // View functions
    function getDetails() external view returns (
        address, address, address, uint256, uint256, State, string memory
    ) {
        return (employer, worker, mediator, paymentAmount, jobId, state, disputeReason);
    }

    function getBalance() external view returns (uint256) {
        return paymentToken.balanceOf(address(this));
    }
}
```

---

## Files to Create

### 1. Smart Contract
**`contracts/ManualWorkContract.sol`** - As shown above

### 2. Contract Deployment Helper
**`client/src/contracts/deployWorkContract.js`**
- `ensureBaseSepolia()` - switch/add Base Sepolia network
- `approveUSDC(amount)` - approve contract to spend USDC
- `deployWorkContract(workerAddress, mediatorAddress, usdcAddress, amount, jobId)`
- Returns: `{ contractAddress, txHash }`

### 3. Contract Interaction Helper
**`client/src/contracts/workContractInteractions.js`**
- `approveAndPay(contractAddress)` - employer releases payment
- `raiseDispute(contractAddress, reason)` - either party freezes funds
- `resolveDispute(contractAddress, payWorker)` - MEDIATOR ONLY
- `getContractState(contractAddress)` - read on-chain state

### 4. Compiled Contract ABI
**`client/src/contracts/ManualWorkContract.json`** - Generated via Remix/Hardhat

### 5. Mediator Resolution Page (Minimal UI)
**`client/src/pages/MediatorResolution.jsx`**

Simple page that:
- Checks if connected wallet === designated mediator address
- If not authorized: shows "Access denied" message
- If authorized: shows list of disputed contracts with resolution buttons

```
Route: /resolve-disputes (no navbar link - accessed directly)
```

---

## Files to Modify

### 1. `client/src/EmployerPages/ContractFactory/AwaitingDeploymentTab.jsx`
- Replace mock deployment with real USDC contract deployment
- Add USDC approval step before deployment
- Show deployment progress and tx confirmation
- Store real contract address in database

### 2. `client/src/EmployerPages/WorkforceDashboard.jsx`
- Add "Approve Work & Pay" button (calls `approveAndPay()`)
- Add "Raise Dispute" button with reason input
- Show contract state from blockchain
- Add BaseScan links for transparency

### 3. `client/src/App.jsx`
- Add route: `/resolve-disputes` → `MediatorResolution`
- No auth wrapper needed (page self-validates via wallet)

### 4. `client/.env`
```bash
VITE_BASE_SEPOLIA_CHAIN_ID=84532
VITE_BASE_SEPOLIA_RPC=https://sepolia.base.org
VITE_BASESCAN_URL=https://sepolia.basescan.org
VITE_USDC_ADDRESS=<testnet USDC on Base Sepolia>
VITE_MEDIATOR_ADDRESS=<designated mediator wallet>
```

### 5. `server/.env`
```bash
MEDIATOR_WALLET_ADDRESS=<same as client>
```

---

## Implementation Phases

### Phase 1: Smart Contract + USDC Setup
1. Get testnet USDC from [Circle Faucet](https://faucet.circle.com/)
2. Create `ManualWorkContract.sol` with mediator support
3. Compile via Remix, test deployment manually
4. Copy ABI to client

### Phase 2: Deployment Integration
1. Create `deployWorkContract.js` with USDC approval flow
2. Update `AwaitingDeploymentTab.jsx` - replace mock with real
3. Test: job → apply → accept → sign → deploy with USDC

### Phase 3: Payment Approval Flow
1. Create `workContractInteractions.js`
2. Update `WorkforceDashboard.jsx` with approve/dispute buttons
3. Test: employer approves → worker receives USDC

### Phase 4: Mediator Resolution UI
1. Create `MediatorResolution.jsx` page
2. Add route in `App.jsx`
3. Test: raise dispute → switch to mediator wallet → resolve

### Phase 5: Polish
1. Add BaseScan links throughout
2. Better error messages
3. Loading states and confirmations

---

## Demo Flow (Three Wallets)

### Setup
1. **Employer wallet**: Fund with testnet ETH (gas) + USDC (payments)
2. **Worker wallet**: Just needs testnet ETH for gas
3. **Mediator wallet**: Designated address, needs ETH for gas

### Demo Script
1. **Employer** creates job with "Manual Verification" oracle
2. **Worker** (different browser/wallet) applies to job
3. **Employer** accepts application, worker signs offer
4. **Employer** goes to Awaiting Deployment → clicks "Deploy"
   - Approves USDC spend
   - Deploys contract (funds go to escrow)
   - Show BaseScan: USDC now held in contract
5. Contract appears in Workforce Dashboard
6. **[Happy Path]** Employer clicks "Approve Work & Pay"
   - USDC transfers to worker
   - Contract status → completed
7. **[Dispute Path]** Worker raises dispute with reason
   - Funds frozen in contract
   - **Mediator** navigates to `/resolve-disputes`
   - Sees dispute details, clicks "Release to Worker" or "Refund Employer"
   - Funds transferred based on decision

---

## Testing Checklist

### Setup
- [ ] Get Base Sepolia ETH: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
- [ ] Get testnet USDC: https://faucet.circle.com/
- [ ] Configure 3 wallets: employer, worker, mediator

### Deployment Flow
- [ ] Employer creates job with "Manual Verification"
- [ ] Worker applies, employer accepts, offer signed
- [ ] Employer approves USDC spend
- [ ] Contract deploys with USDC in escrow
- [ ] Verify on BaseScan: contract holds USDC

### Happy Path
- [ ] Employer clicks "Approve Work & Pay"
- [ ] USDC transfers to worker wallet
- [ ] Contract status = "completed"
- [ ] Payment recorded in database with txHash

### Dispute Path
- [ ] Worker or employer raises dispute
- [ ] Contract status = "disputed", funds frozen
- [ ] Connect with mediator wallet
- [ ] Navigate to `/resolve-disputes`
- [ ] Mediator sees dispute, resolves it
- [ ] Funds go to correct party
- [ ] Contract status updated

---

## Technical Notes

### USDC on Base Sepolia
- Get from Circle Faucet (1 USDC per 2 hours)
- Contract address: Check Circle docs or deploy mock ERC20

### ethers.js Version
Existing code uses ethers v5 syntax:
```javascript
const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();
```

### Dynamic Labs Integration
Users get wallets automatically via email/phone login. Worker wallet address available via `primaryWallet.address` from `useDynamicContext()`.

### ERC20 Approval Pattern
Before deploying contract, employer must approve USDC spend:
```javascript
const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, signer);
await usdc.approve(contractFactoryAddress, amount);
// Then deploy contract
```

---

## Future Enhancements (Post-MVP)

### From Whitepaper - High Priority
- [ ] Multi-signature escrow (Section 4.3)
- [ ] WorkerDAO + EmployerDAO governance (Section 3.5)
- [ ] Reputation system on-chain (Section 3.6)
- [ ] Compliance monitoring oracle (Section 3.3)
- [ ] Survey system for worker feedback (Section 3.3)

### Technical Improvements
- [ ] Contract factory pattern (cheaper batch deployments)
- [ ] Event indexing for real-time updates
- [ ] Mainnet deployment (Base mainnet)
- [ ] Additional oracle types (GPS, NFC, weight)
