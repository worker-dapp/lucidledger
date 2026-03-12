/**
 * QR Oracle Service
 *
 * Calls QRCodeOracle.recordScan(contractAddress, clockIn) on-chain
 * after every validated QR scan (clock-in or clock-out).
 *
 * Uses the Lucid Oracle Backend EOA (ORACLE_PRIVATE_KEY) to sign and
 * submit the transaction. This wallet must have a small ETH balance on
 * Base for gas (~$0.001/tx).
 *
 * Payment gate logic (enforced in QRCodeOracle.sol):
 * - Clock-in alone does NOT satisfy isWorkVerified()
 * - A complete clock-in → clock-out pair sets isWorkVerified() = true
 * - Multiple pairs are supported
 */

const { ethers } = require('ethers');

const QR_ORACLE_ABI = [
  'function recordScan(address workContract, bool clockIn) external',
  'function isWorkVerified(address workContract) external view returns (bool)',
  'function oracleType() external pure returns (string)',
];

let _oracle = null;

function getOracleContract() {
  if (_oracle) return _oracle;

  const { ORACLE_PRIVATE_KEY, QR_ORACLE_ADDRESS } = process.env;

  if (!ORACLE_PRIVATE_KEY || !QR_ORACLE_ADDRESS) {
    console.warn('[QROracle] ORACLE_PRIVATE_KEY or QR_ORACLE_ADDRESS not set — on-chain verification disabled');
    return null;
  }

  const rpcUrl = process.env.BASE_RPC_URL || 'https://sepolia.base.org';
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(ORACLE_PRIVATE_KEY, provider);
  _oracle = new ethers.Contract(QR_ORACLE_ADDRESS, QR_ORACLE_ABI, wallet);

  return _oracle;
}

/**
 * Record a QR clock-in or clock-out scan on-chain.
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
    console.warn('[QROracle] No contract address provided — skipping on-chain scan');
    return null;
  }

  const clockIn = eventType === 'clock_in';

  try {
    const tx = await oracle.recordScan(contractAddress, clockIn);
    console.log(`[QROracle] recordScan(${eventType}) tx sent: ${tx.hash}`);

    tx.wait(1).then(() => {
      console.log(`[QROracle] recordScan(${eventType}) confirmed: ${tx.hash}`);
    }).catch((err) => {
      console.error(`[QROracle] recordScan(${eventType}) confirmation error: ${err.message}`);
    });

    return tx.hash;
  } catch (err) {
    console.error(`[QROracle] recordScan(${eventType}) failed for ${contractAddress}:`, err.message);
    return null;
  }
}

module.exports = { recordScanOnChain };
