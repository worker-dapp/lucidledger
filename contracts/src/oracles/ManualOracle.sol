// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.20;

import "../interfaces/IWorkOracle.sol";

/**
 * @title ManualOracle
 * @dev Manual work verification oracle — the employer of each WorkContract
 *      calls verify() to confirm work completion.
 *
 * This is a singleton contract: one ManualOracle serves all WorkContracts.
 * The verify() caller is authorized by reading employer() from the target contract.
 */
interface IWorkContractEmployer {
    function employer() external view returns (address);
}

contract ManualOracle is IWorkOracle {
    mapping(address => bool) private _verified;

    event WorkVerified(address indexed workContract, address indexed verifiedBy);

    /**
     * @notice Employer verifies work completion for a given contract.
     * @param workContract Address of the WorkContract to verify
     */
    function verify(address workContract) external {
        require(workContract != address(0), "Invalid contract address");
        address contractEmployer = IWorkContractEmployer(workContract).employer();
        require(msg.sender == contractEmployer, "Only employer can verify");
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
        return "manual";
    }
}
