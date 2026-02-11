/**
 * Factory-based Contract Deployment Module
 *
 * Provides atomic deploy + fund operations using the WorkContractFactory.
 * Eliminates race conditions from the old "predict address → approve → deploy" pattern.
 *
 * Features:
 * - Single signature for approve + deploy (via batch transaction)
 * - Batch deployment for multiple contracts in one transaction
 * - Gas-free via Coinbase CDP paymaster
 */

import { encodeFunctionData, parseUnits, decodeEventLog, getAddress } from 'viem';
import { sendBatchTransaction, publicClient } from './aaClient';
import WorkContractFactoryABI from './WorkContractFactory.json';
import ERC20ABI from './ERC20.json';

// Configuration from environment variables
const FACTORY_ADDRESS = import.meta.env.VITE_FACTORY_ADDRESS;
const USDC_ADDRESS = import.meta.env.VITE_USDC_ADDRESS;
const BASESCAN_URL = import.meta.env.VITE_BASESCAN_URL || 'https://base-sepolia.blockscout.com';

// USDC has 6 decimals
const USDC_DECIMALS = 6;
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

/**
 * Check if Factory deployment is properly configured.
 * @returns {{ valid: boolean, missing: string[] }}
 */
export const checkFactoryConfiguration = () => {
  const required = {
    VITE_FACTORY_ADDRESS: FACTORY_ADDRESS,
    VITE_USDC_ADDRESS: USDC_ADDRESS,
  };

  const missing = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  return {
    valid: missing.length === 0,
    missing,
    config: {
      factory: FACTORY_ADDRESS || '(not set)',
      usdc: USDC_ADDRESS || '(not set)',
      basescan: BASESCAN_URL,
    },
  };
};

/**
 * Gets the USDC balance for an address.
 * @param {string} address - The address to check
 * @returns {Promise<{raw: bigint, formatted: string}>}
 */
export const getUSDCBalance = async (address) => {
  if (!USDC_ADDRESS) {
    throw new Error('USDC address not configured (VITE_USDC_ADDRESS)');
  }

  const balance = await publicClient.readContract({
    address: getAddress(USDC_ADDRESS),
    abi: ERC20ABI.abi,
    functionName: 'balanceOf',
    args: [getAddress(address)],
  });

  const formatted = (Number(balance) / 10 ** USDC_DECIMALS).toFixed(2);

  return { raw: balance, formatted };
};

/**
 * Deploy a single contract via Factory (atomic approve + deploy + fund).
 *
 * @param {object} params - Deployment parameters
 * @param {object} params.smartWalletClient - Privy smart wallet client
 * @param {string} params.workerAddress - Worker's wallet address
 * @param {number} params.paymentAmountUSD - Payment amount in USD
 * @param {number} params.jobId - Database ID of the job posting
 * @param {function} [params.onStatusChange] - Callback for status updates
 * @returns {Promise<{contractAddress: string, txHash: string, basescanUrl: string}>}
 */
export const deploySingleViaFactory = async ({
  smartWalletClient,
  workerAddress,
  paymentAmountUSD,
  jobId,
  onStatusChange,
}) => {
  const config = checkFactoryConfiguration();
  if (!config.valid) {
    throw new Error(`Missing configuration: ${config.missing.join(', ')}`);
  }

  // Validate addresses
  const validatedWorker = getAddress(workerAddress);
  const amountUnits = parseUnits(paymentAmountUSD.toString(), USDC_DECIMALS);
  const mediatorAddress = getAddress(ZERO_ADDRESS);

  // Build batch transaction: approve + deployContract
  const calls = [
    {
      to: getAddress(USDC_ADDRESS),
      data: encodeFunctionData({
        abi: ERC20ABI.abi,
        functionName: 'approve',
        args: [getAddress(FACTORY_ADDRESS), amountUnits],
      }),
    },
    {
      to: getAddress(FACTORY_ADDRESS),
      data: encodeFunctionData({
        abi: WorkContractFactoryABI.abi,
        functionName: 'deployContract',
        args: [validatedWorker, mediatorAddress, amountUnits, BigInt(jobId)],
      }),
    },
  ];

  const result = await sendBatchTransaction({
    smartWalletClient,
    calls,
    onStatusChange,
  });

  // Extract contract address from ContractDeployed event
  const contractAddress = extractDeployedAddress(result.receipt);

  return {
    contractAddress,
    txHash: result.hash,
    basescanUrl: `${BASESCAN_URL}/address/${contractAddress}`,
  };
};

/**
 * Deploy multiple contracts via Factory batch function (single signature).
 *
 * @param {object} params - Batch parameters
 * @param {object} params.smartWalletClient - Privy smart wallet client
 * @param {Array<{workerAddress: string, paymentAmountUSD: number, jobId: number}>} params.deployments - Array of deployment configs
 * @param {function} [params.onStatusChange] - Callback for status updates
 * @returns {Promise<{contractAddresses: string[], txHash: string, basescanUrl: string}>}
 */
export const deployBatchViaFactory = async ({
  smartWalletClient,
  deployments,
  onStatusChange,
}) => {
  if (!deployments || deployments.length === 0) {
    throw new Error('No deployments provided');
  }

  const config = checkFactoryConfiguration();
  if (!config.valid) {
    throw new Error(`Missing configuration: ${config.missing.join(', ')}`);
  }

  // Calculate total USDC needed
  let totalAmount = 0n;
  for (const d of deployments) {
    totalAmount += parseUnits(d.paymentAmountUSD.toString(), USDC_DECIMALS);
  }

  // Prepare arrays for batch call
  const workers = deployments.map((d) => getAddress(d.workerAddress));
  const mediators = deployments.map(() => getAddress(ZERO_ADDRESS));
  const amounts = deployments.map((d) => parseUnits(d.paymentAmountUSD.toString(), USDC_DECIMALS));
  const jobIds = deployments.map((d) => BigInt(d.jobId));

  // Build batch transaction: approve total + deployBatch
  const calls = [
    {
      to: getAddress(USDC_ADDRESS),
      data: encodeFunctionData({
        abi: ERC20ABI.abi,
        functionName: 'approve',
        args: [getAddress(FACTORY_ADDRESS), totalAmount],
      }),
    },
    {
      to: getAddress(FACTORY_ADDRESS),
      data: encodeFunctionData({
        abi: WorkContractFactoryABI.abi,
        functionName: 'deployBatch',
        args: [workers, mediators, amounts, jobIds],
      }),
    },
  ];

  const result = await sendBatchTransaction({
    smartWalletClient,
    calls,
    onStatusChange,
  });

  // Extract all deployed addresses from events
  const contractAddresses = extractAllDeployedAddresses(result.receipt);

  return {
    contractAddresses,
    txHash: result.hash,
    basescanUrl: `${BASESCAN_URL}/tx/${result.hash}`,
  };
};

/**
 * Extract deployed contract address from transaction receipt.
 * Looks for ContractDeployed event.
 *
 * @param {object} receipt - Transaction receipt
 * @returns {string} Contract address
 */
function extractDeployedAddress(receipt) {
  if (!receipt?.logs) {
    throw new Error('No logs in receipt');
  }

  for (const log of receipt.logs) {
    try {
      const decoded = decodeEventLog({
        abi: WorkContractFactoryABI.abi,
        data: log.data,
        topics: log.topics,
      });
      if (decoded.eventName === 'ContractDeployed') {
        return decoded.args.contractAddress;
      }
    } catch {
      // Not a ContractDeployed event, continue
    }
  }

  throw new Error('ContractDeployed event not found in receipt');
}

/**
 * Extract all deployed contract addresses from batch deployment receipt.
 *
 * @param {object} receipt - Transaction receipt
 * @returns {string[]} Array of contract addresses
 */
function extractAllDeployedAddresses(receipt) {
  if (!receipt?.logs) {
    throw new Error('No logs in receipt');
  }

  const addresses = [];
  for (const log of receipt.logs) {
    try {
      const decoded = decodeEventLog({
        abi: WorkContractFactoryABI.abi,
        data: log.data,
        topics: log.topics,
      });
      if (decoded.eventName === 'ContractDeployed') {
        addresses.push(decoded.args.contractAddress);
      }
    } catch {
      // Not a ContractDeployed event, continue
    }
  }

  if (addresses.length === 0) {
    throw new Error('No ContractDeployed events found in receipt');
  }

  return addresses;
}

/**
 * Get BaseScan URL for a transaction or address.
 *
 * @param {string} hashOrAddress - Transaction hash or contract address
 * @param {"tx" | "address"} type - URL type
 * @returns {string} BaseScan URL
 */
export const getBasescanUrl = (hashOrAddress, type = 'address') => {
  return `${BASESCAN_URL}/${type}/${hashOrAddress}`;
};

export default {
  checkFactoryConfiguration,
  getUSDCBalance,
  deploySingleViaFactory,
  deployBatchViaFactory,
  getBasescanUrl,
  USDC_DECIMALS,
};
