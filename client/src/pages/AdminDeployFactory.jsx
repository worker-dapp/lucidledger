import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Copy,
  Loader2,
  LogOut,
  Shield,
  XCircle,
} from "lucide-react";
import apiService from "../services/api";
import { getOnChainAdminAddress } from "../contracts/adminUtils";
import { useAuth } from "../hooks/useAuth";

const FACTORY_ADDRESS = import.meta.env.VITE_FACTORY_ADDRESS || "";

const AdminDeployFactory = () => {
  const { user, login, logout, smartWalletAddress } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckComplete, setAdminCheckComplete] = useState(false);
  const [onChainAdmin, setOnChainAdmin] = useState(null);
  const [walletMismatch, setWalletMismatch] = useState(false);
  const [copied, setCopied] = useState(false);

  const userEmail = user?.email?.address?.toLowerCase() || "";

  // Admin check
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user && !smartWalletAddress) {
        setAdminCheckComplete(true);
        return;
      }
      try {
        const response = await apiService.getAllMediators();
        if (response.success) setIsAdmin(true);
      } catch (err) {
        if (err.status !== 403) console.error("Error checking admin status:", err);
        setIsAdmin(false);
      } finally {
        setAdminCheckComplete(true);
      }
    };
    checkAdminStatus();
  }, [user, smartWalletAddress]);

  // Fetch on-chain admin
  useEffect(() => {
    const fetchOnChainAdmin = async () => {
      const admin = await getOnChainAdminAddress();
      setOnChainAdmin(admin);
    };
    fetchOnChainAdmin();
  }, []);

  // Wallet mismatch detection
  useEffect(() => {
    if (onChainAdmin && smartWalletAddress) {
      setWalletMismatch(onChainAdmin.toLowerCase() !== smartWalletAddress.toLowerCase());
    } else {
      setWalletMismatch(false);
    }
  }, [onChainAdmin, smartWalletAddress]);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!adminCheckComplete) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="h-6 w-6 animate-spin" />
          Checking authorization...
        </div>
      </div>
    );
  }

  if (!user && !smartWalletAddress) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-md text-center">
          <Shield className="h-12 w-12 text-blue-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-800 mb-2">Administrator Login</h1>
          <p className="text-gray-600 mb-6">Sign in to deploy a new factory contract.</p>
          <button
            onClick={login}
            className="px-4 py-2 bg-[#0D3B66] text-white rounded-lg hover:bg-[#0a2d4d] transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-red-200 p-8 max-w-md text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">This page is only accessible to platform administrators.</p>
          <div className="bg-gray-50 rounded-lg p-3 text-sm">
            <p className="text-gray-500 mb-1">Your email:</p>
            <p className="font-mono text-xs text-gray-700 break-all">{userEmail || "Not available"}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/admin" className="text-gray-400 hover:text-gray-600 transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <Shield className="h-8 w-8 text-[#0D3B66]" />
              <div>
                <h1 className="text-xl font-semibold text-[#0D3B66]">Deploy Factory</h1>
                <p className="text-sm text-gray-500">Deploy a new WorkContractFactory contract</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Wallet Mismatch Warning */}
      {walletMismatch && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="container mx-auto px-6 py-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">Wallet Mismatch Detected</p>
                <p className="text-sm text-amber-700 mt-1">
                  Your wallet does not match the current on-chain factory admin.
                  Deploying a new factory will set your current wallet as admin.
                </p>
                <div className="mt-2 text-xs font-mono">
                  <p className="text-amber-600">Connected: {smartWalletAddress}</p>
                  <p className="text-amber-600">Current factory admin: {onChainAdmin}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="container mx-auto px-6 py-8 max-w-2xl">
        {/* Current Configuration */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-[#0D3B66] mb-4">Current Configuration</h2>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-gray-500">Factory Address (VITE_FACTORY_ADDRESS)</p>
              <p className="font-mono text-xs text-gray-700 break-all">
                {FACTORY_ADDRESS || "Not configured"}
              </p>
            </div>
            <div>
              <p className="text-gray-500">On-Chain Admin</p>
              <p className="font-mono text-xs text-gray-700 break-all">
                {onChainAdmin || "Unable to read"}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Your Smart Wallet</p>
              <p className="font-mono text-xs text-gray-700 break-all">
                {smartWalletAddress || "Not connected"}
              </p>
            </div>
          </div>
        </div>

        {/* Deploy Instructions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-[#0D3B66] mb-2">Deploy New Factory</h2>
          <p className="text-sm text-gray-600 mb-4">
            Factory deployment requires running a Hardhat script from the command line.
            Your smart wallet address will be set as the factory admin.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-xs text-gray-500 mb-2">1. Copy your smart wallet address:</p>
            <div className="flex items-center gap-2">
              <code className="bg-white px-3 py-1.5 rounded border border-gray-200 text-xs break-all flex-1 font-mono">
                {smartWalletAddress || "Not connected"}
              </code>
              {smartWalletAddress && (
                <button
                  onClick={() => handleCopy(smartWalletAddress)}
                  className="px-2 py-1.5 bg-white border border-gray-200 rounded hover:bg-gray-100 transition-colors"
                  title="Copy address"
                >
                  {copied ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4 text-gray-600" />}
                </button>
              )}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-xs text-gray-500 mb-2">2. Set up <code>contracts/.env</code>:</p>
            <pre className="bg-gray-800 text-green-400 text-xs p-3 rounded overflow-x-auto">
{`PRIVATE_KEY=your_deployer_private_key
ADMIN_ADDRESS=${smartWalletAddress || "0xYOUR_SMART_WALLET"}`}
            </pre>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-xs text-gray-500 mb-2">3. Run deployment:</p>
            <pre className="bg-gray-800 text-green-400 text-xs p-3 rounded overflow-x-auto">
{`cd contracts
npx hardhat run scripts/deployFactory.js --network baseSepolia`}
            </pre>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-2">4. Update <code>client/.env</code> with the new factory address, then restart.</p>
          </div>

          <p className="text-xs text-gray-500 mt-4">
            See <code>docs/DEPLOYING_FACTORY.md</code> for full instructions.
          </p>
        </div>
      </main>
    </div>
  );
};

export default AdminDeployFactory;
