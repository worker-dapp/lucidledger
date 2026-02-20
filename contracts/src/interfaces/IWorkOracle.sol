// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.20;

/**
 * @title IWorkOracle
 * @dev Interface for pluggable work verification oracles.
 *
 * Oracles verify that work has been completed before payment is released.
 * Each oracle type (manual, GPS, time-based, etc.) implements this interface.
 */
interface IWorkOracle {
    /**
     * @notice Check if work has been verified for a given contract.
     * @param workContract Address of the WorkContract to check
     * @return True if work has been verified
     */
    function isWorkVerified(address workContract) external view returns (bool);

    /**
     * @notice Returns the oracle type identifier (e.g. "manual", "gps").
     * @return Oracle type string used as registry key
     */
    function oracleType() external pure returns (string memory);
}
