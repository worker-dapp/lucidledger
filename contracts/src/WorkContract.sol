// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IWorkOracle.sol";

/**
 * @title WorkContract
 * @dev Escrow-based work contract with pluggable oracle verification.
 *
 * This is the v2 contract replacing ManualWorkContract for new deployments.
 * It supports an expanded state machine with an Active state (worker acceptance),
 * a Cancelled state (employer refund before work starts), and pluggable oracles
 * for work verification.
 *
 * State machine:
 *   Funded(0) → Completed(2)    employer calls approveAndPay(), oracles must pass
 *   Funded(0) → Cancelled(5)    employer calls cancelContract(), auto-refund
 *   Funded(0) → Disputed(3)     either party calls raiseDispute()
 *   Disputed(3) → Completed(2)  mediator resolveDispute(workerPct > 0), split payment
 *   Disputed(3) → Refunded(4)   mediator resolveDispute(0), full refund
 *
 * Worker consent is captured off-chain via EIP-712 signature before deployment.
 * State.Active (1) is retained in the enum for ABI/storage compatibility but
 * no code path enters it.
 *
 * Note: Deployed via WorkContractFactory, which handles atomic funding.
 */
contract WorkContract {
    address public admin;
    address public employer;
    address public worker;
    address public mediator;
    IERC20 public paymentToken;
    uint256 public paymentAmount;
    uint256 public jobId;
    string public disputeReason;

    IWorkOracle[] private oracles;

    enum State { Funded, Active, Completed, Disputed, Refunded, Cancelled }
    State public state;

    event ContractFunded(address indexed employer, address indexed worker, uint256 amount, uint256 jobId);
    event WorkApproved(address indexed worker, uint256 amount);
    event ContractCancelled(address indexed employer, uint256 refundAmount);
    event DisputeRaised(address indexed raisedBy, string reason);
    event DisputeResolved(address indexed mediator, uint256 workerAmount, uint256 employerAmount);
    event EscrowTopUp(address indexed sender, uint256 amount, uint256 newBalance);
    event MediatorAssigned(address indexed mediator);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    /**
     * @dev Creates a new work contract with optional oracle verification.
     * @param _employer Address of the employer
     * @param _worker Address of the worker
     * @param _mediator Address of the mediator (can be zero for post-dispute assignment)
     * @param _paymentToken Address of the ERC20 token (USDC)
     * @param _paymentAmount Amount to be paid upon work completion
     * @param _jobId Database ID of the associated job posting
     * @param _admin Platform admin address
     * @param _oracles Array of oracle contracts for work verification
     */
    constructor(
        address _employer,
        address _worker,
        address _mediator,
        address _paymentToken,
        uint256 _paymentAmount,
        uint256 _jobId,
        address _admin,
        IWorkOracle[] memory _oracles
    ) {
        require(_employer != address(0), "Invalid employer address");
        require(_worker != address(0), "Invalid worker address");
        require(_paymentToken != address(0), "Invalid token address");
        require(_paymentAmount > 0, "Payment amount must be greater than 0");
        require(_worker != _employer, "Employer cannot be the worker");
        require(_admin != address(0), "Invalid admin address");

        if (_mediator != address(0)) {
            require(_mediator != _employer, "Mediator cannot be employer");
            require(_mediator != _worker, "Mediator cannot be worker");
        }

        admin = _admin;
        employer = _employer;
        worker = _worker;
        mediator = _mediator;
        paymentToken = IERC20(_paymentToken);
        paymentAmount = _paymentAmount;
        jobId = _jobId;
        state = State.Funded;

        for (uint256 i = 0; i < _oracles.length; i++) {
            oracles.push(_oracles[i]);
        }

        emit ContractFunded(_employer, _worker, _paymentAmount, _jobId);
    }

    /**
     * @dev Employer approves work and releases payment to worker.
     *
     * If oracles are configured, all must return true (work verified).
     * Accepts from Funded or Active state.
     */
    function approveAndPay() external {
        require(msg.sender == employer, "Only employer can approve");
        require(
            state == State.Funded || state == State.Active,
            "Contract not in funded or active state"
        );

        if (oracles.length > 0) {
            require(_checkOracles(), "Oracle verification not complete");
        }

        state = State.Completed;
        require(paymentToken.transfer(worker, paymentAmount), "Payment transfer failed");

        emit WorkApproved(worker, paymentAmount);
    }

    /**
     * @dev Employer cancels the contract while still in Funded state, auto-refunding USDC.
     */
    function cancelContract() external {
        require(msg.sender == employer, "Only employer can cancel");
        require(state == State.Funded, "Contract not in funded state");

        uint256 balance = paymentToken.balanceOf(address(this));
        state = State.Cancelled;

        if (balance > 0) {
            require(paymentToken.transfer(employer, balance), "Refund transfer failed");
        }

        emit ContractCancelled(employer, balance);
    }

    /**
     * @dev Either party raises a dispute, freezing funds for mediator resolution.
     * @param reason Description of why the dispute is being raised
     */
    function raiseDispute(string calldata reason) external {
        require(msg.sender == employer || msg.sender == worker, "Only contract parties can dispute");
        require(state == State.Funded || state == State.Active, "Contract not in funded or active state");
        require(bytes(reason).length > 0, "Dispute reason required");

        state = State.Disputed;
        disputeReason = reason;

        emit DisputeRaised(msg.sender, reason);
    }

    /**
     * @dev Mediator resolves a dispute by splitting funds proportionally.
     * @param workerPercentage Percentage (0-100) of funds to send to worker.
     *        0 = full refund to employer (→ Refunded)
     *        1-100 = proportional split (→ Completed)
     */
    function resolveDispute(uint8 workerPercentage) external {
        require(mediator != address(0), "Mediator not assigned");
        require(msg.sender == mediator, "Only mediator can resolve disputes");
        require(state == State.Disputed, "Contract not in disputed state");
        require(workerPercentage <= 100, "Percentage must be 0-100");

        uint256 balance = paymentToken.balanceOf(address(this));
        uint256 workerAmount = (balance * workerPercentage) / 100;
        uint256 employerAmount = balance - workerAmount;

        if (workerPercentage == 0) {
            state = State.Refunded;
        } else {
            state = State.Completed;
        }

        if (workerAmount > 0) {
            require(paymentToken.transfer(worker, workerAmount), "Worker payment failed");
        }
        if (employerAmount > 0) {
            require(paymentToken.transfer(employer, employerAmount), "Employer refund failed");
        }

        emit DisputeResolved(mediator, workerAmount, employerAmount);
    }

    /**
     * @dev Admin assigns a mediator to the contract.
     * @param _mediator Address of the mediator
     */
    function assignMediator(address _mediator) external onlyAdmin {
        require(_mediator != address(0), "Invalid mediator address");
        require(mediator == address(0), "Mediator already assigned");
        require(_mediator != employer, "Mediator cannot be employer");
        require(_mediator != worker, "Mediator cannot be worker");

        mediator = _mediator;

        emit MediatorAssigned(_mediator);
    }

    /**
     * @dev Employer tops up the escrow with additional USDC.
     * @param amount Amount of USDC to add
     */
    function topUp(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(
            state == State.Funded || state == State.Active || state == State.Disputed,
            "Cannot top up in current state"
        );

        require(paymentToken.transferFrom(msg.sender, address(this), amount), "Top up transfer failed");
        paymentAmount += amount;

        emit EscrowTopUp(msg.sender, amount, paymentToken.balanceOf(address(this)));
    }

    /**
     * @dev Returns the number of oracles configured for this contract.
     * Can be used for version detection (0 = v1-compatible, >0 = v2).
     */
    function getOracleCount() external view returns (uint256) {
        return oracles.length;
    }

    /**
     * @dev Returns the oracle address at the given index.
     * @param index Index in the oracles array
     */
    function getOracle(uint256 index) external view returns (address) {
        require(index < oracles.length, "Index out of bounds");
        return address(oracles[index]);
    }

    /**
     * @dev Checks if all configured oracles have verified work.
     * Returns true if no oracles are configured.
     */
    function checkOracles() external view returns (bool) {
        return _checkOracles();
    }

    /**
     * @dev Returns all contract details in a single call.
     */
    function getDetails() external view returns (
        address _employer,
        address _worker,
        address _mediator,
        uint256 _paymentAmount,
        uint256 _jobId,
        State _state,
        string memory _disputeReason,
        uint256 _oracleCount
    ) {
        return (employer, worker, mediator, paymentAmount, jobId, state, disputeReason, oracles.length);
    }

    /**
     * @dev Returns the current token balance held in escrow.
     */
    function getBalance() external view returns (uint256) {
        return paymentToken.balanceOf(address(this));
    }

    /**
     * @dev Internal oracle check — returns true if all oracles pass or none configured.
     */
    function _checkOracles() internal view returns (bool) {
        for (uint256 i = 0; i < oracles.length; i++) {
            if (!oracles[i].isWorkVerified(address(this))) {
                return false;
            }
        }
        return true;
    }
}
