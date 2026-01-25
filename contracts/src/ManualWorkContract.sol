// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title ManualWorkContract
 * @dev Escrow-based work contract with manual verification.
 *
 * This contract implements the core wage protection mechanism from the Lucid Ledger
 * whitepaper. Funds are held in escrow until the employer manually approves work
 * completion, at which point payment is released to the worker.
 *
 * Key features:
 * - Employer funds escrow with USDC (via Factory or direct transfer)
 * - Manual verification (employer approves work completion)
 * - Neutral mediator for dispute resolution (NOT the employer)
 * - Either party can raise disputes
 *
 * Aligned with whitepaper Section 3.2 (escrow-based protection) and
 * Section 3.4 (neutral dispute resolution).
 *
 * Note: This contract is designed to be deployed via WorkContractFactory,
 * which handles the atomic approve + deploy + fund pattern.
 */
contract ManualWorkContract {
    address public admin;
    address public employer;
    address public worker;
    address public mediator;  // Neutral third party for dispute resolution
    IERC20 public paymentToken;  // USDC or other ERC20
    uint256 public paymentAmount;
    uint256 public jobId;
    string public disputeReason;

    enum State { Funded, Completed, Disputed, Refunded }
    State public state;

    event ContractFunded(address indexed employer, address indexed worker, uint256 amount, uint256 jobId);
    event WorkApproved(address indexed worker, uint256 amount);
    event DisputeRaised(address indexed raisedBy, string reason);
    event DisputeResolved(address indexed recipient, uint256 amount, bool paidWorker);
    event MediatorAssigned(address indexed mediator);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can assign mediator");
        _;
    }

    /**
     * @dev Creates a new work contract.
     * @param _employer Address of the employer (passed by Factory)
     * @param _worker Address of the worker to be paid
     * @param _mediator Address of the mediator for disputes (can be zero for post-dispute assignment)
     * @param _paymentToken Address of the ERC20 token (USDC) for payment
     * @param _paymentAmount Amount to be paid upon work completion
     * @param _jobId Database ID of the associated job posting
     * @param _admin Platform admin address for mediator assignment
     *
     * Note: The Factory handles USDC transfer after deployment for atomic operations.
     * The contract starts in Funded state, assuming the Factory will fund it immediately.
     *
     * Requirements:
     * - All addresses must be valid (non-zero), except mediator when assigned later
     * - Payment amount must be greater than 0
     * - Worker cannot be the employer
     */
    constructor(
        address _employer,
        address _worker,
        address _mediator,
        address _paymentToken,
        uint256 _paymentAmount,
        uint256 _jobId,
        address _admin
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

        // Note: No transferFrom here - Factory handles funding after deployment
        // This enables atomic approve + deploy + fund in a single transaction

        emit ContractFunded(_employer, _worker, _paymentAmount, _jobId);
    }

    /**
     * @dev Employer approves work completion and releases payment to worker.
     *
     * This is the "happy path" - work is completed satisfactorily and the
     * employer manually verifies and approves payment release.
     *
     * Requirements:
     * - Caller must be the employer
     * - Contract must be in Funded state
     */
    function approveAndPay() external {
        require(msg.sender == employer, "Only employer can approve");
        require(state == State.Funded, "Contract not in funded state");

        state = State.Completed;
        require(paymentToken.transfer(worker, paymentAmount), "Payment transfer failed");

        emit WorkApproved(worker, paymentAmount);
    }

    /**
     * @dev Either party can raise a dispute, freezing the funds.
     * @param reason Description of why the dispute is being raised
     *
     * Once disputed, only the mediator can resolve and distribute funds.
     * This prevents employer from unilaterally refunding themselves.
     *
     * Requirements:
     * - Caller must be either the employer or worker
     * - Contract must be in Funded state
     */
    function raiseDispute(string calldata reason) external {
        require(msg.sender == employer || msg.sender == worker, "Only contract parties can dispute");
        require(state == State.Funded, "Contract not in funded state");
        require(bytes(reason).length > 0, "Dispute reason required");

        state = State.Disputed;
        disputeReason = reason;

        emit DisputeRaised(msg.sender, reason);
    }

    /**
     * @dev Mediator resolves a dispute by deciding who receives the funds.
     * @param payWorker True to pay the worker, false to refund the employer
     *
     * CRITICAL: Only the neutral mediator can resolve disputes.
     * This is core to the whitepaper's vision of fair dispute resolution
     * (Section 3.4 - "structured arbitration").
     *
     * Requirements:
     * - Caller must be the designated mediator
     * - Contract must be in Disputed state
     */
    function resolveDispute(bool payWorker) external {
        require(mediator != address(0), "Mediator not assigned");
        require(msg.sender == mediator, "Only mediator can resolve disputes");
        require(state == State.Disputed, "Contract not in disputed state");

        address recipient = payWorker ? worker : employer;
        state = payWorker ? State.Completed : State.Refunded;

        require(paymentToken.transfer(recipient, paymentAmount), "Resolution transfer failed");

        emit DisputeResolved(recipient, paymentAmount, payWorker);
    }

    /**
     * @dev Admin assigns a mediator after deployment.
     * @param _mediator Address of the mediator to assign
     */
    function assignMediator(address _mediator) external onlyAdmin {
        require(state == State.Disputed, "Contract not in disputed state");
        require(_mediator != address(0), "Invalid mediator address");
        require(mediator == address(0), "Mediator already assigned");
        require(_mediator != employer, "Mediator cannot be employer");
        require(_mediator != worker, "Mediator cannot be worker");

        mediator = _mediator;

        emit MediatorAssigned(_mediator);
    }

    /**
     * @dev Returns all contract details in a single call.
     * Useful for frontend to display contract state.
     */
    function getDetails() external view returns (
        address _employer,
        address _worker,
        address _mediator,
        uint256 _paymentAmount,
        uint256 _jobId,
        State _state,
        string memory _disputeReason
    ) {
        return (employer, worker, mediator, paymentAmount, jobId, state, disputeReason);
    }

    /**
     * @dev Returns the current token balance held in escrow.
     * Should match paymentAmount while in Funded or Disputed state.
     */
    function getBalance() external view returns (uint256) {
        return paymentToken.balanceOf(address(this));
    }
}
