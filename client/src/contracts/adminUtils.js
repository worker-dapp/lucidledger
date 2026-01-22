/**
 * Admin Utilities
 *
 * Provides functions to read and verify admin status from the on-chain
 * WorkContractFactory contract. Used for wallet mismatch detection.
 */

import { getAddress } from 'viem';
import { publicClient } from './aaClient';
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

export default {
  getOnChainAdminAddress,
  isOnChainAdmin,
};
