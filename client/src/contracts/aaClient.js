/**
 * Account Abstraction Client Module
 *
 * Provides sponsored transactions via Coinbase CDP Paymaster on Base Sepolia.
 * Uses Dynamic Labs Smart Wallet with ZeroDev for account abstraction.
 */

import { createPublicClient, http, encodeFunctionData, parseUnits } from "viem";
import { baseSepolia } from "viem/chains";
import {
  createSmartAccountClient,
  ENTRYPOINT_ADDRESS_V07,
} from "permissionless";
import { createPimlicoBundlerClient, createPimlicoPaymasterClient } from "permissionless/clients/pimlico";

// Configuration from environment variables
const BASE_SEPOLIA_RPC = import.meta.env.VITE_BASE_SEPOLIA_RPC || "https://sepolia.base.org";
const BUNDLER_URL = import.meta.env.VITE_BUNDLER_URL;
const PAYMASTER_URL = import.meta.env.VITE_PAYMASTER_URL;
const CDP_API_KEY = import.meta.env.VITE_CDP_API_KEY_NAME;
const BASESCAN_URL = import.meta.env.VITE_BASESCAN_URL || "https://sepolia.basescan.org";

// Chain configuration for Base Sepolia
const chain = baseSepolia;

/**
 * Public client for read-only operations.
 * No wallet connection required.
 */
export const publicClient = createPublicClient({
  chain,
  transport: http(BASE_SEPOLIA_RPC),
});

/**
 * Transaction step states for UI progress tracking.
 */
export const TxSteps = {
  IDLE: "idle",
  PREPARING_USEROP: "preparing",
  SIGNING_USEROP: "signing",
  SUBMITTING_USEROP: "submitting",
  CONFIRMING: "confirming",
  SUCCESS: "success",
  ERROR: "error",
};

/**
 * UserOp error code messages for user-friendly display.
 */
const USER_OP_ERROR_MESSAGES = {
  AA21: "User operation signature is invalid. Please try signing again.",
  AA25: "Account validation failed. Your wallet may need to be initialized.",
  AA31: "Paymaster sponsorship was rejected. Please try again.",
  AA33: "Transaction expired. Please submit a new transaction.",
  AA40: "Account verification failed. Please reconnect your wallet.",
  AA41: "Paymaster verification failed. Gas sponsorship unavailable.",
};

/**
 * Parses AA error codes from error messages.
 * @param {Error} error - The error object
 * @returns {string} User-friendly error message
 */
export const parseAAError = (error) => {
  const message = error?.message || error?.toString() || "Unknown error";

  // Check for known AA error codes
  for (const [code, userMessage] of Object.entries(USER_OP_ERROR_MESSAGES)) {
    if (message.includes(code)) {
      return userMessage;
    }
  }

  // Check for common error patterns
  if (message.includes("insufficient funds")) {
    return "Insufficient funds in your account.";
  }
  if (message.includes("user rejected") || message.includes("User rejected")) {
    return "Transaction was rejected in your wallet.";
  }
  if (message.includes("gas")) {
    return "Gas estimation failed. The transaction may revert.";
  }

  return message;
};

/**
 * Checks if AA is properly configured.
 * @returns {{ valid: boolean, missing: string[] }}
 */
export const checkAAConfiguration = () => {
  const required = {
    VITE_BUNDLER_URL: BUNDLER_URL,
    VITE_PAYMASTER_URL: PAYMASTER_URL,
    VITE_CDP_API_KEY_NAME: CDP_API_KEY,
  };

  const missing = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  return {
    valid: missing.length === 0,
    missing,
    config: {
      chain: chain.name,
      chainId: chain.id,
      bundlerConfigured: !!BUNDLER_URL,
      paymasterConfigured: !!PAYMASTER_URL,
      cdpKeyConfigured: !!CDP_API_KEY,
    },
  };
};

/**
 * Gets a wallet client from Dynamic Labs' primary wallet.
 * The wallet should already be a smart wallet when using ZeroDevSmartWalletConnectors.
 *
 * @param {object} primaryWallet - Dynamic Labs primary wallet object
 * @returns {Promise<object>} Wallet client for signing
 */
const getWalletClient = async (primaryWallet) => {
  if (!primaryWallet) {
    throw new Error("No wallet connected");
  }

  // Get the wallet client from Dynamic Labs
  // Dynamic Labs provides a getWalletClient method on the primary wallet
  const walletClient = await primaryWallet.getWalletClient();

  if (!walletClient) {
    throw new Error("Failed to get wallet client from Dynamic Labs");
  }

  return walletClient;
};

/**
 * Creates a bundler client for submitting UserOperations.
 * Uses Coinbase CDP bundler endpoint.
 *
 * @returns {object} Bundler client
 */
const getBundlerClient = () => {
  if (!BUNDLER_URL) {
    throw new Error("Bundler URL not configured (VITE_BUNDLER_URL)");
  }

  return createPimlicoBundlerClient({
    chain,
    transport: http(BUNDLER_URL, {
      fetchOptions: {
        headers: CDP_API_KEY ? { "x-api-key": CDP_API_KEY } : {},
      },
    }),
    entryPoint: ENTRYPOINT_ADDRESS_V07,
  });
};

/**
 * Creates a paymaster client for gas sponsorship.
 * Uses Coinbase CDP paymaster endpoint.
 *
 * @returns {object} Paymaster client
 */
const getPaymasterClient = () => {
  if (!PAYMASTER_URL) {
    throw new Error("Paymaster URL not configured (VITE_PAYMASTER_URL)");
  }

  return createPimlicoPaymasterClient({
    chain,
    transport: http(PAYMASTER_URL, {
      fetchOptions: {
        headers: CDP_API_KEY ? { "x-api-key": CDP_API_KEY } : {},
      },
    }),
    entryPoint: ENTRYPOINT_ADDRESS_V07,
  });
};

/**
 * Gets the smart account client for a Dynamic Labs wallet.
 * This enables sponsored transactions via the CDP paymaster.
 *
 * @param {object} primaryWallet - Dynamic Labs primary wallet
 * @returns {Promise<object>} Smart account client
 */
export const getSmartAccountClient = async (primaryWallet) => {
  const walletClient = await getWalletClient(primaryWallet);
  const bundlerClient = getBundlerClient();
  const paymasterClient = getPaymasterClient();

  // The wallet from Dynamic Labs with ZeroDev should already be a smart account
  // We just need to wrap it with the paymaster for sponsorship
  const smartAccountClient = createSmartAccountClient({
    account: walletClient.account,
    chain,
    bundlerTransport: http(BUNDLER_URL, {
      fetchOptions: {
        headers: CDP_API_KEY ? { "x-api-key": CDP_API_KEY } : {},
      },
    }),
    middleware: {
      // Use CDP paymaster for gas sponsorship
      sponsorUserOperation: async ({ userOperation }) => {
        const sponsorResult = await paymasterClient.sponsorUserOperation({
          userOperation,
        });
        return sponsorResult;
      },
    },
    entryPoint: ENTRYPOINT_ADDRESS_V07,
  });

  return smartAccountClient;
};

/**
 * Sends a single sponsored transaction.
 * Gas fees are paid by the CDP paymaster - user pays nothing.
 *
 * @param {object} params - Transaction parameters
 * @param {object} params.primaryWallet - Dynamic Labs wallet
 * @param {string} [params.to] - Destination address (omit for contract deployment)
 * @param {string} params.data - Encoded function data (from encodeFunctionData)
 * @param {bigint} [params.value] - ETH value to send (default 0)
 * @param {function} [params.onStatusChange] - Callback for status updates
 * @returns {Promise<{ hash: string, userOpHash: string, receipt: object }>}
 */
export const sendSponsoredTransaction = async ({
  primaryWallet,
  to,
  data,
  value = 0n,
  onStatusChange,
}) => {
  const updateStatus = (step, message) => {
    if (onStatusChange) {
      onStatusChange({ step, message });
    }
  };

  try {
    updateStatus(TxSteps.PREPARING_USEROP, "Preparing transaction...");

    // Check configuration
    const config = checkAAConfiguration();
    if (!config.valid) {
      throw new Error(`Missing AA configuration: ${config.missing.join(", ")}`);
    }

    const smartAccountClient = await getSmartAccountClient(primaryWallet);
    const bundlerClient = getBundlerClient();

    updateStatus(TxSteps.SIGNING_USEROP, "Sign in your wallet...");

    // Send the user operation
    const userOpHash = await smartAccountClient.sendTransaction({
      ...(to ? { to } : {}),
      data,
      value,
    });

    updateStatus(TxSteps.CONFIRMING, "Confirming on-chain...");

    const waitForUserOpReceipt =
      smartAccountClient.waitForUserOperationReceipt ||
      bundlerClient.waitForUserOperationReceipt;
    if (!waitForUserOpReceipt) {
      throw new Error("Bundler client does not support waitForUserOperationReceipt");
    }
    const userOpReceipt = await waitForUserOpReceipt({ hash: userOpHash });
    const txHash = userOpReceipt?.receipt?.transactionHash;

    updateStatus(TxSteps.SUCCESS, "Transaction confirmed!");

    return {
      hash: txHash || userOpHash,
      userOpHash,
      receipt: userOpReceipt?.receipt || userOpReceipt,
      basescanUrl: `${BASESCAN_URL}/tx/${txHash || userOpHash}`,
    };
  } catch (error) {
    updateStatus(TxSteps.ERROR, parseAAError(error));
    throw error;
  }
};

/**
 * Sends a batch of transactions in a single UserOperation.
 * All transactions are executed atomically - all succeed or all fail.
 * Gas is sponsored by the CDP paymaster.
 *
 * @param {object} params - Batch parameters
 * @param {object} params.primaryWallet - Dynamic Labs wallet
 * @param {Array<{ to: string, data: string, value?: bigint }>} params.calls - Array of calls
 * @param {function} [params.onStatusChange] - Callback for status updates
 * @returns {Promise<{ hash: string, userOpHash: string, receipt: object }>}
 */
export const sendBatchTransaction = async ({
  primaryWallet,
  calls,
  onStatusChange,
}) => {
  const updateStatus = (step, message) => {
    if (onStatusChange) {
      onStatusChange({ step, message });
    }
  };

  try {
    updateStatus(TxSteps.PREPARING_USEROP, `Preparing ${calls.length} transactions...`);

    const config = checkAAConfiguration();
    if (!config.valid) {
      throw new Error(`Missing AA configuration: ${config.missing.join(", ")}`);
    }

    const smartAccountClient = await getSmartAccountClient(primaryWallet);
    const bundlerClient = getBundlerClient();

    updateStatus(TxSteps.SIGNING_USEROP, "Sign batch in your wallet...");

    // Smart account clients support batch transactions
    const userOpHash = await smartAccountClient.sendTransactions({
      transactions: calls.map((call) => ({
        to: call.to,
        data: call.data,
        value: call.value || 0n,
      })),
    });

    updateStatus(TxSteps.CONFIRMING, "Confirming on-chain...");

    const waitForUserOpReceipt =
      smartAccountClient.waitForUserOperationReceipt ||
      bundlerClient.waitForUserOperationReceipt;
    if (!waitForUserOpReceipt) {
      throw new Error("Bundler client does not support waitForUserOperationReceipt");
    }
    const userOpReceipt = await waitForUserOpReceipt({ hash: userOpHash });
    const txHash = userOpReceipt?.receipt?.transactionHash;

    updateStatus(TxSteps.SUCCESS, "Batch confirmed!");

    return {
      hash: txHash || userOpHash,
      userOpHash,
      receipt: userOpReceipt?.receipt || userOpReceipt,
      basescanUrl: `${BASESCAN_URL}/tx/${txHash || userOpHash}`,
    };
  } catch (error) {
    updateStatus(TxSteps.ERROR, parseAAError(error));
    throw error;
  }
};

/**
 * Helper to encode ERC20 approve function call.
 *
 * @param {string} spender - Address to approve
 * @param {string|number} amount - Amount in token units (e.g., USDC has 6 decimals)
 * @param {number} [decimals=6] - Token decimals (USDC = 6)
 * @returns {string} Encoded function data
 */
export const encodeApproveData = (spender, amount, decimals = 6) => {
  return encodeFunctionData({
    abi: [
      {
        name: "approve",
        type: "function",
        inputs: [
          { name: "spender", type: "address" },
          { name: "amount", type: "uint256" },
        ],
        outputs: [{ type: "bool" }],
      },
    ],
    functionName: "approve",
    args: [spender, parseUnits(amount.toString(), decimals)],
  });
};

/**
 * Helper to check if an address is a smart contract.
 * Useful for verifying smart wallet deployment.
 *
 * @param {string} address - Address to check
 * @returns {Promise<boolean>} True if address is a contract
 */
export const isContract = async (address) => {
  const code = await publicClient.getBytecode({ address });
  return code !== undefined && code !== "0x";
};

/**
 * Gets the smart wallet address for the connected wallet.
 * With AA, the user's address is a smart contract, not an EOA.
 *
 * @param {object} primaryWallet - Dynamic Labs wallet
 * @returns {Promise<string>} Smart wallet address
 */
export const getSmartWalletAddress = async (primaryWallet) => {
  if (!primaryWallet) {
    throw new Error("No wallet connected");
  }

  // With ZeroDev connectors, primaryWallet.address is already the smart wallet
  return primaryWallet.address;
};

// Export viem utilities for convenience
export { encodeFunctionData, parseUnits } from "viem";

export default {
  publicClient,
  TxSteps,
  parseAAError,
  checkAAConfiguration,
  getSmartAccountClient,
  sendSponsoredTransaction,
  sendBatchTransaction,
  encodeApproveData,
  isContract,
  getSmartWalletAddress,
};
