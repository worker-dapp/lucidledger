/**
 * Work Contract Interactions Module
 *
 * Provides functions to interact with deployed ManualWorkContracts
 * using Account Abstraction for gas-free transactions.
 */

import { encodeFunctionData, getAddress, formatUnits } from "viem";
import ManualWorkContractABI from "./ManualWorkContract.json";
import {
  publicClient,
  sendSponsoredTransaction,
  TxSteps,
  parseAAError,
  getSmartWalletAddress,
} from "./aaClient";
import { getBasescanUrl } from "./deployWorkContract";

// Contract state enum (matches Solidity)
export const ContractState = {
  Funded: 0,
  Completed: 1,
  Disputed: 2,
  Refunded: 3,
};

// Human-readable state names
export const StateNames = {
  [ContractState.Funded]: "Funded",
  [ContractState.Completed]: "Completed",
  [ContractState.Disputed]: "Disputed",
  [ContractState.Refunded]: "Refunded",
};

// USDC has 6 decimals
const USDC_DECIMALS = 6;

/**
 * Gets the current state of a work contract.
 * Uses publicClient for read-only operations.
 *
 * @param {string} contractAddress - Deployed contract address
 * @returns {Promise<{
 *   employer: string,
 *   worker: string,
 *   mediator: string,
 *   paymentAmount: string,
 *   jobId: number,
 *   state: number,
 *   stateName: string,
 *   disputeReason: string,
 *   balance: string
 * }>}
 */
export const getContractState = async (contractAddress) => {
  const address = getAddress(contractAddress);

  const [details, balance] = await Promise.all([
    publicClient.readContract({
      address,
      abi: ManualWorkContractABI.abi,
      functionName: "getDetails",
    }),
    publicClient.readContract({
      address,
      abi: ManualWorkContractABI.abi,
      functionName: "getBalance",
    }),
  ]);

  const [employer, worker, mediator, paymentAmount, jobId, state, disputeReason] = details;

  return {
    employer,
    worker,
    mediator,
    paymentAmount: formatUnits(paymentAmount, USDC_DECIMALS),
    paymentAmountRaw: paymentAmount,
    jobId: Number(jobId),
    state: Number(state),
    stateName: StateNames[state] || "Unknown",
    disputeReason,
    balance: formatUnits(balance, USDC_DECIMALS),
    balanceRaw: balance,
  };
};

/**
 * Employer approves work and releases payment to worker.
 * Uses AA for gas-free transaction.
 *
 * @param {object} params.user - Privy user
 * @param {object} params.smartWalletClient - Privy smart wallet client
 * @param {string} contractAddress - Deployed contract address
 * @param {function} [onStatusChange] - Status callback
 * @returns {Promise<{txHash: string, basescanUrl: string}>}
 */
export const approveAndPay = async ({
  user,
  smartWalletClient,
  contractAddress,
  onStatusChange,
}) => {
  const address = getAddress(contractAddress);

  const updateStatus = (step, message) => {
    if (onStatusChange) {
      onStatusChange({ step, message });
    }
  };

  try {
    updateStatus(TxSteps.PREPARING_USEROP, "Getting smart account address...");
    // Use smart account address for permission checks (this is what the contract sees as msg.sender)
    const signerAddress = getSmartWalletAddress(user);
    if (!signerAddress) {
      throw new Error("Smart wallet not connected");
    }

    updateStatus(TxSteps.PREPARING_USEROP, "Verifying permissions...");

    // Verify caller is employer
    const employer = await publicClient.readContract({
      address,
      abi: ManualWorkContractABI.abi,
      functionName: "employer",
    });

    if (signerAddress.toLowerCase() !== employer.toLowerCase()) {
      throw new Error("Only the employer can approve and pay");
    }

    // Check state
    const state = await publicClient.readContract({
      address,
      abi: ManualWorkContractABI.abi,
      functionName: "state",
    });

    if (Number(state) !== ContractState.Funded) {
      throw new Error(`Cannot approve: contract is in ${StateNames[state]} state`);
    }

    updateStatus(TxSteps.PREPARING_USEROP, "Preparing approval...");

    // Encode the approveAndPay function call
    const data = encodeFunctionData({
      abi: ManualWorkContractABI.abi,
      functionName: "approveAndPay",
      args: [],
    });

    // Send sponsored transaction
    const result = await sendSponsoredTransaction({
      smartWalletClient,
      to: address,
      data,
      onStatusChange,
    });

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
 * Either employer or worker can raise a dispute.
 * Uses AA for gas-free transaction.
 *
 * @param {object} params.user - Privy user
 * @param {object} params.smartWalletClient - Privy smart wallet client
 * @param {string} contractAddress - Deployed contract address
 * @param {string} reason - Description of the dispute
 * @param {function} [onStatusChange] - Status callback
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
    if (onStatusChange) {
      onStatusChange({ step, message });
    }
  };

  try {
    updateStatus(TxSteps.PREPARING_USEROP, "Getting smart account address...");
    // Use smart account address for permission checks (this is what the contract sees as msg.sender)
    const signerAddress = getSmartWalletAddress(user);
    if (!signerAddress) {
      throw new Error("Smart wallet not connected");
    }

    updateStatus(TxSteps.PREPARING_USEROP, "Verifying permissions...");

    // Verify caller is employer or worker
    const [employer, worker, state] = await Promise.all([
      publicClient.readContract({
        address,
        abi: ManualWorkContractABI.abi,
        functionName: "employer",
      }),
      publicClient.readContract({
        address,
        abi: ManualWorkContractABI.abi,
        functionName: "worker",
      }),
      publicClient.readContract({
        address,
        abi: ManualWorkContractABI.abi,
        functionName: "state",
      }),
    ]);

    const isEmployer = signerAddress.toLowerCase() === employer.toLowerCase();
    const isWorker = signerAddress.toLowerCase() === worker.toLowerCase();

    if (!isEmployer && !isWorker) {
      throw new Error("Only the employer or worker can raise a dispute");
    }

    if (Number(state) !== ContractState.Funded) {
      throw new Error(`Cannot dispute: contract is in ${StateNames[state]} state`);
    }

    updateStatus(TxSteps.PREPARING_USEROP, "Preparing dispute...");

    // Encode the raiseDispute function call
    const data = encodeFunctionData({
      abi: ManualWorkContractABI.abi,
      functionName: "raiseDispute",
      args: [reason.trim()],
    });

    // Send sponsored transaction
    const result = await sendSponsoredTransaction({
      smartWalletClient,
      to: address,
      data,
      onStatusChange,
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
 * ONLY the designated mediator can call this function.
 * Uses AA for gas-free transaction.
 *
 * @param {object} params.user - Privy user
 * @param {object} params.smartWalletClient - Privy smart wallet client
 * @param {string} contractAddress - Deployed contract address
 * @param {boolean} payWorker - True to pay worker, false to refund employer
 * @param {function} [onStatusChange] - Status callback
 * @returns {Promise<{txHash: string, basescanUrl: string, recipient: string, paidWorker: boolean}>}
 */
export const resolveDispute = async ({
  user,
  smartWalletClient,
  contractAddress,
  payWorker,
  onStatusChange,
}) => {
  const address = getAddress(contractAddress);

  const updateStatus = (step, message) => {
    if (onStatusChange) {
      onStatusChange({ step, message });
    }
  };

  try {
    updateStatus(TxSteps.PREPARING_USEROP, "Getting smart account address...");
    // Use smart account address for permission checks (this is what the contract sees as msg.sender)
    const signerAddress = getSmartWalletAddress(user);
    if (!signerAddress) {
      throw new Error("Smart wallet not connected");
    }

    updateStatus(TxSteps.PREPARING_USEROP, "Verifying mediator permissions...");

    // Verify caller is mediator and contract is in Disputed state
    const [mediator, state, employer, worker] = await Promise.all([
      publicClient.readContract({
        address,
        abi: ManualWorkContractABI.abi,
        functionName: "mediator",
      }),
      publicClient.readContract({
        address,
        abi: ManualWorkContractABI.abi,
        functionName: "state",
      }),
      publicClient.readContract({
        address,
        abi: ManualWorkContractABI.abi,
        functionName: "employer",
      }),
      publicClient.readContract({
        address,
        abi: ManualWorkContractABI.abi,
        functionName: "worker",
      }),
    ]);

    if (mediator.toLowerCase() === "0x0000000000000000000000000000000000000000") {
      throw new Error("Mediator has not been assigned to this contract");
    }

    if (signerAddress.toLowerCase() !== mediator.toLowerCase()) {
      throw new Error("Only the mediator can resolve disputes");
    }

    if (Number(state) !== ContractState.Disputed) {
      throw new Error(`Cannot resolve: contract is in ${StateNames[state]} state, expected Disputed`);
    }

    updateStatus(TxSteps.PREPARING_USEROP, "Preparing resolution...");

    // Encode the resolveDispute function call
    const data = encodeFunctionData({
      abi: ManualWorkContractABI.abi,
      functionName: "resolveDispute",
      args: [payWorker],
    });

    // Send sponsored transaction
    const result = await sendSponsoredTransaction({
      smartWalletClient,
      to: address,
      data,
      onStatusChange,
    });

    return {
      txHash: result.hash,
      basescanUrl: getBasescanUrl(result.hash, "tx"),
      blockNumber: result.receipt.blockNumber,
      recipient: payWorker ? worker : employer,
      paidWorker: payWorker,
    };
  } catch (error) {
    updateStatus(TxSteps.ERROR, parseAAError(error));
    throw error;
  }
};

/**
 * Admin assigns mediator to a disputed contract.
 * ONLY the platform admin can call this function.
 *
 * @param {object} params.smartWalletClient - Privy smart wallet client
 * @param {string} contractAddress - Deployed contract address
 * @param {string} mediatorAddress - Mediator wallet address
 * @param {function} [onStatusChange] - Status callback
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
    if (onStatusChange) {
      onStatusChange({ step, message });
    }
  };

  try {
    updateStatus(TxSteps.PREPARING_USEROP, "Preparing mediator assignment...");

    const data = encodeFunctionData({
      abi: ManualWorkContractABI.abi,
      functionName: "assignMediator",
      args: [mediator],
    });

    const result = await sendSponsoredTransaction({
      smartWalletClient,
      to: address,
      data,
      onStatusChange,
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
 * Checks if the current wallet can perform actions on a contract.
 *
 * @param {string} contractAddress - Deployed contract address
 * @param {string} signerAddress - Address to check permissions for
 * @returns {Promise<{
 *   isEmployer: boolean,
 *   isWorker: boolean,
 *   isMediator: boolean,
 *   canApprove: boolean,
 *   canDispute: boolean,
 *   canResolve: boolean
 * }>}
 */
export const checkPermissions = async (contractAddress, signerAddress) => {
  const address = getAddress(contractAddress);

  const [employer, worker, mediator, state] = await Promise.all([
    publicClient.readContract({
      address,
      abi: ManualWorkContractABI.abi,
      functionName: "employer",
    }),
    publicClient.readContract({
      address,
      abi: ManualWorkContractABI.abi,
      functionName: "worker",
    }),
    publicClient.readContract({
      address,
      abi: ManualWorkContractABI.abi,
      functionName: "mediator",
    }),
    publicClient.readContract({
      address,
      abi: ManualWorkContractABI.abi,
      functionName: "state",
    }),
  ]);

  const isEmployer = signerAddress.toLowerCase() === employer.toLowerCase();
  const isWorker = signerAddress.toLowerCase() === worker.toLowerCase();
  const isMediator = signerAddress.toLowerCase() === mediator.toLowerCase();

  const isFunded = Number(state) === ContractState.Funded;
  const isDisputed = Number(state) === ContractState.Disputed;

  return {
    isEmployer,
    isWorker,
    isMediator,
    canApprove: isEmployer && isFunded,
    canDispute: (isEmployer || isWorker) && isFunded,
    canResolve: isMediator && isDisputed,
    currentState: Number(state),
    currentStateName: StateNames[state],
  };
};

/**
 * Gets all disputed contracts where the connected wallet is the mediator.
 * This is used by the MediatorResolution page.
 *
 * Note: This requires an indexer or subgraph in production.
 * For MVP, we'll query the database for contract addresses.
 *
 * @param {string[]} contractAddresses - Array of contract addresses to check
 * @param {string} signerAddress - Address of the mediator
 * @returns {Promise<Array<{address: string, details: object}>>}
 */
export const getDisputedContractsForMediator = async (contractAddresses, signerAddress) => {
  const disputedContracts = [];

  for (const contractAddr of contractAddresses) {
    try {
      const address = getAddress(contractAddr);

      const [mediator, state] = await Promise.all([
        publicClient.readContract({
          address,
          abi: ManualWorkContractABI.abi,
          functionName: "mediator",
        }),
        publicClient.readContract({
          address,
          abi: ManualWorkContractABI.abi,
          functionName: "state",
        }),
      ]);

      // Check if this wallet is the mediator and contract is disputed
      if (
        signerAddress.toLowerCase() === mediator.toLowerCase() &&
        Number(state) === ContractState.Disputed
      ) {
        const details = await getContractState(address);
        disputedContracts.push({
          address,
          details,
        });
      }
    } catch (error) {
      console.warn(`Failed to check contract ${contractAddr}:`, error.message);
    }
  }

  return disputedContracts;
};

/**
 * Listen for contract events.
 * Note: This uses polling in viem for browser compatibility.
 *
 * @param {string} contractAddress - Contract to monitor
 * @param {Object} callbacks - Event callbacks
 * @param {Function} [callbacks.onWorkApproved] - Called when work is approved
 * @param {Function} [callbacks.onDisputeRaised] - Called when dispute is raised
 * @param {Function} [callbacks.onDisputeResolved] - Called when dispute is resolved
 * @returns {Function} Cleanup function to stop listening
 */
export const listenToContractEvents = async (contractAddress, callbacks) => {
  const address = getAddress(contractAddress);
  const unwatchFunctions = [];

  if (callbacks.onWorkApproved) {
    const unwatch = publicClient.watchContractEvent({
      address,
      abi: ManualWorkContractABI.abi,
      eventName: "WorkApproved",
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
      address,
      abi: ManualWorkContractABI.abi,
      eventName: "DisputeRaised",
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
      address,
      abi: ManualWorkContractABI.abi,
      eventName: "DisputeResolved",
      onLogs: (logs) => {
        logs.forEach((log) => {
          callbacks.onDisputeResolved({
            recipient: log.args.recipient,
            amount: formatUnits(log.args.amount, USDC_DECIMALS),
            paidWorker: log.args.paidWorker,
          });
        });
      },
    });
    unwatchFunctions.push(unwatch);
  }

  // Return cleanup function
  return () => {
    unwatchFunctions.forEach((unwatch) => unwatch());
  };
};

// Legacy compatibility: ensureBaseSepolia is no longer needed with AA
export const ensureBaseSepolia = async () => {
  return true;
};

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
