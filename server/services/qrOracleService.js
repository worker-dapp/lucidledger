/**
 * QR Oracle Service
 *
 * Calls QRCodeOracle.recordVerification(contractAddress) on-chain
 * after a successful QR scan is validated by the backend.
 *
 * Uses the Lucid Oracle Backend EOA (ORACLE_PRIVATE_KEY) to sign and
 * submit the transaction. This wallet must have a small ETH balance on
 * Base for gas (~$0.001/tx).
 */

const { ethers } = require('ethers');

const QR_ORACLE_ABI = [
  'function recordVerification(address workContract) external',
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
 * Record a QR verification on-chain for the given contract address.
 * Non-blocking — logs errors but does not throw, so a failed on-chain
 * call never breaks the kiosk scan response.
 *
 * @param {string} contractAddress - The deployed WorkContract address
 * @returns {Promise<string|null>} transaction hash, or null if skipped/failed
 */
async function recordVerificationOnChain(contractAddress) {
  const oracle = getOracleContract();
  if (!oracle) return null;

  if (!contractAddress) {
    console.warn('[QROracle] No contract address provided — skipping on-chain verification');
    return null;
  }

  try {
    // Check if already verified to avoid a wasted tx (and revert)
    const alreadyVerified = await oracle.isWorkVerified(contractAddress);
    if (alreadyVerified) {
      console.log(`[QROracle] ${contractAddress} already verified on-chain — skipping`);
      return null;
    }

    const tx = await oracle.recordVerification(contractAddress);
    console.log(`[QROracle] recordVerification tx sent: ${tx.hash}`);

    // Wait for 1 confirmation (non-blocking from caller's perspective via fire-and-forget below)
    tx.wait(1).then(() => {
      console.log(`[QROracle] recordVerification confirmed: ${tx.hash}`);
    }).catch((err) => {
      console.error(`[QROracle] recordVerification confirmation error: ${err.message}`);
    });

    return tx.hash;
  } catch (err) {
    console.error(`[QROracle] recordVerification failed for ${contractAddress}:`, err.message);
    return null;
  }
}

module.exports = { recordVerificationOnChain };
