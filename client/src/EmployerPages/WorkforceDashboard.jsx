import React, { useEffect, useMemo, useState } from "react";
import {
  CheckCircle,
  Clock,
  Search,
  Users,
  AlertTriangle,
  ExternalLink,
  Loader2,
  XCircle,
  Zap,
} from "lucide-react";
import EmployerLayout from "../components/EmployerLayout";
import apiService from "../services/api";
import {
  getContractState,
  approveAndPay,
  raiseDispute,
  checkPermissions,
  ContractState,
  StateNames,
} from "../contracts/workContractInteractions";
import { getBasescanUrl } from "../contracts/deployWorkContract";
import { TxSteps, parseAAError } from "../contracts/aaClient";
import { useAuth } from "../hooks/useAuth";

const BASESCAN_URL = import.meta.env.VITE_BASESCAN_URL || "https://sepolia.basescan.org";

const statusStyles = {
  active: "bg-green-100 text-green-700",
  completed: "bg-gray-100 text-gray-700",
  disputed: "bg-yellow-100 text-yellow-800",
  terminated: "bg-red-100 text-red-700",
};

const verificationStyles = {
  pending: "bg-yellow-100 text-yellow-800",
  verified: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
};

const WorkforceDashboard = () => {
  const { user, smartWalletClient, smartWalletAddress } = useAuth();
  const [employerId, setEmployerId] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("active");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContract, setSelectedContract] = useState(null);
  const [oracleVerifications, setOracleVerifications] = useState([]);
  const [paymentTransactions, setPaymentTransactions] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Blockchain state
  const [blockchainState, setBlockchainState] = useState(null);
  const [blockchainLoading, setBlockchainLoading] = useState(false);
  const [permissions, setPermissions] = useState(null);

  // Action states
  const [approving, setApproving] = useState(false);
  const [disputing, setDisputing] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [txStep, setTxStep] = useState(TxSteps.IDLE);
  const [txMessage, setTxMessage] = useState("");

  const handleTxStatusChange = ({ step, message }) => {
    setTxStep(step);
    setTxMessage(message);
  };

  useEffect(() => {
    const fetchEmployer = async () => {
      const walletAddress = smartWalletAddress;

      if (!walletAddress) {
        setLoading(false);
        return;
      }

      try {
        const response = await apiService.getEmployerByWallet(walletAddress);
        if (response?.data?.id) {
          setEmployerId(response.data.id);
        }
      } catch (error) {
        console.error("Error fetching employer:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployer();
  }, [smartWalletAddress]);

  useEffect(() => {
    const fetchContracts = async () => {
      if (!employerId) {
        return;
      }

      setLoading(true);
      setErrorMessage("");

      try {
        const response = await apiService.getDeployedContracts(employerId, statusFilter);
        const data = response?.data || [];
        setContracts(data);
        if (data.length > 0 && !selectedContract) {
          setSelectedContract(data[0]);
        }
      } catch (error) {
        setErrorMessage(error.message || "Failed to load contracts");
      } finally {
        setLoading(false);
      }
    };

    fetchContracts();
  }, [employerId, statusFilter]);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!selectedContract?.id) {
        setOracleVerifications([]);
        setPaymentTransactions([]);
        return;
      }

      setDetailLoading(true);
      setActionMessage("");
      try {
        const [oracleResponse, paymentResponse] = await Promise.all([
          apiService.getLatestOracleVerifications(selectedContract.id),
          apiService.getPaymentTransactions(selectedContract.id),
        ]);
        setOracleVerifications(oracleResponse?.data || []);
        setPaymentTransactions(paymentResponse?.data || []);
      } catch (error) {
        setActionMessage(error.message || "Unable to load contract details");
      } finally {
        setDetailLoading(false);
      }
    };

    fetchDetails();
  }, [selectedContract?.id]);

  // Fetch blockchain state when contract is selected
  useEffect(() => {
    const fetchBlockchainState = async () => {
      if (!selectedContract?.contract_address || !smartWalletAddress) {
        setBlockchainState(null);
        setPermissions(null);
        return;
      }

      // Skip if it's a mock address (starts with 0x00...)
      if (selectedContract.contract_address.startsWith("0x00")) {
        setBlockchainState(null);
        setPermissions(null);
        return;
      }

      setBlockchainLoading(true);
      try {
        const [state, perms] = await Promise.all([
          getContractState(selectedContract.contract_address),
          checkPermissions(selectedContract.contract_address, smartWalletAddress),
        ]);
        setBlockchainState(state);
        setPermissions(perms);
      } catch (error) {
        console.error("Error fetching blockchain state:", error);
        setBlockchainState(null);
        setPermissions(null);
      } finally {
        setBlockchainLoading(false);
      }
    };

    fetchBlockchainState();
  }, [selectedContract?.contract_address, smartWalletAddress]);

  const handleApproveAndPay = async () => {
    if (!selectedContract?.contract_address || !smartWalletClient || !smartWalletAddress) return;

    setApproving(true);
    setActionMessage("");
    setTxStep(TxSteps.IDLE);

    try {
      const result = await approveAndPay({
        user,
        smartWalletClient,
        contractAddress: selectedContract.contract_address,
        onStatusChange: handleTxStatusChange,
      });

      // Update database status
      await apiService.updateDeployedContract(selectedContract.id, {
        status: "completed",
        verification_status: "verified",
      });

      // Record payment transaction
      await apiService.createPaymentTransaction({
        deployed_contract_id: selectedContract.id,
        amount: selectedContract.payment_amount,
        currency: selectedContract.payment_currency || "USDC",
        payment_type: "final",
        status: "completed",
        tx_hash: result.txHash,
      });

      setActionMessage(`Payment released (gas-free)! View on BaseScan: ${result.basescanUrl}`);

      // Refresh blockchain state
      const newState = await getContractState(selectedContract.contract_address);
      setBlockchainState(newState);

      // Update local contract status
      setSelectedContract((prev) => ({
        ...prev,
        status: "completed",
        verification_status: "verified",
      }));
    } catch (error) {
      setActionMessage(`Error: ${parseAAError(error)}`);
    } finally {
      setApproving(false);
      setTxStep(TxSteps.IDLE);
    }
  };

  const handleRaiseDispute = async () => {
    if (!selectedContract?.contract_address || !disputeReason.trim() || !smartWalletClient || !smartWalletAddress) return;

    setDisputing(true);
    setActionMessage("");
    setTxStep(TxSteps.IDLE);

    try {
      const result = await raiseDispute({
        user,
        smartWalletClient,
        contractAddress: selectedContract.contract_address,
        reason: disputeReason,
        onStatusChange: handleTxStatusChange,
      });

      // Update database status
      await apiService.updateDeployedContract(selectedContract.id, {
        status: "disputed",
      });

      setActionMessage(`Dispute raised (gas-free). Funds frozen. View on BaseScan: ${result.basescanUrl}`);
      setShowDisputeModal(false);
      setDisputeReason("");

      // Refresh blockchain state
      const newState = await getContractState(selectedContract.contract_address);
      setBlockchainState(newState);

      // Update local contract status
      setSelectedContract((prev) => ({
        ...prev,
        status: "disputed",
      }));
    } catch (error) {
      setActionMessage(`Error: ${parseAAError(error)}`);
    } finally {
      setDisputing(false);
      setTxStep(TxSteps.IDLE);
    }
  };

  const filteredContracts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return contracts;
    }

    return contracts.filter((contract) => {
      const title = contract?.jobPosting?.title || "";
      const employeeName = `${contract?.employee?.first_name || ""} ${contract?.employee?.last_name || ""}`.trim();
      return title.toLowerCase().includes(term) || employeeName.toLowerCase().includes(term);
    });
  }, [contracts, searchTerm]);

  const metrics = useMemo(() => {
    const total = contracts.length;
    const verifiedCount = contracts.filter((c) => c.verification_status === "verified").length;
    const pendingPayments = contracts.filter((c) => c.next_payment_date).length;
    return { total, verifiedCount, pendingPayments };
  }, [contracts]);

  const formatCurrency = (amount, currency) => {
    if (amount === null || amount === undefined) {
      return "--";
    }
    const formatted = Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${currency || "USDC"} ${formatted}`;
  };

  const formatDate = (value) => {
    if (!value) return "--";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "--";
    return date.toLocaleDateString();
  };

  const isRealContract = (contract) => {
    return contract?.contract_address && !contract.contract_address.startsWith("0x00");
  };

  if (loading) {
    return (
      <EmployerLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-600">Loading...</div>
        </div>
      </EmployerLayout>
    );
  }

  if (!employerId) {
    return (
      <EmployerLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-600">Employer profile not found.</div>
        </div>
      </EmployerLayout>
    );
  }

  return (
    <EmployerLayout>
      <main className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-[#0D3B66]" />
              <div>
                <p className="text-sm text-gray-500">Active Contracts</p>
                <p className="text-2xl font-semibold text-[#0D3B66]">{metrics.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <p className="text-sm text-gray-500">Verified Workers</p>
                <p className="text-2xl font-semibold text-[#0D3B66]">{metrics.verifiedCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-500">Upcoming Payments</p>
                <p className="text-2xl font-semibold text-[#0D3B66]">{metrics.pendingPayments}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            {["active", "completed", "disputed", "terminated"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-full text-sm font-medium border ${
                  statusFilter === status
                    ? "border-[#EE964B] text-[#EE964B] bg-[#FFF4E6]"
                    : "border-gray-200 text-gray-600 bg-white hover:border-gray-300"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search worker or job..."
              className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#EE964B]"
            />
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#0D3B66]">Active Contracts</h2>
                <p className="text-sm text-gray-500">Showing {filteredContracts.length} contracts</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="text-left font-medium px-6 py-3">Worker</th>
                    <th className="text-left font-medium px-6 py-3">Role</th>
                    <th className="text-left font-medium px-6 py-3">Status</th>
                    <th className="text-left font-medium px-6 py-3">Verification</th>
                    <th className="text-left font-medium px-6 py-3">On-Chain</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContracts.map((contract) => {
                    const employeeName = `${contract?.employee?.first_name || ""} ${contract?.employee?.last_name || ""}`.trim();
                    const hasRealContract = isRealContract(contract);

                    return (
                      <tr
                        key={contract.id}
                        onClick={() => setSelectedContract(contract)}
                        className={`border-t border-gray-100 cursor-pointer hover:bg-gray-50 ${
                          selectedContract?.id === contract.id ? "bg-[#FFF9F2]" : ""
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="font-medium text-[#0D3B66]">
                            {employeeName || "Unknown Worker"}
                          </div>
                          <div className="text-xs text-gray-400">{contract?.employee?.email || ""}</div>
                        </td>
                        <td className="px-6 py-4 text-gray-700">{contract?.jobPosting?.title || "--"}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusStyles[contract.status] || "bg-gray-100 text-gray-600"}`}>
                            {contract.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${verificationStyles[contract.verification_status] || "bg-gray-100 text-gray-600"}`}>
                            {contract.verification_status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {hasRealContract ? (
                            <a
                              href={`${BASESCAN_URL}/address/${contract.contract_address}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs"
                            >
                              View
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-xs text-gray-400">Mock</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredContracts.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-6 text-center text-gray-500">
                        No contracts found for this filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-[#0D3B66] mb-2">Contract Details</h2>
            {!selectedContract && <p className="text-sm text-gray-500">Select a contract to view details.</p>}
            {selectedContract && (
              <>
                <div className="space-y-3 text-sm text-gray-700">
                  <div>
                    <p className="text-xs uppercase text-gray-400">Worker</p>
                    <p className="font-medium text-[#0D3B66]">
                      {`${selectedContract?.employee?.first_name || ""} ${selectedContract?.employee?.last_name || ""}`.trim() || "Unknown Worker"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-400">Role</p>
                    <p>{selectedContract?.jobPosting?.title || "--"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-400">Contract Address</p>
                    {isRealContract(selectedContract) ? (
                      <a
                        href={`${BASESCAN_URL}/address/${selectedContract.contract_address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline break-all text-xs flex items-center gap-1"
                      >
                        {selectedContract.contract_address.slice(0, 10)}...{selectedContract.contract_address.slice(-8)}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <p className="break-all text-xs text-gray-400">Mock contract</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-400">Payment</p>
                    <p>{formatCurrency(selectedContract.payment_amount, selectedContract.payment_currency)}</p>
                    <p className="text-xs text-gray-500">{selectedContract.payment_frequency || "--"}</p>
                  </div>
                </div>

                {/* Blockchain State */}
                {isRealContract(selectedContract) && (
                  <div className="mt-5 pt-5 border-t border-gray-200">
                    <h3 className="text-sm font-semibold text-[#0D3B66] mb-3">Blockchain Status</h3>
                    {blockchainLoading ? (
                      <div className="flex items-center gap-2 text-gray-500 text-sm">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading on-chain state...
                      </div>
                    ) : blockchainState ? (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">State:</span>
                          <span className={`font-medium ${
                            blockchainState.state === ContractState.Funded ? "text-green-600" :
                            blockchainState.state === ContractState.Completed ? "text-blue-600" :
                            blockchainState.state === ContractState.Disputed ? "text-yellow-600" :
                            "text-gray-600"
                          }`}>
                            {blockchainState.stateName}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Escrow:</span>
                          <span className="font-medium">{blockchainState.balance} USDC</span>
                        </div>
                        {blockchainState.disputeReason && (
                          <div className="mt-2 p-2 bg-yellow-50 rounded text-xs">
                            <p className="text-yellow-800 font-medium">Dispute reason:</p>
                            <p className="text-yellow-700">{blockchainState.disputeReason}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">Unable to load blockchain state</p>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                {isRealContract(selectedContract) && permissions && (
                  <div className="mt-5 space-y-3">
                    {/* Gas Sponsorship Notice */}
                    {(permissions.canApprove || permissions.canDispute) && (
                      <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-100">
                        <Zap className="h-4 w-4 text-green-600" />
                        <span className="text-xs text-green-700">Gas fees sponsored — No ETH required</span>
                      </div>
                    )}

                    {/* Transaction Status */}
                    {txStep !== TxSteps.IDLE && (approving || disputing) && (
                      <div className="p-2 bg-blue-50 rounded-lg border border-blue-100 text-xs text-blue-700">
                        {txMessage || "Processing..."}
                      </div>
                    )}

                    {permissions.canApprove && (
                      <button
                        onClick={handleApproveAndPay}
                        disabled={approving || !smartWalletClient || !smartWalletAddress}
                        className="w-full bg-green-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {approving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {txStep === TxSteps.SIGNING_USEROP ? "Sign in wallet..." : "Approving..."}
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            Approve Work & Pay
                          </>
                        )}
                      </button>
                    )}

                    {permissions.canDispute && (
                      <button
                        onClick={() => setShowDisputeModal(true)}
                        disabled={disputing}
                        className="w-full bg-yellow-500 text-white py-2 rounded-lg text-sm font-semibold hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <AlertTriangle className="h-4 w-4" />
                        Raise Dispute
                      </button>
                    )}

                    {blockchainState?.state === ContractState.Disputed && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
                        <p className="text-yellow-800 font-medium">Contract is disputed</p>
                        <p className="text-yellow-700 text-xs mt-1">
                          The mediator will review and resolve this dispute. Funds are frozen until resolution.
                        </p>
                      </div>
                    )}

                    {blockchainState?.state === ContractState.Completed && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
                        <p className="text-green-800 font-medium">Payment completed</p>
                        <p className="text-green-700 text-xs mt-1">
                          Funds have been released to the worker.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {actionMessage && (
                  <div className={`mt-3 text-xs p-2 rounded ${
                    actionMessage.startsWith("Error") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
                  }`}>
                    {actionMessage}
                  </div>
                )}

                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-[#0D3B66] mb-2">Latest Oracle Checks</h3>
                  {detailLoading && <p className="text-xs text-gray-400">Loading details...</p>}
                  {!detailLoading && oracleVerifications.length === 0 && (
                    <p className="text-xs text-gray-400">No oracle updates yet.</p>
                  )}
                  <div className="space-y-2">
                    {oracleVerifications.map((verification) => (
                      <div key={verification.id} className="flex items-center justify-between text-xs text-gray-600">
                        <span className="capitalize">{verification.oracle_type?.replace("_", " ")}</span>
                        <span>{verification.verification_status || "pending"}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-[#0D3B66] mb-2">Payment History</h3>
                  {detailLoading && <p className="text-xs text-gray-400">Loading details...</p>}
                  {!detailLoading && paymentTransactions.length === 0 && (
                    <p className="text-xs text-gray-400">No payments recorded.</p>
                  )}
                  <div className="space-y-2">
                    {paymentTransactions.slice(0, 4).map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between text-xs text-gray-600">
                        <span>{formatCurrency(payment.amount, payment.currency)}</span>
                        <div className="flex items-center gap-2">
                          <span>{payment.status}</span>
                          {payment.tx_hash && (
                            <a
                              href={`${BASESCAN_URL}/tx/${payment.tx_hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Dispute Modal */}
        {showDisputeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[#0D3B66]">Raise Dispute</h3>
                <button
                  onClick={() => setShowDisputeModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Raising a dispute will freeze the escrowed funds until a neutral mediator resolves the issue.
                </p>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for dispute *
                </label>
                <textarea
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="Describe the issue..."
                  className="w-full rounded-lg border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  rows={4}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDisputeModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRaiseDispute}
                  disabled={!disputeReason.trim() || disputing}
                  className="flex-1 bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {disputing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Dispute"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </EmployerLayout>
  );
};

export default WorkforceDashboard;
