/**
 * Admin Utilities
 *
 * Provides functions to read and verify admin status from the on-chain
 * WorkContractFactory contract. Used for wallet mismatch detection.
 */

import { getAddress, encodeDeployData } from 'viem';
import { publicClient, sendSponsoredTransaction } from './aaClient';
import WorkContractFactoryABI from './WorkContractFactory.json';

const FACTORY_ADDRESS = import.meta.env.VITE_FACTORY_ADDRESS;

/**
 * Reads the admin address from the deployed WorkContractFactory.
 * Returns null if factory address is not configured or read fails.
 *
 * @returns {Promise<string|null>} The on-chain admin address or null
 */
export const getOnChainAdminAddress = async () => {
  if (!FACTORY_ADDRESS) {
    console.warn('VITE_FACTORY_ADDRESS not configured');
    return null;
  }

  try {
    const admin = await publicClient.readContract({
      address: getAddress(FACTORY_ADDRESS),
      abi: WorkContractFactoryABI.abi,
      functionName: 'admin',
    });
    return admin;
  } catch (error) {
    console.error('Failed to read admin from factory:', error);
    return null;
  }
};

/**
 * Checks if the given wallet address matches the on-chain admin.
 *
 * @param {string} walletAddress - The wallet address to check
 * @returns {Promise<boolean>} True if the wallet matches on-chain admin
 */
export const isOnChainAdmin = async (walletAddress) => {
  const onChainAdmin = await getOnChainAdminAddress();
  if (!onChainAdmin || !walletAddress) return false;
  return onChainAdmin.toLowerCase() === walletAddress.toLowerCase();
};

const USDC_ADDRESS = import.meta.env.VITE_USDC_ADDRESS || '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
const BASESCAN_URL = import.meta.env.VITE_BASESCAN_URL || 'https://sepolia.basescan.org';

/**
 * Deploys a new WorkContractFactory via sponsored transaction.
 *
 * @param {Object} params
 * @param {Object} params.smartWalletClient - Privy smart wallet client
 * @param {string} params.adminAddress - Address to set as factory admin
 * @param {Function} [params.onStatusChange] - Status callback
 * @returns {Promise<{contractAddress: string, txHash: string, basescanUrl: string}>}
 */
export const deployFactory = async ({ smartWalletClient, adminAddress, onStatusChange }) => {
  if (!WorkContractFactoryABI.bytecode || WorkContractFactoryABI.bytecode === '0x') {
    throw new Error('Factory bytecode not available. Compile contracts first: cd contracts && npx hardhat compile');
  }

  const deployData = encodeDeployData({
    abi: WorkContractFactoryABI.abi,
    bytecode: WorkContractFactoryABI.bytecode,
    args: [getAddress(USDC_ADDRESS), getAddress(adminAddress)],
  });

  const result = await sendSponsoredTransaction({
    smartWalletClient,
    data: deployData,
    onStatusChange,
  });

  const contractAddress = result.receipt.contractAddress;
  if (!contractAddress) {
    throw new Error('Contract address not found in transaction receipt');
  }

  return {
    contractAddress,
    txHash: result.hash,
    basescanUrl: `${BASESCAN_URL}/address/${contractAddress}`,
  };
};

export default {
  getOnChainAdminAddress,
  isOnChainAdmin,
  deployFactory,
};
