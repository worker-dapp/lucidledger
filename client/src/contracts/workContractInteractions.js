/**
 * Work Contract Interactions Module
 *
 * Provides functions to interact with deployed WorkContract (v2) instances
 * using Account Abstraction for gas-free transactions.
 */

import { encodeFunctionData, getAddress, formatUnits } from "viem";
import WorkContractABI from "./WorkContract.json";
import {
  publicClient,
  sendSponsoredTransaction,
  sendBatchTransaction,
  TxSteps,
  parseAAError,
  getSmartWalletAddress,
  getBasescanUrl,
} from "./aaClient";

const abi = WorkContractABI.abi;

// WorkContract state enum
export const ContractState = {
  Funded: 0,
  Active: 1,
  Completed: 2,
  Disputed: 3,
  Refunded: 4,
  Cancelled: 5,
};

// Human-readable state names
export const StateNames = {
  [ContractState.Funded]: "Funded",
  [ContractState.Active]: "Active",
  [ContractState.Completed]: "Completed",
  [ContractState.Disputed]: "Disputed",
  [ContractState.Refunded]: "Refunded",
  [ContractState.Cancelled]: "Cancelled",
};

// USDC has 6 decimals
const USDC_DECIMALS = 6;

/**
 * Gets the current state of a work contract.
 *
 * @param {string} contractAddress - Deployed contract address
 * @returns {Promise<object>}
 */
export const getContractState = async (contractAddress) => {
  const address = getAddress(contractAddress);

  const [details, balance] = await Promise.all([
    publicClient.readContract({ address, abi, functionName: "getDetails" }),
    publicClient.readContract({ address, abi, functionName: "getBalance" }),
  ]);

  const [employer, worker, mediator, paymentAmount, jobId, state, disputeReason, oracleCount] = details;
  return {
    employer,
    worker,
    mediator,
    paymentAmount: formatUnits(paymentAmount, USDC_DECIMALS),
    paymentAmountRaw: paymentAmount,
    jobId: Number(jobId),
    state: Number(state),
    stateName: StateNames[Number(state)] || "Unknown",
    disputeReason,
    oracleCount: Number(oracleCount),
    balance: formatUnits(balance, USDC_DECIMALS),
    balanceRaw: balance,
  };
};

// Minimal ABI for ManualOracle interactions
const manualOracleAbi = [
  {
    inputs: [{ name: "workContract", type: "address" }],
    name: "verify",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "workContract", type: "address" }],
    name: "isWorkVerified",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
];

const MANUAL_ORACLE_ADDRESS = import.meta.env.VITE_MANUAL_ORACLE_ADDRESS;

/**
 * Employer approves work and releases payment to worker.
 * If oracles are configured and haven't passed, auto-verifies via ManualOracle first.
 * Accepts from Funded or Active state.
 *
 * @param {object} params
 * @returns {Promise<{txHash: string, basescanUrl: string, blockNumber: bigint}>}
 */
export const approveAndPay = async ({
  user,
  smartWalletClient,
  contractAddress,
  onStatusChange,
}) => {
  const address = getAddress(contractAddress);

  const updateStatus = (step, message) => {
    if (onStatusChange) onStatusChange({ step, message });
  };

  try {
    updateStatus(TxSteps.PREPARING_USEROP, "Getting smart account address...");
    const signerAddress = getSmartWalletAddress(user);
    if (!signerAddress) throw new Error("Smart wallet not connected");

    updateStatus(TxSteps.PREPARING_USEROP, "Verifying permissions...");

    const employer = await publicClient.readContract({
      address, abi, functionName: "employer",
    });

    if (signerAddress.toLowerCase() !== employer.toLowerCase()) {
      throw new Error("Only the employer can approve and pay");
    }

    const state = await publicClient.readContract({
      address, abi, functionName: "state",
    });

    const stateNum = Number(state);
    if (stateNum !== ContractState.Funded && stateNum !== ContractState.Active) {
      throw new Error(`Cannot approve: contract is in ${StateNames[stateNum]} state`);
    }

    // Auto-verify via ManualOracle if oracles are configured but haven't passed
    const oraclesPassing = await publicClient.readContract({
      address, abi, functionName: "checkOracles",
    });

    const approveData = encodeFunctionData({
      abi, functionName: "approveAndPay", args: [],
    });

    let result;

    if (!oraclesPassing && MANUAL_ORACLE_ADDRESS) {
      // Batch: oracle verify + approveAndPay in one atomic transaction
      updateStatus(TxSteps.PREPARING_USEROP, "Preparing oracle verification + payment...");

      const verifyData = encodeFunctionData({
        abi: manualOracleAbi,
        functionName: "verify",
        args: [address],
      });

      result = await sendBatchTransaction({
        smartWalletClient,
        calls: [
          { to: getAddress(MANUAL_ORACLE_ADDRESS), data: verifyData },
          { to: address, data: approveData },
        ],
        onStatusChange,
      });
    } else {
      // Oracles already passing (or none configured) — single transaction
      updateStatus(TxSteps.PREPARING_USEROP, "Preparing approval...");

      result = await sendSponsoredTransaction({
        smartWalletClient, to: address, data: approveData, onStatusChange,
      });
    }

    return {
      txHash: result.hash,
      basescanUrl: getBasescanUrl(result.hash, "tx"),
      blockNumber: result.receipt.blockNumber,
    };
  } catch (error) {
    updateStatus(TxSteps.ERROR, parseAAError(error));
    throw error;
  }
};

/**
 * Raises a dispute on a work contract.
 * Either employer or worker can raise from Funded or Active state.
 *
 * @param {object} params
 * @returns {Promise<{txHash: string, basescanUrl: string, raisedBy: string}>}
 */
export const raiseDispute = async ({
  user,
  smartWalletClient,
  contractAddress,
  reason,
  onStatusChange,
}) => {
  if (!reason || reason.trim().length === 0) {
    throw new Error("Dispute reason is required");
  }

  const address = getAddress(contractAddress);

  const updateStatus = (step, message) => {
    if (onStatusChange) onStatusChange({ step, message });
  };

  try {
    updateStatus(TxSteps.PREPARING_USEROP, "Getting smart account address...");
    const signerAddress = getSmartWalletAddress(user);
    if (!signerAddress) throw new Error("Smart wallet not connected");

    updateStatus(TxSteps.PREPARING_USEROP, "Verifying permissions...");

    const [employer, worker, state] = await Promise.all([
      publicClient.readContract({ address, abi, functionName: "employer" }),
      publicClient.readContract({ address, abi, functionName: "worker" }),
      publicClient.readContract({ address, abi, functionName: "state" }),
    ]);

    const isEmployer = signerAddress.toLowerCase() === employer.toLowerCase();
    const isWorker = signerAddress.toLowerCase() === worker.toLowerCase();

    if (!isEmployer && !isWorker) {
      throw new Error("Only the employer or worker can raise a dispute");
    }

    const stateNum = Number(state);
    if (stateNum !== ContractState.Funded && stateNum !== ContractState.Active) {
      throw new Error(`Cannot dispute: contract is in ${StateNames[stateNum]} state`);
    }

    updateStatus(TxSteps.PREPARING_USEROP, "Preparing dispute...");

    const data = encodeFunctionData({
      abi, functionName: "raiseDispute", args: [reason.trim()],
    });

    const result = await sendSponsoredTransaction({
      smartWalletClient, to: address, data, onStatusChange,
    });

    return {
      txHash: result.hash,
      basescanUrl: getBasescanUrl(result.hash, "tx"),
      blockNumber: result.receipt.blockNumber,
      raisedBy: isEmployer ? "employer" : "worker",
    };
  } catch (error) {
    updateStatus(TxSteps.ERROR, parseAAError(error));
    throw error;
  }
};

/**
 * Mediator resolves a dispute.
 * workerPercentage: 0 = full refund to employer, 100 = full pay to worker, 50 = split
 *
 * @param {object} params
 * @returns {Promise<{txHash: string, basescanUrl: string}>}
 */
export const resolveDispute = async ({
  user,
  smartWalletClient,
  contractAddress,
  workerPercentage,
  onStatusChange,
}) => {
  const address = getAddress(contractAddress);

  const updateStatus = (step, message) => {
    if (onStatusChange) onStatusChange({ step, message });
  };

  try {
    updateStatus(TxSteps.PREPARING_USEROP, "Getting smart account address...");
    const signerAddress = getSmartWalletAddress(user);
    if (!signerAddress) throw new Error("Smart wallet not connected");

    updateStatus(TxSteps.PREPARING_USEROP, "Verifying mediator permissions...");

    const [mediator, state, employer, worker] = await Promise.all([
      publicClient.readContract({ address, abi, functionName: "mediator" }),
      publicClient.readContract({ address, abi, functionName: "state" }),
      publicClient.readContract({ address, abi, functionName: "employer" }),
      publicClient.readContract({ address, abi, functionName: "worker" }),
    ]);

    if (mediator.toLowerCase() === "0x0000000000000000000000000000000000000000") {
      throw new Error("Mediator has not been assigned to this contract");
    }

    if (signerAddress.toLowerCase() !== mediator.toLowerCase()) {
      throw new Error("Only the mediator can resolve disputes");
    }

    if (Number(state) !== ContractState.Disputed) {
      throw new Error(`Cannot resolve: contract is in ${StateNames[Number(state)]} state, expected Disputed`);
    }

    updateStatus(TxSteps.PREPARING_USEROP, "Preparing resolution...");

    const data = encodeFunctionData({
      abi, functionName: "resolveDispute", args: [workerPercentage],
    });

    const result = await sendSponsoredTransaction({
      smartWalletClient, to: address, data, onStatusChange,
    });

    return {
      txHash: result.hash,
      basescanUrl: getBasescanUrl(result.hash, "tx"),
      blockNumber: result.receipt.blockNumber,
      recipient: workerPercentage > 0 ? worker : employer,
    };
  } catch (error) {
    updateStatus(TxSteps.ERROR, parseAAError(error));
    throw error;
  }
};

/**
 * Admin assigns mediator to a disputed contract.
 *
 * @param {object} params
 * @returns {Promise<{txHash: string, basescanUrl: string}>}
 */
export const assignMediator = async ({
  smartWalletClient,
  contractAddress,
  mediatorAddress,
  onStatusChange,
}) => {
  const address = getAddress(contractAddress);
  const mediator = getAddress(mediatorAddress);

  const updateStatus = (step, message) => {
    if (onStatusChange) onStatusChange({ step, message });
  };

  try {
    updateStatus(TxSteps.PREPARING_USEROP, "Preparing mediator assignment...");

    const data = encodeFunctionData({
      abi, functionName: "assignMediator", args: [mediator],
    });

    const result = await sendSponsoredTransaction({
      smartWalletClient, to: address, data, onStatusChange,
    });

    return {
      txHash: result.hash,
      basescanUrl: getBasescanUrl(result.hash, "tx"),
    };
  } catch (error) {
    updateStatus(TxSteps.ERROR, parseAAError(error));
    throw error;
  }
};

/**
 * Checks permissions and oracle status for a contract.
 *
 * @param {string} contractAddress
 * @param {string} signerAddress
 * @returns {Promise<object>}
 */
export const checkPermissions = async (contractAddress, signerAddress) => {
  const address = getAddress(contractAddress);

  const [employer, worker, mediator, state, oracleCount, oraclesPassing] = await Promise.all([
    publicClient.readContract({ address, abi, functionName: "employer" }),
    publicClient.readContract({ address, abi, functionName: "worker" }),
    publicClient.readContract({ address, abi, functionName: "mediator" }),
    publicClient.readContract({ address, abi, functionName: "state" }),
    publicClient.readContract({ address, abi, functionName: "getOracleCount" }),
    publicClient.readContract({ address, abi, functionName: "checkOracles" }),
  ]);

  const isEmployer = signerAddress.toLowerCase() === employer.toLowerCase();
  const isWorker = signerAddress.toLowerCase() === worker.toLowerCase();
  const isMediator = signerAddress.toLowerCase() === mediator.toLowerCase();
  const stateNum = Number(state);
  const oCount = Number(oracleCount);

  const isFunded = stateNum === ContractState.Funded;
  const isActive = stateNum === ContractState.Active;
  const isDisputed = stateNum === ContractState.Disputed;

  return {
    isEmployer,
    isWorker,
    isMediator,
    canApprove: isEmployer && (isFunded || isActive),
    canDispute: (isEmployer || isWorker) && (isFunded || isActive),
    canResolve: isMediator && isDisputed,
    oracleCount: oCount,
    oraclesPassing,
    currentState: stateNum,
    currentStateName: StateNames[stateNum] || "Unknown",
  };
};

/**
 * Gets all disputed contracts where the connected wallet is the mediator.
 *
 * @param {string[]} contractAddresses
 * @param {string} signerAddress
 * @returns {Promise<Array<{address: string, details: object}>>}
 */
export const getDisputedContractsForMediator = async (contractAddresses, signerAddress) => {
  const disputedContracts = [];

  for (const contractAddr of contractAddresses) {
    try {
      const address = getAddress(contractAddr);

      const [mediator, state] = await Promise.all([
        publicClient.readContract({ address, abi, functionName: "mediator" }),
        publicClient.readContract({ address, abi, functionName: "state" }),
      ]);

      if (
        signerAddress.toLowerCase() === mediator.toLowerCase() &&
        Number(state) === ContractState.Disputed
      ) {
        const details = await getContractState(address);
        disputedContracts.push({ address, details });
      }
    } catch (error) {
      console.warn(`Failed to check contract ${contractAddr}:`, error.message);
    }
  }

  return disputedContracts;
};

/**
 * Listen for contract events.
 *
 * @param {string} contractAddress
 * @param {Object} callbacks
 * @returns {Function} Cleanup function
 */
export const listenToContractEvents = async (contractAddress, callbacks) => {
  const address = getAddress(contractAddress);
  const unwatchFunctions = [];

  if (callbacks.onWorkApproved) {
    const unwatch = publicClient.watchContractEvent({
      address, abi, eventName: "WorkApproved",
      onLogs: (logs) => {
        logs.forEach((log) => {
          callbacks.onWorkApproved({
            worker: log.args.worker,
            amount: formatUnits(log.args.amount, USDC_DECIMALS),
          });
        });
      },
    });
    unwatchFunctions.push(unwatch);
  }

  if (callbacks.onDisputeRaised) {
    const unwatch = publicClient.watchContractEvent({
      address, abi, eventName: "DisputeRaised",
      onLogs: (logs) => {
        logs.forEach((log) => {
          callbacks.onDisputeRaised({
            raisedBy: log.args.raisedBy,
            reason: log.args.reason,
          });
        });
      },
    });
    unwatchFunctions.push(unwatch);
  }

  if (callbacks.onDisputeResolved) {
    const unwatch = publicClient.watchContractEvent({
      address, abi, eventName: "DisputeResolved",
      onLogs: (logs) => {
        logs.forEach((log) => {
          callbacks.onDisputeResolved({
            mediator: log.args.mediator,
            workerAmount: formatUnits(log.args.workerAmount, USDC_DECIMALS),
            employerAmount: formatUnits(log.args.employerAmount, USDC_DECIMALS),
          });
        });
      },
    });
    unwatchFunctions.push(unwatch);
  }

  return () => {
    unwatchFunctions.forEach((unwatch) => unwatch());
  };
};

// Legacy compatibility
export const ensureBaseSepolia = async () => true;

export default {
  ContractState,
  StateNames,
  getContractState,
  approveAndPay,
  raiseDispute,
  resolveDispute,
  assignMediator,
  checkPermissions,
  getDisputedContractsForMediator,
  listenToContractEvents,
  ensureBaseSepolia,
};
