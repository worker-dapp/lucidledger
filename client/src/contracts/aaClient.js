/**
 * Account Abstraction Client Module
 *
 * Uses Privy Smart Wallets (Coinbase Smart Wallet) for sponsored transactions.
 * Bundler/paymaster are configured in Privy dashboard.
 */

import { createPublicClient, http, encodeFunctionData, parseUnits } from "viem";
import { baseSepolia } from "viem/chains";

const BASE_SEPOLIA_RPC = import.meta.env.VITE_BASE_SEPOLIA_RPC || "https://sepolia.base.org";
const BASESCAN_URL = import.meta.env.VITE_BASESCAN_URL || "https://base-sepolia.blockscout.com";

const chain = baseSepolia;

export const publicClient = createPublicClient({
  chain,
  transport: http(BASE_SEPOLIA_RPC),
});

export const TxSteps = {
  IDLE: "idle",
  PREPARING_USEROP: "preparing",
  SIGNING_USEROP: "signing",
  SUBMITTING_USEROP: "submitting",
  CONFIRMING: "confirming",
  SUCCESS: "success",
  ERROR: "error",
};

const USER_OP_ERROR_MESSAGES = {
  AA21: "User operation signature is invalid. Please try signing again.",
  AA25: "Account validation failed. Your wallet may need to be initialized.",
  AA31: "Paymaster sponsorship was rejected. Please try again.",
  AA33: "Transaction expired. Please submit a new transaction.",
  AA40: "Account verification failed. Please reconnect your wallet.",
  AA41: "Paymaster verification failed. Gas sponsorship unavailable.",
};

export const parseAAError = (error) => {
  const message = error?.message || error?.toString() || "Unknown error";

  for (const [code, userMessage] of Object.entries(USER_OP_ERROR_MESSAGES)) {
    if (message.includes(code)) {
      return userMessage;
    }
  }

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

export const checkAAConfiguration = ({ smartWalletClient } = {}) => {
  const missing = [];
  if (!smartWalletClient) missing.push("SmartWalletClient");

  return {
    valid: missing.length === 0,
    missing,
    config: {
      chain: chain.name,
      chainId: chain.id,
      smartWalletClient: !!smartWalletClient,
    },
  };
};

export const sendSponsoredTransaction = async ({
  smartWalletClient,
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

    const config = checkAAConfiguration({ smartWalletClient });
    if (!config.valid) {
      throw new Error(`Missing AA configuration: ${config.missing.join(", ")}`);
    }

    updateStatus(TxSteps.SIGNING_USEROP, "Sign in your wallet...");

    const txHash = await smartWalletClient.sendTransaction({
      ...(to ? { to } : {}),
      data,
      value,
    });

    updateStatus(TxSteps.CONFIRMING, "Confirming on-chain...");
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

    if (receipt.status === "reverted") {
      throw new Error("Transaction reverted on-chain. The contract call failed.");
    }

    updateStatus(TxSteps.SUCCESS, "Transaction confirmed!");

    return {
      hash: txHash,
      receipt,
      basescanUrl: `${BASESCAN_URL}/tx/${txHash}`,
    };
  } catch (error) {
    updateStatus(TxSteps.ERROR, parseAAError(error));
    throw error;
  }
};

export const sendBatchTransaction = async ({
  smartWalletClient,
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

    const config = checkAAConfiguration({ smartWalletClient });
    if (!config.valid) {
      throw new Error(`Missing AA configuration: ${config.missing.join(", ")}`);
    }

    updateStatus(TxSteps.SIGNING_USEROP, "Sign batch in your wallet...");

    const txHash = await smartWalletClient.sendTransaction({
      calls: calls.map((call) => ({
        to: call.to,
        data: call.data,
        value: call.value || 0n,
      })),
    });

    updateStatus(TxSteps.CONFIRMING, "Confirming on-chain...");
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

    if (receipt.status === "reverted") {
      throw new Error("Transaction reverted on-chain. The batch call failed.");
    }

    updateStatus(TxSteps.SUCCESS, "Batch confirmed!");

    return {
      hash: txHash,
      receipt,
      basescanUrl: `${BASESCAN_URL}/tx/${txHash}`,
    };
  } catch (error) {
    updateStatus(TxSteps.ERROR, parseAAError(error));
    throw error;
  }
};

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

export const isContract = async (address) => {
  const code = await publicClient.getBytecode({ address });
  return code !== undefined && code !== "0x";
};

export const getSmartWalletAddress = (user) => {
  const smartWallet = user?.linkedAccounts?.find((account) => account?.type === "smart_wallet");
  return smartWallet?.address;
};

/**
 * Gets BaseScan URL for a transaction or address.
 */
export const getBasescanUrl = (hashOrAddress, type = "address") => {
  return `${BASESCAN_URL}/${type}/${hashOrAddress}`;
};

export default {
  publicClient,
  TxSteps,
  parseAAError,
  checkAAConfiguration,
  sendSponsoredTransaction,
  sendBatchTransaction,
  encodeApproveData,
  isContract,
  getSmartWalletAddress,
  getBasescanUrl,
};
