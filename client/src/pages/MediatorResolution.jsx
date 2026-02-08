import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Loader2,
  LogOut,
  Scale,
  Shield,
  XCircle,
  Zap,
} from "lucide-react";
import apiService from "../services/api";
import {
  getContractState,
  resolveDispute,
  ContractState,
} from "../contracts/workContractInteractions";
import { TxSteps, parseAAError } from "../contracts/aaClient";
import { useAuth } from "../hooks/useAuth";

const BASESCAN_URL = import.meta.env.VITE_BASESCAN_URL || "https://sepolia.basescan.org";

const MediatorResolution = () => {
  const { user, isAuthenticated, login, logout, smartWalletClient, smartWalletAddress } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [mediatorData, setMediatorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [disputedContracts, setDisputedContracts] = useState([]);
  const [selectedContract, setSelectedContract] = useState(null);
  const [blockchainState, setBlockchainState] = useState(null);
  const [resolving, setResolving] = useState(false);
  const [message, setMessage] = useState("");
  const [txStep, setTxStep] = useState(TxSteps.IDLE);
  const [txMessage, setTxMessage] = useState("");

  const handleTxStatusChange = ({ step, message }) => {
    setTxStep(step);
    setTxMessage(message);
  };

  // Get user's email from Privy
  const userEmail = user?.email?.address?.toLowerCase() || "";

  // Check if user's email is in the mediators whitelist
  useEffect(() => {
    const checkAuthorization = async () => {
      if (!isAuthenticated || !userEmail) {
        setIsAuthorized(false);
        setLoading(false);
        return;
      }

      try {
        const response = await apiService.checkMediator(userEmail);
        if (response.success && response.isMediator) {
          setIsAuthorized(true);
          setMediatorData(response.data);

          // If mediator doesn't have wallet address saved yet, update it
          if (!response.data.wallet_address && smartWalletAddress) {
            try {
              await apiService.updateMediatorWallet(userEmail, smartWalletAddress);
              console.log("Mediator wallet address updated");
            } catch (err) {
              console.error("Failed to update mediator wallet:", err);
            }
          }
        } else {
          setIsAuthorized(false);
        }
      } catch (error) {
        console.error("Error checking mediator status:", error);
        setIsAuthorized(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuthorization();
  }, [isAuthenticated, userEmail, smartWalletAddress]);

  // Fetch disputed contracts assigned to this mediator
  useEffect(() => {
    const fetchDisputedContracts = async () => {
      if (!isAuthorized || !mediatorData?.id) return;

      try {
        // Fetch only disputes assigned to this specific mediator
        const response = await apiService.getDisputedContractsByMediator(mediatorData.id);
        if (response?.data) {
          setDisputedContracts(response.data);
        }
      } catch (error) {
        console.error("Error fetching disputed contracts:", error);
        setDisputedContracts([]);
      }
    };

    fetchDisputedContracts();
  }, [isAuthorized, mediatorData?.id]);

  // Fetch blockchain state for selected contract
  useEffect(() => {
    const fetchBlockchainState = async () => {
      if (!selectedContract?.contract_address) {
        setBlockchainState(null);
        return;
      }

      // Skip blockchain check for mock contracts
      if (selectedContract.contract_address.startsWith("0x000000")) {
        setBlockchainState(null);
        return;
      }

      try {
        const state = await getContractState(selectedContract.contract_address);
        setBlockchainState(state);
      } catch (error) {
        console.error("Error fetching blockchain state:", error);
        setBlockchainState(null);
      }
    };

    fetchBlockchainState();
  }, [selectedContract?.contract_address]);

  const handleResolve = async (payWorker) => {
    if (!selectedContract?.contract_address || !smartWalletClient || !smartWalletAddress) return;

    setResolving(true);
    setMessage("");
    setTxStep(TxSteps.IDLE);

    try {
      // For mock contracts, just update the database
      const isMockContract = selectedContract.contract_address.startsWith("0x000000");
      let txHash = null;

      if (!isMockContract) {
        const result = await resolveDispute({
          user,
          smartWalletClient,
          contractAddress: selectedContract.contract_address,
          payWorker,
          onStatusChange: handleTxStatusChange,
        });
        txHash = result.txHash;
        setMessage(
          `Dispute resolved (gas-free)! ${payWorker ? "Worker" : "Employer"} received the funds. ` +
          `View on BaseScan: ${result.basescanUrl}`
        );
      } else {
        setMessage(
          `Dispute resolved (mock contract)! ${payWorker ? "Worker" : "Employer"} would receive the funds.`
        );
      }

      // Update database status
      await apiService.updateDeployedContract(selectedContract.id, {
        status: payWorker ? "completed" : "terminated",
        verification_status: payWorker ? "verified" : "failed",
      });

      // Record payment transaction so worker earnings update
      if (payWorker) {
        try {
          await apiService.createPaymentTransaction({
            deployed_contract_id: selectedContract.id,
            amount: selectedContract.payment_amount,
            currency: selectedContract.payment_currency || "USDC",
            payment_type: "final",
            status: "completed",
            tx_hash: txHash,
            from_address: selectedContract.contract_address,
            to_address: selectedContract.employee?.wallet_address,
            processed_at: new Date().toISOString(),
          });
        } catch (err) {
          console.error("Failed to record payment transaction:", err);
        }
      }

      // Update dispute history record with resolution
      try {
        const disputeResponse = await apiService.getDisputesByContract(selectedContract.id);
        const openDispute = disputeResponse?.data?.find((d) => !d.resolved_at);
        if (openDispute) {
          await apiService.updateDisputeRecord(openDispute.id, {
            resolution: payWorker ? "worker_paid" : "employer_refunded",
            resolution_tx_hash: txHash,
            resolution_notes: `Mediator resolved dispute in favor of ${payWorker ? "worker" : "employer"}.`,
          });
        }
      } catch (err) {
        console.error("Failed to update dispute history:", err);
      }

      // Refresh blockchain state if real contract
      if (!isMockContract) {
        const newState = await getContractState(selectedContract.contract_address);
        setBlockchainState(newState);
      }

      // Remove from list
      setDisputedContracts((prev) =>
        prev.filter((c) => c.id !== selectedContract.id)
      );
      setSelectedContract(null);
    } catch (error) {
      setMessage(`Error: ${parseAAError(error)}`);
    } finally {
      setResolving(false);
      setTxStep(TxSteps.IDLE);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="h-6 w-6 animate-spin" />
          Checking authorization...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-md text-center">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-800 mb-2">
            Authentication Required
          </h1>
          <p className="text-gray-600 mb-6">
            Please log in to access the Dispute Resolution Center.
          </p>
          <button
            onClick={login}
            className="bg-[#0D3B66] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#0a2f52] transition-colors"
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-red-200 p-8 max-w-md text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-800 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-4">
            This page is only accessible to approved mediators.
          </p>
          <div className="bg-gray-50 rounded-lg p-3 text-sm mb-4">
            <p className="text-gray-500 mb-1">Your email:</p>
            <p className="font-mono text-xs text-gray-700 break-all">
              {userEmail || "Not available"}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 mx-auto text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 mb-4"
          >
            <LogOut className="h-4 w-4" />
            Sign Out & Try Another Account
          </button>
          <p className="text-sm text-gray-500">
            If you believe you should have access, please contact a platform administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Scale className="h-8 w-8 text-[#0D3B66]" />
              <div>
                <h1 className="text-xl font-semibold text-[#0D3B66]">
                  Dispute Resolution Center
                </h1>
                <p className="text-sm text-gray-500">
                  Mediator Dashboard - Review and resolve contract disputes
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-800">
                Welcome, {mediatorData?.first_name || userEmail}
              </p>
              <p className="text-blue-700 mt-1">
                Review disputed contracts carefully. Your decision will release
                the escrowed funds to either the worker or employer.
              </p>
            </div>
          </div>
        </div>

        {message && (
          <div
            className={`mb-6 rounded-xl p-4 ${
              message.startsWith("Error")
                ? "bg-red-50 border border-red-200 text-red-700"
                : "bg-green-50 border border-green-200 text-green-700"
            }`}
          >
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Disputes List */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-[#0D3B66]">
                Pending Disputes
              </h2>
              <p className="text-sm text-gray-500">
                {disputedContracts.length} dispute(s) awaiting resolution
              </p>
            </div>

            {disputedContracts.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500">
                <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3" />
                <p>No pending disputes.</p>
                <p className="text-sm mt-1">
                  All contracts are operating normally.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {disputedContracts.map((contract) => (
                  <div
                    key={contract.id}
                    onClick={() => setSelectedContract(contract)}
                    className={`px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedContract?.id === contract.id ? "bg-yellow-50" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-[#0D3B66]">
                          {contract?.jobPosting?.title || "Unknown Job"}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Worker:{" "}
                          {`${contract?.employee?.first_name || ""} ${contract?.employee?.last_name || ""}`.trim() ||
                            "Unknown"}
                        </p>
                        <p className="text-sm text-gray-500">
                          Employer: {contract?.employer?.company_name || "Unknown"}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Disputed
                        </span>
                        <p className="text-sm text-gray-500 mt-2">
                          {contract.payment_amount} {contract.payment_currency || "USDC"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selected Dispute Details */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-[#0D3B66] mb-4">
              Dispute Details
            </h2>

            {!selectedContract ? (
              <p className="text-sm text-gray-500">
                Select a disputed contract to view details and resolve.
              </p>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase text-gray-400">Job</p>
                  <p className="font-medium text-[#0D3B66]">
                    {selectedContract?.jobPosting?.title || "Unknown"}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase text-gray-400">Contract Address</p>
                  {selectedContract.contract_address?.startsWith("0x000000") ? (
                    <p className="text-sm text-gray-500 italic">Mock contract (not on-chain)</p>
                  ) : (
                    <a
                      href={`${BASESCAN_URL}/address/${selectedContract.contract_address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                    >
                      {selectedContract.contract_address?.slice(0, 10)}...
                      {selectedContract.contract_address?.slice(-8)}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>

                <div>
                  <p className="text-xs uppercase text-gray-400">Amount in Escrow</p>
                  <p className="font-medium">
                    {blockchainState?.balance || selectedContract.payment_amount}{" "}
                    {selectedContract.payment_currency || "USDC"}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase text-gray-400">Worker</p>
                  <p className="text-sm">
                    {`${selectedContract?.employee?.first_name || ""} ${selectedContract?.employee?.last_name || ""}`.trim()}
                  </p>
                  <p className="text-xs text-gray-500 font-mono">
                    {selectedContract?.employee?.wallet_address?.slice(0, 10)}...
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase text-gray-400">Employer</p>
                  <p className="text-sm">
                    {selectedContract?.employer?.company_name || "Unknown"}
                  </p>
                </div>

                {blockchainState?.disputeReason && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-xs uppercase text-yellow-700 font-medium mb-1">
                      Dispute Reason
                    </p>
                    <p className="text-sm text-yellow-800">
                      {blockchainState.disputeReason}
                    </p>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-200">
                  {/* Gas Sponsorship Notice */}
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-100 mb-4">
                    <Zap className="h-4 w-4 text-green-600" />
                    <span className="text-xs text-green-700">Gas fees sponsored — No ETH required</span>
                  </div>

                  <p className="text-sm text-gray-600 mb-4">
                    <AlertTriangle className="inline-block h-4 w-4 text-yellow-500 mr-1" />
                    Your decision is final and will transfer the escrowed funds
                    immediately.
                  </p>

                  {/* Transaction Status */}
                  {txStep !== TxSteps.IDLE && resolving && (
                    <div className="p-2 bg-blue-50 rounded-lg border border-blue-100 text-xs text-blue-700 mb-3">
                      {txMessage || "Processing..."}
                    </div>
                  )}

                  <div className="space-y-3">
                    <button
                      onClick={() => handleResolve(true)}
                      disabled={resolving || !smartWalletClient || !smartWalletAddress || (blockchainState && blockchainState.state !== ContractState.Disputed)}
                      className="w-full bg-green-600 text-white py-3 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {resolving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {txStep === TxSteps.SIGNING_USEROP ? "Sign in wallet..." : "Processing..."}
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          Release to Worker
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleResolve(false)}
                      disabled={resolving || !smartWalletClient || !smartWalletAddress || (blockchainState && blockchainState.state !== ContractState.Disputed)}
                      className="w-full bg-gray-600 text-white py-3 rounded-lg text-sm font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {resolving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {txStep === TxSteps.SIGNING_USEROP ? "Sign in wallet..." : "Processing..."}
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4" />
                          Refund to Employer
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default MediatorResolution;
