import React, { useState, useEffect, useRef } from 'react';
import { getUSDCBalance } from '../contracts/deployViaFactory';
import { useAuth } from '../hooks/useAuth';

/**
 * SmartWalletInfo Component
 * 
 * Displays the user's Coinbase Smart Account address and USDC balance.
 * This is the account that holds funds and sends transactions on-chain.
 * Replaces the legacy wallet widget which showed EOA address and ETH balance.
 */
const SmartWalletInfo = ({ compact = false }) => {
  const { user, smartWalletAddress } = useAuth();
  const [usdcBalance, setUsdcBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(null);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch smart wallet address and balance
  useEffect(() => {
    const fetchWalletInfo = async () => {
      if (!smartWalletAddress) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Get USDC balance
        try {
          const balance = await getUSDCBalance(smartWalletAddress);
          setUsdcBalance(balance.formatted);
        } catch (balanceErr) {
          // USDC balance might fail if not configured - that's OK
          console.warn('Could not fetch USDC balance:', balanceErr.message);
          setUsdcBalance('--');
        }
      } catch (err) {
        console.error('Error fetching smart wallet info:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWalletInfo();
  }, [smartWalletAddress]);

  // Refresh balance periodically
  useEffect(() => {
    if (!smartWalletAddress) return;

    const refreshBalance = async () => {
      try {
        const balance = await getUSDCBalance(smartWalletAddress);
        setUsdcBalance(balance.formatted);
      } catch (err) {
        // Silent fail for refresh
      }
    };

    const interval = setInterval(refreshBalance, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [smartWalletAddress]);

  const copyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback(label);
      setTimeout(() => setCopyFeedback(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const truncateAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getBasescanUrl = (address) => {
    const basescanBase = import.meta.env.VITE_BASESCAN_URL || 'https://sepolia.basescan.org';
    return `${basescanBase}/address/${address}`;
  };

  if (!smartWalletAddress || !user) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-[#1a4a7a] rounded-lg">
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        <span className="text-white text-sm">Loading wallet...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-red-900/50 rounded-lg">
        <span className="text-red-300 text-sm">⚠️ Wallet error</span>
      </div>
    );
  }

  // Compact mode - just show balance and truncated address
  if (compact) {
    return (
      <div 
        className="flex items-center gap-2 px-3 py-2 bg-[#1a4a7a] rounded-lg cursor-pointer hover:bg-[#2a5a8a] transition-colors"
        onClick={() => copyToClipboard(smartWalletAddress, 'address')}
        title={`Smart Wallet: ${smartWalletAddress}\nClick to copy`}
      >
        <span className="text-[#22c55e] font-semibold">${usdcBalance}</span>
        <span className="text-white/70 text-sm">{truncateAddress(smartWalletAddress)}</span>
        {copyFeedback === 'address' && (
          <span className="text-green-400 text-xs">✓</span>
        )}
      </div>
    );
  }

  // Full dropdown mode
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-[#1a4a7a] rounded-lg hover:bg-[#2a5a8a] transition-colors"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-[#0052FF] to-[#3b82f6] rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold">💳</span>
        </div>
        <div className="text-left">
          <div className="text-[#22c55e] font-semibold text-sm">${usdcBalance} USDC</div>
          <div className="text-white/70 text-xs">{truncateAddress(smartWalletAddress)}</div>
        </div>
        <svg 
          className={`w-4 h-4 text-white/70 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-[#0D3B66] border border-[#1a4a7a] rounded-lg shadow-xl z-50">
          <div className="p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2 pb-3 border-b border-[#1a4a7a]">
              <div className="w-10 h-10 bg-gradient-to-br from-[#0052FF] to-[#3b82f6] rounded-full flex items-center justify-center">
                <span className="text-white text-lg">💳</span>
              </div>
              <div>
                <div className="text-white font-semibold">Smart Wallet</div>
                <div className="text-white/60 text-xs">Coinbase Smart Account</div>
              </div>
            </div>

            {/* Smart Account Address */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-white/60 text-sm">Smart Account</span>
                <span className="text-xs text-[#22c55e] bg-[#22c55e]/20 px-2 py-0.5 rounded">
                  Sends Transactions
                </span>
              </div>
              <div className="flex items-center gap-2 bg-[#1a4a7a] rounded p-2">
                <code className="text-white text-xs flex-1 break-all">{smartWalletAddress}</code>
                <button
                  onClick={() => copyToClipboard(smartWalletAddress, 'smart')}
                  className="text-white/60 hover:text-white p-1"
                  title="Copy address"
                >
                  {copyFeedback === 'smart' ? '✓' : '📋'}
                </button>
                <a
                  href={getBasescanUrl(smartWalletAddress)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/60 hover:text-white p-1"
                  title="View on BaseScan"
                >
                  🔗
                </a>
              </div>
            </div>

            {/* USDC Balance */}
            <div className="bg-[#1a4a7a] rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[#2775CA] rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">$</span>
                  </div>
                  <div>
                    <div className="text-white font-semibold">USDC Balance</div>
                    <div className="text-white/60 text-xs">Base Sepolia</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[#22c55e] font-bold text-lg">${usdcBalance}</div>
                </div>
              </div>
            </div>

            {/* Info Note */}
            <div className="text-xs text-white/50 bg-[#1a4a7a]/50 rounded p-2">
              <span className="text-[#F4D35E]">💡</span> Send USDC to your Smart Account address above to fund contract deployments. Gas fees are sponsored.
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 pt-2 border-t border-[#1a4a7a]">
              <button
                onClick={() => copyToClipboard(smartWalletAddress, 'quick')}
                className="flex-1 text-sm text-white bg-[#1a4a7a] hover:bg-[#2a5a8a] px-3 py-2 rounded transition-colors"
              >
                {copyFeedback === 'quick' ? '✓ Copied!' : '📋 Copy Address'}
              </button>
              <a
                href={getBasescanUrl(smartWalletAddress)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-sm text-center text-white bg-[#1a4a7a] hover:bg-[#2a5a8a] px-3 py-2 rounded transition-colors"
              >
                🔗 View on BaseScan
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartWalletInfo;
