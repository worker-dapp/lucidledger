/**
 * NFC Oracle Service
 *
 * Calls NFCOracle.recordScan(contractAddress, clockIn) on-chain
 * after every validated NFC badge scan (clock-in or clock-out).
 *
 * Uses the NFC Oracle Backend EOA (NFC_ORACLE_PRIVATE_KEY) to sign and
 * submit the transaction. This wallet must have a small ETH balance on
 * Base for gas (~$0.001/tx).
 *
 * Payment gate logic (enforced in NFCOracle.sol):
 * - Clock-in alone does NOT satisfy isWorkVerified()
 * - A complete clock-in → clock-out pair sets isWorkVerified() = true
 * - Multiple pairs are supported
 */

const { ethers } = require('ethers');

const NFC_ORACLE_ABI = [
  'function recordScan(address workContract, bool clockIn) external',
  'function isWorkVerified(address workContract) external view returns (bool)',
  'function oracleType() external pure returns (string)',
];

let _oracle = null;

function getOracleContract() {
  if (_oracle) return _oracle;

  // Falls back to shared ORACLE_PRIVATE_KEY if NFC_ORACLE_PRIVATE_KEY not set
  const privateKey = process.env.NFC_ORACLE_PRIVATE_KEY || process.env.ORACLE_PRIVATE_KEY;
  const { NFC_ORACLE_ADDRESS } = process.env;

  if (!privateKey || !NFC_ORACLE_ADDRESS) {
    console.warn('[NFCOracle] NFC_ORACLE_PRIVATE_KEY/ORACLE_PRIVATE_KEY or NFC_ORACLE_ADDRESS not set — on-chain verification disabled');
    return null;
  }

  const rpcUrl = process.env.BASE_RPC_URL || 'https://sepolia.base.org';
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  _oracle = new ethers.Contract(NFC_ORACLE_ADDRESS, NFC_ORACLE_ABI, wallet);

  return _oracle;
}

/**
 * Record an NFC clock-in or clock-out scan on-chain.
 * Non-blocking — logs errors but does not throw, so a failed on-chain
 * call never breaks the kiosk scan response.
 *
 * @param {string} contractAddress - The deployed WorkContract address
 * @param {string} eventType - 'clock_in' or 'clock_out'
 * @returns {Promise<string|null>} transaction hash, or null if skipped/failed
 */
async function recordScanOnChain(contractAddress, eventType) {
  const oracle = getOracleContract();
  if (!oracle) return null;

  if (!contractAddress) {
    console.warn('[NFCOracle] No contract address provided — skipping on-chain scan');
    return null;
  }

  const clockIn = eventType === 'clock_in';

  try {
    const tx = await oracle.recordScan(contractAddress, clockIn);
    console.log(`[NFCOracle] recordScan(${eventType}) tx sent: ${tx.hash}`);

    tx.wait(1).then(() => {
      console.log(`[NFCOracle] recordScan(${eventType}) confirmed: ${tx.hash}`);
    }).catch((err) => {
      console.error(`[NFCOracle] recordScan(${eventType}) confirmation error: ${err.message}`);
    });

    return tx.hash;
  } catch (err) {
    console.error(`[NFCOracle] recordScan(${eventType}) failed for ${contractAddress}:`, err.message);
    return null;
  }
}

module.exports = { recordScanOnChain };
