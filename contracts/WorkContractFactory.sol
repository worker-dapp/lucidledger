// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./ManualWorkContract.sol";

/**
 * @title WorkContractFactory
 * @dev Factory contract for deploying ManualWorkContract instances atomically.
 *
 * This factory solves the race condition problem where users had to:
 * 1. Predict the contract address
 * 2. Approve USDC for that address
 * 3. Deploy the contract
 *
 * With this factory:
 * 1. User approves USDC for the Factory (one-time or per-deployment)
 * 2. Factory atomically deploys contract AND funds it
 *
 * Benefits:
 * - Atomic deploy + fund (no race conditions)
 * - Batch deployment support (deploy multiple contracts in one tx)
 * - Tracking of all deployed contracts per employer
 * - Gas efficient for batch operations
 */
contract WorkContractFactory {
    IERC20 public immutable USDC;
    address public immutable admin;

    // Track contracts deployed by each employer
    mapping(address => address[]) public employerContracts;

    // Track all deployed contracts
    address[] public allContracts;

    event ContractDeployed(
        address indexed contractAddress,
        address indexed employer,
        address indexed worker,
        uint256 amount,
        uint256 jobId,
        address mediator
    );

    event BatchDeployed(
        address indexed employer,
        uint256 contractCount,
        uint256 totalAmount
    );

    /**
     * @dev Constructor sets the USDC token address and admin.
     * @param _usdcAddress Address of the USDC token contract
     * @param _admin Address of the platform admin for mediator assignment
     */
    constructor(address _usdcAddress, address _admin) {
        require(_usdcAddress != address(0), "Invalid USDC address");
        require(_admin != address(0), "Invalid admin address");
        USDC = IERC20(_usdcAddress);
        admin = _admin;
    }

    /**
     * @notice Deploy a single work contract with USDC funding (atomic)
     * @dev Caller must have approved this factory to spend `amount` USDC
     * @param worker Address of the worker
     * @param mediator Address of the mediator (use address(0) for admin assignment after dispute)
     * @param amount Payment amount in USDC (6 decimals)
     * @param jobId Database ID of the job posting
     * @return contractAddress Address of the newly deployed contract
     */
    function deployContract(
        address worker,
        address mediator,
        uint256 amount,
        uint256 jobId
    ) external returns (address contractAddress) {
        require(amount > 0, "Amount must be > 0");
        require(worker != address(0), "Invalid worker");
        require(worker != msg.sender, "Employer cannot be worker");
        require(mediator == address(0), "Mediator assigned after dispute");

        // 1. Pull USDC from employer to factory
        require(
            USDC.transferFrom(msg.sender, address(this), amount),
            "USDC transfer failed - check approval"
        );

        // 2. Deploy new contract with employer address
        ManualWorkContract newContract = new ManualWorkContract(
            msg.sender,  // employer
            worker,
            mediator,
            address(USDC),
            amount,
            jobId,
            admin
        );

        contractAddress = address(newContract);

        // 3. Fund the contract with USDC
        require(
            USDC.transfer(contractAddress, amount),
            "USDC funding failed"
        );

        // 4. Track the deployment
        employerContracts[msg.sender].push(contractAddress);
        allContracts.push(contractAddress);

        emit ContractDeployed(
            contractAddress,
            msg.sender,
            worker,
            amount,
            jobId,
            mediator
        );
    }

    /**
     * @notice Deploy multiple work contracts in a single transaction
     * @dev All contracts use the same employer (msg.sender). Caller must have
     *      approved this factory to spend the total USDC amount.
     * @param workers Array of worker addresses
     * @param mediators Array of mediator addresses (use address(0) for admin assignment after dispute)
     * @param amounts Array of payment amounts in USDC (6 decimals)
     * @param jobIds Array of database job IDs
     * @return contractAddresses Array of deployed contract addresses
     */
    function deployBatch(
        address[] calldata workers,
        address[] calldata mediators,
        uint256[] calldata amounts,
        uint256[] calldata jobIds
    ) external returns (address[] memory contractAddresses) {
        uint256 count = workers.length;
        require(count > 0, "Empty batch");
        require(
            mediators.length == count &&
            amounts.length == count &&
            jobIds.length == count,
            "Array length mismatch"
        );

        // Calculate total USDC needed and validate inputs
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < count; i++) {
            require(amounts[i] > 0, "Amount must be > 0");
            require(workers[i] != address(0), "Invalid worker");
            require(workers[i] != msg.sender, "Employer cannot be worker");
            require(mediators[i] == address(0), "Mediator assigned after dispute");
            totalAmount += amounts[i];
        }

        // Pull all USDC at once (more gas efficient)
        require(
            USDC.transferFrom(msg.sender, address(this), totalAmount),
            "USDC transfer failed - check approval"
        );

        // Deploy all contracts
        contractAddresses = new address[](count);

        for (uint256 i = 0; i < count; i++) {
            ManualWorkContract newContract = new ManualWorkContract(
                msg.sender,
                workers[i],
                mediators[i],
                address(USDC),
                amounts[i],
                jobIds[i],
                admin
            );

            address contractAddr = address(newContract);
            contractAddresses[i] = contractAddr;

            // Fund each contract
            require(
                USDC.transfer(contractAddr, amounts[i]),
                "USDC funding failed"
            );

            // Track
            employerContracts[msg.sender].push(contractAddr);
            allContracts.push(contractAddr);

            emit ContractDeployed(
                contractAddr,
                msg.sender,
                workers[i],
                amounts[i],
                jobIds[i],
                mediators[i]
            );
        }

        emit BatchDeployed(msg.sender, count, totalAmount);
    }

    /**
     * @notice Get all contracts deployed by a specific employer
     * @param employer Address of the employer
     * @return Array of contract addresses
     */
    function getEmployerContracts(address employer)
        external view returns (address[] memory)
    {
        return employerContracts[employer];
    }

    /**
     * @notice Get the total number of contracts deployed through this factory
     * @return Total contract count
     */
    function getTotalContracts() external view returns (uint256) {
        return allContracts.length;
    }

    /**
     * @notice Get a contract address by index
     * @param index Index in the allContracts array
     * @return Contract address at the given index
     */
    function getContractAt(uint256 index) external view returns (address) {
        require(index < allContracts.length, "Index out of bounds");
        return allContracts[index];
    }

    /**
     * @notice Get count of contracts for a specific employer
     * @param employer Address of the employer
     * @return Number of contracts deployed by this employer
     */
    function getEmployerContractCount(address employer)
        external view returns (uint256)
    {
        return employerContracts[employer].length;
    }
}
