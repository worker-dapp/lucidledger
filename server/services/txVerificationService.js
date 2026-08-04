const { ethers } = require('ethers');

// ERC-20 Transfer event — the single source of truth for "money actually moved".
// Transfer(address indexed from, address indexed to, uint256 value)
const ERC20_TRANSFER_ABI = ['event Transfer(address indexed from, address indexed to, uint256 value)'];
const transferInterface = new ethers.Interface(ERC20_TRANSFER_ABI);

// USDC on Base uses 6 decimals.
const USDC_DECIMALS = 6;

const getProvider = () => {
  const rpcUrl = process.env.BASE_RPC_URL || 'https://sepolia.base.org';
  return new ethers.JsonRpcProvider(rpcUrl);
};

const eq = (a, b) => String(a).toLowerCase() === String(b).toLowerCase();

/**
 * Verify that an on-chain transaction actually moved the claimed USDC amount from the
 * employer's wallet to the recruiter's wallet. Never trusts the client's "paid" claim —
 * it re-derives the truth from the transaction receipt.
 *
 * Returns one of:
 *   { status: 'verified' }                    — receipt found, a matching USDC Transfer exists
 *   { status: 'mismatch', reason }            — receipt found, but nothing matches (definitive: reject)
 *   { status: 'unverifiable', reason }        — RPC failed or tx not mined yet (transient: hold as pending)
 *
 * @param {Object} params
 * @param {string} params.txHash        transaction hash submitted by the client
 * @param {string} params.fromAddress   employer wallet (resolved server-side, never from the client body)
 * @param {string} params.toAddress     recruiter wallet (resolved server-side)
 * @param {string|number} params.amount fee amount in whole USDC (e.g. "150" or 150)
 * @param {Object} [params.provider] optional ethers provider — injected in tests so the branch
 *        matrix can be exercised offline against synthetic receipts. Defaults to the real RPC.
 */
async function verifyUsdcPayment({ txHash, fromAddress, toAddress, amount, provider }) {
  const usdcAddress = process.env.USDC_ADDRESS;
  if (!usdcAddress) {
    // Misconfiguration, not a client error — don't reject a legitimate payment over it.
    return { status: 'unverifiable', reason: 'USDC_ADDRESS not configured on server' };
  }
  if (!txHash || !/^0x[0-9a-fA-F]{64}$/.test(txHash)) {
    return { status: 'mismatch', reason: 'tx_hash is missing or malformed' };
  }
  if (!fromAddress || !toAddress) {
    return { status: 'unverifiable', reason: 'employer or recruiter wallet address is not on file' };
  }

  let expectedValue;
  try {
    expectedValue = ethers.parseUnits(String(amount), USDC_DECIMALS);
  } catch {
    return { status: 'mismatch', reason: `fee_amount "${amount}" is not a valid token amount` };
  }

  let receipt;
  try {
    receipt = await (provider || getProvider()).getTransactionReceipt(txHash);
  } catch (error) {
    // RPC/network failure — the tx may well be valid; hold as pending rather than reject.
    return { status: 'unverifiable', reason: `RPC error fetching receipt: ${error.message}` };
  }

  if (!receipt) {
    // Not mined yet, or unknown to this node. Ambiguous — hold as pending.
    return { status: 'unverifiable', reason: 'transaction not found or not yet mined' };
  }
  if (receipt.status === 0) {
    return { status: 'mismatch', reason: 'transaction reverted on-chain' };
  }

  // Scan the receipt for a USDC Transfer matching from → to for the expected amount.
  for (const log of receipt.logs) {
    if (!eq(log.address, usdcAddress)) continue; // must be the USDC contract, not some other token
    let parsed;
    try {
      parsed = transferInterface.parseLog({ topics: log.topics, data: log.data });
    } catch {
      continue; // not a Transfer event
    }
    if (!parsed || parsed.name !== 'Transfer') continue;

    if (
      eq(parsed.args.from, fromAddress) &&
      eq(parsed.args.to, toAddress) &&
      parsed.args.value === expectedValue
    ) {
      return { status: 'verified' };
    }
  }

  return {
    status: 'mismatch',
    reason: 'no USDC transfer of the expected amount from the employer to the recruiter was found in this transaction',
  };
}

module.exports = { verifyUsdcPayment };
