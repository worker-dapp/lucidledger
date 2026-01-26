/**
 * Account Abstraction Client Module
 *
 * Provides sponsored transactions via Coinbase CDP Paymaster on Base Sepolia.
 * Uses Coinbase Smart Account with Dynamic Labs for authentication.
 *
 * Architecture:
 * - Dynamic Labs handles user authentication (email/phone/wallet)
 * - User's EOA signer is wrapped in a Coinbase Smart Account
 * - Coinbase CDP Paymaster sponsors all gas fees
 * - Permissionless.js handles UserOp bundling and batching
 */

import { createPublicClient, http, encodeFunctionData, parseUnits } from "viem";
import { toAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { createSmartAccountClient } from "permissionless";
import { toCoinbaseSmartAccount } from "viem/account-abstraction";
import { createPimlicoClient } from "permissionless/clients/pimlico";

// Coinbase Smart Wallet uses EntryPoint v0.6, not v0.7
// EntryPoint v0.6 address is standard across all EVM chains
const ENTRYPOINT_V06_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";

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
 * Returns the EOA wallet client which will be wrapped in a Coinbase Smart Account.
 *
 * @param {object} primaryWallet - Dynamic Labs primary wallet object
 * @returns {Promise<object>} Wallet client for signing
 */
const getWalletClient = async (primaryWallet) => {
  if (!primaryWallet) {
    throw new Error("No wallet connected");
  }

  // Get the wallet client from Dynamic Labs
  // This returns an EOA wallet client that we'll wrap in a Coinbase Smart Account
  const walletClient = await primaryWallet.getWalletClient();

  if (!walletClient) {
    throw new Error("Failed to get wallet client from Dynamic Labs");
  }

  return walletClient;
};

/**
 * Creates a Pimlico client for bundler and paymaster operations.
 * Uses Coinbase CDP endpoint which handles both bundler and paymaster.
 *
 * @returns {object} Pimlico client with bundler and paymaster actions
 */
const getPimlicoClient = () => {
  if (!BUNDLER_URL) {
    throw new Error("Bundler URL not configured (VITE_BUNDLER_URL)");
  }

  return createPimlicoClient({
    chain,
    // Coinbase CDP bundler URL already includes the API key in the path
    // Don't add x-api-key header as it's not allowed by CORS policy
    transport: http(BUNDLER_URL),
    // Coinbase Smart Wallet uses EntryPoint v0.6
    entryPoint: {
      address: ENTRYPOINT_V06_ADDRESS,
      version: "0.6",
    },
  });
};

/**
 * Creates a LocalAccount-compatible owner from a wallet client.
 * This wraps the wallet client's signing methods so it can be used as a smart account owner.
 *
 * @param {object} walletClient - Viem wallet client
 * @returns {object} LocalAccount-compatible owner
 */
const createOwnerFromWalletClient = (walletClient) => {
  // toCoinbaseSmartAccount expects a LocalAccount with signing methods
  // walletClient.account is just an address representation, so we need to wrap it
  return toAccount({
    address: walletClient.account.address,

    // Sign raw bytes (required for UserOperation signing)
    // This is called when signing the UserOperation hash
    async sign({ hash }) {
      return walletClient.signMessage({
        account: walletClient.account,
        message: { raw: hash },
      });
    },

    async signMessage({ message }) {
      return walletClient.signMessage({ 
        account: walletClient.account,
        message 
      });
    },

    async signTransaction(transaction) {
      return walletClient.signTransaction({ 
        account: walletClient.account,
        ...transaction 
      });
    },

    async signTypedData(typedData) {
      return walletClient.signTypedData({ 
        account: walletClient.account,
        ...typedData 
      });
    },
  });
};

/**
 * Creates a Coinbase Smart Account from an EOA signer.
 * The smart account is a contract wallet that supports batching and is AA-compatible.
 *
 * @param {object} walletClient - Viem wallet client with EOA account
 * @returns {Promise<object>} Coinbase Smart Account
 */
const createCoinbaseSmartAccount = async (walletClient) => {
  // Create a proper LocalAccount owner from the wallet client
  // This wraps the signing methods so toCoinbaseSmartAccount can use them
  const owner = createOwnerFromWalletClient(walletClient);

  // toCoinbaseSmartAccount creates a Coinbase Smart Wallet from an EOA owner
  // This smart account implements encodeCalls and all EIP-4337 methods
  const smartAccount = await toCoinbaseSmartAccount({
    client: publicClient,
    owners: [owner],
  });

  return smartAccount;
};

/**
 * Gets the smart account client for a Dynamic Labs wallet.
 * This wraps the EOA in a Coinbase Smart Account and enables sponsored transactions.
 *
 * Flow:
 * 1. Get EOA wallet client from Dynamic Labs
 * 2. Wrap EOA in Coinbase Smart Account (contract wallet)
 * 3. Create smart account client with CDP paymaster for gas sponsorship
 *
 * @param {object} primaryWallet - Dynamic Labs primary wallet
 * @returns {Promise<object>} Smart account client with batching and sponsorship
 */
export const getSmartAccountClient = async (primaryWallet) => {
  const walletClient = await getWalletClient(primaryWallet);
  const pimlicoClient = getPimlicoClient();

  // Create a Coinbase Smart Account from the EOA signer
  // This is the key fix: we wrap the EOA in a proper SmartAccount
  // that implements encodeCalls, signUserOperation, etc.
  const smartAccount = await createCoinbaseSmartAccount(walletClient);

  // Create the smart account client with bundler and paymaster
  // Note: API key is in the URL path, not headers (CORS doesn't allow x-api-key header)
  const smartAccountClient = createSmartAccountClient({
    account: smartAccount,
    chain,
    bundlerTransport: http(BUNDLER_URL),
    // Use CDP paymaster for gas sponsorship
    paymaster: pimlicoClient,
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
    const pimlicoClient = getPimlicoClient();

    updateStatus(TxSteps.SIGNING_USEROP, "Sign in your wallet...");

    // Send the user operation
    const userOpHash = await smartAccountClient.sendTransaction({
      ...(to ? { to } : {}),
      data,
      value,
    });

    updateStatus(TxSteps.CONFIRMING, "Confirming on-chain...");

    const userOpReceipt = await pimlicoClient.waitForUserOperationReceipt({
      hash: userOpHash,
    });
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
    const pimlicoClient = getPimlicoClient();

    // Coinbase Smart Account always supports batching via encodeCalls
    updateStatus(TxSteps.SIGNING_USEROP, "Sign batch in your wallet...");

    // Send all calls atomically in a single UserOperation
    const userOpHash = await smartAccountClient.sendTransaction({
      calls: calls.map((call) => ({
        to: call.to,
        data: call.data,
        value: call.value || 0n,
      })),
    });

    updateStatus(TxSteps.CONFIRMING, "Confirming on-chain...");

    const userOpReceipt = await pimlicoClient.waitForUserOperationReceipt({
      hash: userOpHash,
    });
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
 * With Coinbase Smart Account, the address is derived from the owner EOA.
 *
 * @param {object} primaryWallet - Dynamic Labs wallet
 * @returns {Promise<string>} Smart wallet address (contract address)
 */
export const getSmartWalletAddress = async (primaryWallet) => {
  if (!primaryWallet) {
    throw new Error("No wallet connected");
  }

  // Create the smart account to get its deterministic address
  const walletClient = await getWalletClient(primaryWallet);
  const smartAccount = await createCoinbaseSmartAccount(walletClient);

  // The smart account address is a contract, not the EOA
  return smartAccount.address;
};

/**
 * Gets the EOA address for the connected wallet.
 * This is the signer's address, not the smart account address.
 *
 * @param {object} primaryWallet - Dynamic Labs wallet
 * @returns {string} EOA address
 */
export const getEOAAddress = (primaryWallet) => {
  if (!primaryWallet) {
    throw new Error("No wallet connected");
  }

  // primaryWallet.address is the EOA address from Dynamic Labs
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
  getEOAAddress,
};
