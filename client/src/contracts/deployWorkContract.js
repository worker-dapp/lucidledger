/**
 * Work Contract Deployment Module
 *
 * Handles USDC approvals and ManualWorkContract deployments
 * using Account Abstraction for gas-free transactions.
 */

import {
  encodeFunctionData,
  encodeDeployData,
  parseUnits,
  getAddress,
  getContractAddress,
} from "viem";
import ManualWorkContractABI from "./ManualWorkContract.json";
import ERC20ABI from "./ERC20.json";
import {
  publicClient,
  sendSponsoredTransaction,
  sendBatchTransaction,
  TxSteps,
  parseAAError,
  getSmartWalletAddress,
} from "./aaClient";

// Base Sepolia testnet configuration
const BASE_SEPOLIA_CHAIN_ID = parseInt(import.meta.env.VITE_BASE_SEPOLIA_CHAIN_ID || "84532");
const USDC_ADDRESS = import.meta.env.VITE_USDC_ADDRESS;
const BASESCAN_URL = import.meta.env.VITE_BASESCAN_URL || "https://sepolia.basescan.org";
const DEFAULT_MEDIATOR_ADDRESS = "0x0000000000000000000000000000000000000000";

// USDC has 6 decimals
const USDC_DECIMALS = 6;

const getPredictedContractAddress = async (employerAddress) => {
  const normalized = getAddress(employerAddress);
  const nonce = await publicClient.getTransactionCount({ address: normalized });
  return getContractAddress({ from: normalized, nonce });
};

/**
 * Gets the USDC balance for an address.
 * Uses the public client for read operations.
 *
 * @param {string} address - The address to check
 * @returns {Promise<{raw: bigint, formatted: string}>} Balance in raw and formatted form
 */
export const getUSDCBalance = async (address) => {
  if (!USDC_ADDRESS) {
    throw new Error("USDC address not configured (VITE_USDC_ADDRESS)");
  }

  const balance = await publicClient.readContract({
    address: getAddress(USDC_ADDRESS),
    abi: ERC20ABI.abi,
    functionName: "balanceOf",
    args: [getAddress(address)],
  });

  const formatted = (Number(balance) / 10 ** USDC_DECIMALS).toFixed(2);

  return { raw: balance, formatted };
};

/**
 * Checks current USDC allowance for a spender.
 *
 * @param {string} ownerAddress - Token owner
 * @param {string} spenderAddress - Address allowed to spend
 * @returns {Promise<bigint>} Current allowance
 */
export const checkUSDCAllowance = async (ownerAddress, spenderAddress) => {
  if (!USDC_ADDRESS) {
    throw new Error("USDC address not configured (VITE_USDC_ADDRESS)");
  }

  return publicClient.readContract({
    address: getAddress(USDC_ADDRESS),
    abi: ERC20ABI.abi,
    functionName: "allowance",
    args: [getAddress(ownerAddress), getAddress(spenderAddress)],
  });
};

/**
 * Approves USDC spending using Account Abstraction (gas-free).
 *
 * @param {object} user - Privy user
 * @param {object} smartWalletClient - Privy smart wallet client
 * @param {string} spenderAddress - Address to approve
 * @param {number} amountUSD - Amount in USD (will be converted to USDC units)
 * @param {function} [onStatusChange] - Callback for status updates
 * @returns {Promise<{txHash: string, basescanUrl: string}>}
 */
export const approveUSDC = async ({ smartWalletClient, spenderAddress, amountUSD, onStatusChange }) => {
  if (!USDC_ADDRESS) {
    throw new Error("USDC address not configured (VITE_USDC_ADDRESS)");
  }

  const amountInUnits = parseUnits(amountUSD.toString(), USDC_DECIMALS);

  const data = encodeFunctionData({
    abi: ERC20ABI.abi,
    functionName: "approve",
    args: [getAddress(spenderAddress), amountInUnits],
  });

  const result = await sendSponsoredTransaction({
    smartWalletClient,
    to: getAddress(USDC_ADDRESS),
    data,
    onStatusChange,
  });

  return {
    txHash: result.hash,
    basescanUrl: result.basescanUrl,
  };
};

/**
 * Deploys a new ManualWorkContract with USDC in escrow.
 * Uses Account Abstraction for gas-free deployment.
 *
 * Note: For contract deployment, we use a batch transaction:
 * 1. Approve USDC spending for the new contract
 * 2. Deploy the contract (which pulls USDC in constructor)
 *
 * Since we don't know the address before deployment with CREATE,
 * we use a factory pattern or pre-compute with CREATE2.
 * For MVP: Deploy first, then fund via separate function.
 *
 * @param {object} params - Deployment parameters
 * @param {object} params.user - Privy user
 * @param {object} params.smartWalletClient - Privy smart wallet client
 * @param {string} params.workerAddress - Worker's wallet address
 * @param {number} params.paymentAmountUSD - Payment amount in USD
 * @param {number} params.jobId - Database ID of the job posting
 * @param {string} [params.mediatorAddress] - Optional custom mediator (defaults to zero address)
 * @param {function} [params.onStatusChange] - Callback for status updates
 * @returns {Promise<{contractAddress: string, txHash: string, basescanUrl: string}>}
 */
export const deployWorkContract = async ({
  user,
  smartWalletClient,
  workerAddress,
  paymentAmountUSD,
  jobId,
  mediatorAddress = DEFAULT_MEDIATOR_ADDRESS,
  onStatusChange,
}) => {
  if (!USDC_ADDRESS) {
    throw new Error("USDC address not configured (VITE_USDC_ADDRESS)");
  }

  // Validate worker address
  let validatedWorker;
  try {
    validatedWorker = getAddress(workerAddress);
  } catch {
    throw new Error("Invalid worker address");
  }

  if (!paymentAmountUSD || paymentAmountUSD <= 0) {
    throw new Error("Payment amount must be greater than 0");
  }

  const updateStatus = (step, message) => {
    if (onStatusChange) {
      onStatusChange({ step, message });
    }
  };

  try {
    // Get the smart account address (this is the contract wallet that sends transactions)
    // With Coinbase Smart Account, USDC must be held by the smart account, not the EOA
    updateStatus(TxSteps.PREPARING_USEROP, "Getting smart account address...");
    const smartAccountAddress = getSmartWalletAddress(user);
    if (!smartAccountAddress) {
      throw new Error("Smart wallet not connected");
    }
    const employerAddress = getAddress(smartAccountAddress);

    // Check balance on the smart account (which holds the USDC)
    updateStatus(TxSteps.PREPARING_USEROP, "Checking USDC balance...");
    const balance = await getUSDCBalance(employerAddress);
    const paymentAmountUnits = parseUnits(paymentAmountUSD.toString(), USDC_DECIMALS);

    if (balance.raw < paymentAmountUnits) {
      throw new Error(
        `Insufficient USDC balance in smart wallet. Have: ${balance.formatted}, Need: ${paymentAmountUSD}. ` +
        `Please transfer USDC to your smart wallet: ${employerAddress}`
      );
    }

    updateStatus(TxSteps.PREPARING_USEROP, "Calculating deployment address...");
    const predictedAddress = await getPredictedContractAddress(employerAddress);

    updateStatus(TxSteps.PREPARING_USEROP, "Approving USDC for escrow...");
    await approveUSDC({ smartWalletClient, spenderAddress: predictedAddress, amountUSD: paymentAmountUSD, onStatusChange });

    updateStatus(TxSteps.PREPARING_USEROP, "Preparing contract deployment...");

    // For contract deployment via AA, we need to use the wallet's ability
    // to deploy contracts. However, standard AA doesn't support CREATE directly.
    //
    // Options:
    // 1. Use a factory contract (recommended for production)
    // 2. Use CREATE2 with deterministic addresses
    // 3. Fall back to EOA deployment
    //
    // For MVP: We'll use the smart wallet client directly for deployment.

    updateStatus(TxSteps.SIGNING_USEROP, "Sign deployment in your wallet...");

    // Deploy the contract via AA-sponsored transaction
    const deployData = encodeDeployData({
      abi: ManualWorkContractABI.abi,
      bytecode: ManualWorkContractABI.bytecode,
      args: [
        validatedWorker,
        getAddress(mediatorAddress),
        getAddress(USDC_ADDRESS),
        paymentAmountUnits,
        BigInt(jobId),
      ],
    });

    const deployResult = await sendSponsoredTransaction({
      smartWalletClient,
      data: deployData,
      onStatusChange,
    });

    // Get the contract address from the receipt, fall back to predicted address
    const contractAddress = deployResult?.receipt?.contractAddress || predictedAddress;

    if (!contractAddress) {
      throw new Error("Contract deployment failed - no contract address in receipt");
    }

    updateStatus(TxSteps.SUCCESS, "Contract deployed successfully!");

    console.log("Contract deployed at:", contractAddress);

    return {
      contractAddress,
      txHash: deployResult.hash,
      basescanUrl: `${BASESCAN_URL}/address/${contractAddress}`,
    };
  } catch (error) {
    updateStatus(TxSteps.ERROR, parseAAError(error));
    throw error;
  }
};

/**
 * Approves USDC and deploys contract in a batch (if supported).
 * This is more gas-efficient than separate transactions.
 *
 * @param {object} params - Deployment parameters
 * @param {object} params.smartWalletClient - Privy smart wallet client
 * @param {string} params.workerAddress - Worker's wallet address
 * @param {number} params.paymentAmountUSD - Payment amount in USD
 * @param {number} params.jobId - Database ID
 * @param {string} [params.mediatorAddress] - Custom mediator
 * @param {function} [params.onStatusChange] - Status callback
 * @returns {Promise<{contractAddress: string, txHash: string, basescanUrl: string}>}
 */
export const approveAndDeployContract = async (params) => {
  // For now, this is the same as deployWorkContract since
  // the contract constructor handles the transfer internally.
  // In production with a factory pattern, we'd batch approve + create.
  return deployWorkContract(params);
};

/**
 * Funds an already-deployed contract with USDC.
 * Use this for the 2-step deployment pattern:
 * 1. Deploy contract (unfunded)
 * 2. Approve + transfer USDC to contract
 *
 * @param {object} params - Funding parameters
 * @param {object} params.user - Privy user
 * @param {object} params.smartWalletClient - Privy smart wallet client
 * @param {string} params.contractAddress - Deployed contract address
 * @param {number} params.amountUSD - Amount to fund
 * @param {function} [params.onStatusChange] - Status callback
 * @returns {Promise<{txHash: string, basescanUrl: string}>}
 */
export const fundContract = async ({
  smartWalletClient,
  contractAddress,
  amountUSD,
  onStatusChange,
}) => {
  if (!USDC_ADDRESS) {
    throw new Error("USDC address not configured (VITE_USDC_ADDRESS)");
  }

  const amountInUnits = parseUnits(amountUSD.toString(), USDC_DECIMALS);

  // Batch: approve + transfer
  const approveData = encodeFunctionData({
    abi: ERC20ABI.abi,
    functionName: "approve",
    args: [getAddress(contractAddress), amountInUnits],
  });

  const transferData = encodeFunctionData({
    abi: ERC20ABI.abi,
    functionName: "transfer",
    args: [getAddress(contractAddress), amountInUnits],
  });

  const result = await sendBatchTransaction({
    smartWalletClient,
    calls: [
      { to: getAddress(USDC_ADDRESS), data: approveData },
      { to: getAddress(USDC_ADDRESS), data: transferData },
    ],
    onStatusChange,
  });

  return {
    txHash: result.hash,
    basescanUrl: result.basescanUrl,
  };
};

/**
 * Gets BaseScan URL for a transaction or address.
 *
 * @param {string} hashOrAddress - Transaction hash or contract address
 * @param {"tx" | "address"} type - URL type
 * @returns {string} BaseScan URL
 */
export const getBasescanUrl = (hashOrAddress, type = "address") => {
  return `${BASESCAN_URL}/${type}/${hashOrAddress}`;
};

/**
 * Configuration check - validates all required env vars are set.
 *
 * @returns {{valid: boolean, missing: string[]}}
 */
export const checkConfiguration = () => {
  const required = {
    VITE_USDC_ADDRESS: USDC_ADDRESS,
  };

  const missing = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  return {
    valid: missing.length === 0,
    missing,
    config: {
      chainId: BASE_SEPOLIA_CHAIN_ID,
      usdc: USDC_ADDRESS || "(not set)",
      basescan: BASESCAN_URL,
    },
  };
};

// Legacy compatibility: ensureBaseSepolia is no longer needed with AA
// but kept for backwards compatibility
export const ensureBaseSepolia = async () => {
  // With AA, chain switching is handled by the wallet connector
  return true;
};

export default {
  getUSDCBalance,
  checkUSDCAllowance,
  approveUSDC,
  deployWorkContract,
  approveAndDeployContract,
  fundContract,
  getBasescanUrl,
  checkConfiguration,
  ensureBaseSepolia,
  USDC_DECIMALS,
};
