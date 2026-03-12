// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.20;

import "../interfaces/IWorkOracle.sol";

/**
 * @title QRCodeOracle
 * @dev QR code attendance oracle — the backend server wallet calls
 *      recordVerification() after a valid worker QR scan is validated.
 *
 * This is a singleton contract: one QRCodeOracle serves all WorkContracts.
 * Only the trusted backend address (set at deploy time) can record verifications.
 *
 * In v0.2.0, the employer still calls approveAndPay() manually — QR verification
 * is a prerequisite gate, not an auto-release trigger. Auto-release for QR-only
 * contracts is planned for v0.4.0 (#82).
 */
contract QRCodeOracle is IWorkOracle {
    address public immutable backend;

    mapping(address => bool) private _verified;

    event WorkVerified(address indexed workContract, address indexed recordedBy);

    /**
     * @param _backend Address of the trusted backend server wallet that may
     *                 call recordVerification(). Cannot be changed after deploy.
     */
    constructor(address _backend) {
        require(_backend != address(0), "Invalid backend address");
        backend = _backend;
    }

    /**
     * @notice Backend records a successful QR scan verification for a contract.
     * @param workContract Address of the WorkContract that has been verified
     */
    function recordVerification(address workContract) external {
        require(msg.sender == backend, "Only backend can record verification");
        require(workContract != address(0), "Invalid contract address");
        require(!_verified[workContract], "Already verified");

        _verified[workContract] = true;

        emit WorkVerified(workContract, msg.sender);
    }

    /// @inheritdoc IWorkOracle
    function isWorkVerified(address workContract) external view override returns (bool) {
        return _verified[workContract];
    }

    /// @inheritdoc IWorkOracle
    function oracleType() external pure override returns (string memory) {
        return "qr";
    }
}
