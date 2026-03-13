// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.20;

import "../interfaces/IWorkOracle.sol";

/**
 * @title NFCOracle
 * @dev NFC badge attendance oracle — the backend server wallet calls
 *      recordScan() for every clock-in and clock-out event.
 *
 * This is a singleton contract: one NFCOracle serves all WorkContracts.
 * Only the trusted backend address (set at deploy time) can record scans.
 *
 * Payment gate logic:
 * - isWorkVerified() returns true only after a complete clock-in → clock-out pair.
 * - Multiple pairs are supported (worker can clock in/out multiple times).
 * - Clock-in without clock-out does NOT satisfy the gate.
 *
 * Audit trail:
 * - Every scan (clock-in and clock-out) emits a ScanRecorded event on-chain.
 * - Full attendance history is permanently visible on the block explorer.
 *
 * In v0.2.0, the employer still calls approveAndPay() manually — NFC verification
 * is a prerequisite gate, not an auto-release trigger.
 */
contract NFCOracle is IWorkOracle {
    address public immutable backend;

    // Payment gate: true after the first complete clock-in → clock-out pair
    mapping(address => bool) private _verified;

    // Tracks whether a contract currently has an open clock-in (no matching clock-out yet)
    mapping(address => bool) private _clockedIn;

    event ScanRecorded(address indexed workContract, bool indexed clockIn, address indexed recordedBy);

    /**
     * @param _backend Address of the trusted backend server wallet.
     *                 Cannot be changed after deploy.
     */
    constructor(address _backend) {
        require(_backend != address(0), "Invalid backend address");
        backend = _backend;
    }

    /**
     * @notice Backend records an NFC clock-in or clock-out scan for a contract.
     * @param workContract Address of the WorkContract being clocked in/out
     * @param clockIn True for clock-in, false for clock-out
     */
    function recordScan(address workContract, bool clockIn) external {
        require(msg.sender == backend, "Only backend can record scans");
        require(workContract != address(0), "Invalid contract address");

        if (clockIn) {
            require(!_clockedIn[workContract], "Already clocked in");
            _clockedIn[workContract] = true;
        } else {
            require(_clockedIn[workContract], "No active clock-in to close");
            _clockedIn[workContract] = false;
            _verified[workContract] = true; // complete pair — gate satisfied
        }

        emit ScanRecorded(workContract, clockIn, msg.sender);
    }

    /// @inheritdoc IWorkOracle
    function isWorkVerified(address workContract) external view override returns (bool) {
        return _verified[workContract];
    }

    /// @inheritdoc IWorkOracle
    function oracleType() external pure override returns (string memory) {
        return "nfc";
    }
}
