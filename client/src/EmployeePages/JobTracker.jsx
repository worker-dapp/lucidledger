import React, { useEffect, useState } from "react";
import { AlertTriangle, Loader2, XCircle, Zap, ExternalLink, HandCoins } from "lucide-react";
import EmployeeNavbar from "../components/EmployeeNavbar";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";
import apiService from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { raiseDispute, ContractState, getContractState } from "../contracts/workContractInteractions";
import { TxSteps, parseAAError } from "../contracts/aaClient";

const JobTracker = () => {
  const navigate = useNavigate();
  const { user, primaryWallet, smartWalletAddress, smartWalletClient } = useAuth();
  const [employeeData, setEmployeeData] = useState(null);
  const [openContracts, setOpenContracts] = useState([]);
  const [completedContracts, setCompletedContracts] = useState([]);
  const [closedContracts, setClosedContracts] = useState([]);
  const [disputedContracts, setDisputedContracts] = useState([]);
  const [activeTab, setActiveTab] = useState("earnings");
  const [selectedContract, setSelectedContract] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Earnings state
  const [earnings, setEarnings] = useState([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [earningsLoading, setEarningsLoading] = useState(true);

  // Dispute modal state
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputing, setDisputing] = useState(false);
  const [disputeMessage, setDisputeMessage] = useState("");
  const [txStep, setTxStep] = useState(TxSteps.IDLE);
  const [txMessage, setTxMessage] = useState("");

  const handleTxStatusChange = ({ step, message }) => {
    setTxStep(step);
    setTxMessage(message);
  };

  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (!user) {
        setEmployeeData(null);
        return;
      }

      try {
        const userEmail = user?.email?.address || user?.email;
        if (userEmail) {
          const response = await apiService.getEmployeeByEmail(userEmail);
          setEmployeeData(response.data);
        } else if (smartWalletAddress || primaryWallet?.address) {
          const response = await apiService.getEmployeeByWallet(smartWalletAddress || primaryWallet?.address);
          setEmployeeData(response.data);
        }
      } catch (err) {
        console.error("Error fetching employee data:", err);
      }
    };

    fetchEmployeeData();
  }, [user, primaryWallet]);

  const fetchContracts = async () => {
    if (!employeeData?.id) {
      setOpenContracts([]);
      setCompletedContracts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      // Fetch job applications (for signed contracts pending deployment)
      const applicationsResponse = await apiService.getAppliedJobs(employeeData.id);
      const applicationsData = applicationsResponse.data || [];

      // Signed contracts waiting for deployment
      const pendingContracts = applicationsData
        .filter(app => app.application_status === "signed")
        .map(app => ({
          ...app.job,
          application_status: app.application_status,
          application_id: app.id,
          offer_accepted_at: app.offer_accepted_at,
          applied_at: app.applied_at,
          source: "application"
        }));

      // Fetch deployed contracts from deployed_contracts table
      const deployedResponse = await apiService.getDeployedContractsByEmployee(employeeData.id);
      const deployedData = deployedResponse.data || [];

      // Active deployed contracts
      const activeContracts = deployedData
        .filter(dc => dc.status === "active")
        .map(dc => ({
          ...dc.jobPosting,
          contract_address: dc.contract_address,
          payment_amount: dc.payment_amount,
          payment_currency: dc.payment_currency,
          deployed_contract_id: dc.id,
          application_status: "deployed",
          deployed_at: dc.deployed_at,
          source: "deployed_contract"
        }));

      // Completed contracts
      const completed = deployedData
        .filter(dc => dc.status === "completed")
        .map(dc => ({
          ...dc.jobPosting,
          contract_address: dc.contract_address,
          payment_amount: dc.payment_amount,
          payment_currency: dc.payment_currency,
          deployed_contract_id: dc.id,
          application_status: "completed",
          deployed_at: dc.deployed_at,
          completed_at: dc.updated_at,
          source: "deployed_contract"
        }));

      // Disputed contracts
      const disputed = deployedData
        .filter(dc => dc.status === "disputed")
        .map(dc => ({
          ...dc.jobPosting,
          contract_address: dc.contract_address,
          payment_amount: dc.payment_amount,
          payment_currency: dc.payment_currency,
          deployed_contract_id: dc.id,
          application_status: "disputed",
          deployed_at: dc.deployed_at,
          dispute_reason: dc.dispute_reason,
          mediator_id: dc.mediator_id,
          mediator: dc.mediator,
          employer_name: dc.employer?.company_name,
          source: "deployed_contract"
        }));

      // Closed contracts (refunded/terminated - no payment received)
      const closed = deployedData
        .filter(dc => dc.status === "refunded" || dc.status === "terminated")
        .map(dc => ({
          ...dc.jobPosting,
          contract_address: dc.contract_address,
          payment_amount: dc.payment_amount,
          payment_currency: dc.payment_currency,
          deployed_contract_id: dc.id,
          application_status: dc.status,
          deployed_at: dc.deployed_at,
          closed_at: dc.updated_at,
          employer_name: dc.employer?.company_name,
          source: "deployed_contract"
        }));

      setOpenContracts([...pendingContracts, ...activeContracts]);
      setCompletedContracts(completed);
      setClosedContracts(closed);
      setDisputedContracts(disputed);
    } catch (err) {
      console.error("Error fetching contracts:", err);
      setError("Unable to load contracts. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchEarnings = async () => {
    if (!employeeData?.id) {
      setEarnings([]);
      setTotalEarnings(0);
      setEarningsLoading(false);
      return;
    }

    setEarningsLoading(true);
    try {
      const response = await apiService.getPaymentTransactionsByEmployee(employeeData.id);
      setEarnings(response.data || []);
      setTotalEarnings(response.totalEarnings || 0);
    } catch (err) {
      console.error("Error fetching earnings:", err);
      // Don't set error state - just show empty earnings
      setEarnings([]);
      setTotalEarnings(0);
    } finally {
      setEarningsLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
    fetchEarnings();
  }, [employeeData]);

  // Handle raising a dispute
  const handleRaiseDispute = async () => {
    if (!selectedContract?.contract_address || !disputeReason.trim() || !smartWalletClient || !smartWalletAddress) {
      setDisputeMessage("Unable to file dispute. Please ensure your wallet is connected.");
      return;
    }

    setDisputing(true);
    setDisputeMessage("");
    setTxStep(TxSteps.IDLE);

    try {
      // File dispute on-chain
      const result = await raiseDispute({
        user,
        smartWalletClient,
        contractAddress: selectedContract.contract_address,
        reason: disputeReason,
        onStatusChange: handleTxStatusChange,
      });

      // Update database status
      await apiService.updateDeployedContract(selectedContract.deployed_contract_id, {
        status: "disputed",
      });

      setDisputeMessage(`Dispute filed successfully (gas-free). Funds are now frozen until a mediator resolves the issue.`);
      setShowDisputeModal(false);
      setDisputeReason("");

      // Refresh contracts list
      setSelectedContract(null);
      fetchContracts();
    } catch (error) {
      console.error("Error raising dispute:", error);
      setDisputeMessage(`Error: ${parseAAError(error)}`);
    } finally {
      setDisputing(false);
      setTxStep(TxSteps.IDLE);
    }
  };

  useEffect(() => {
    if (activeTab === "open") {
      setSelectedContract(openContracts[0] || null);
    } else if (activeTab === "completed") {
      setSelectedContract(completedContracts[0] || null);
    } else if (activeTab === "closed") {
      setSelectedContract(closedContracts[0] || null);
    }
    // No selection needed for earnings tab
  }, [activeTab, openContracts, completedContracts, closedContracts]);

  const formatDate = (value) => {
    if (!value) return "Not specified";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Not specified";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <EmployeeNavbar />

      <main className="pt-32 pb-12">
        {/* Welcome Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-[#0D3B66] mb-4">
              Welcome to your Work Tracker
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Keep track of every step — from finding a job to getting paid.
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="flex items-start gap-3">
                <HandCoins className="h-6 w-6 text-emerald-600" />
                <div>
                  <h3 className="font-semibold text-[#0D3B66]">Check Your Earnings</h3>
                  <p className="text-sm text-gray-600">See how much you have earned.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">📋</span>
                <div>
                  <h3 className="font-semibold text-[#0D3B66]">Track Your Contracts</h3>
                  <p className="text-sm text-gray-600">View jobs you've applied for, those in progress, and contracts you've completed.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">⭐</span>
                <div>
                  <h3 className="font-semibold text-[#0D3B66]">Build Your Reputation</h3>
                  <p className="text-sm text-gray-600">See your reputation score grow as you complete work — earn trust and better jobs.</p>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => navigate('/job-search')}
              className="bg-[#EE964B] hover:bg-[#d97b33] text-white px-6 py-3 rounded-lg font-semibold transition-all"
            >
              Search for Jobs
            </button>
          </div>
          
          {/* Success/Error Message */}
          {disputeMessage && !showDisputeModal && (
            <div className={`mb-6 rounded-xl p-4 ${
              disputeMessage.startsWith("Error")
                ? "bg-red-50 border border-red-200 text-red-700"
                : "bg-green-50 border border-green-200 text-green-700"
            }`}>
              {disputeMessage}
              <button
                onClick={() => setDisputeMessage("")}
                className="ml-2 text-current opacity-60 hover:opacity-100"
              >
                ✕
              </button>
            </div>
          )}

          {/* Contracts & Earnings Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
            <h2 className="text-2xl font-bold text-[#0D3B66] mb-6">Contracts & Earnings</h2>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-gray-200">
              <button
                onClick={() => setActiveTab("earnings")}
                className={`px-4 py-2 border-b-2 font-semibold ${
                  activeTab === "earnings"
                    ? "border-[#EE964B] text-[#EE964B]"
                    : "border-transparent text-gray-500 hover:text-[#0D3B66]"
                }`}
              >
                Earnings
              </button>
              <button
                onClick={() => setActiveTab("open")}
                className={`px-4 py-2 border-b-2 font-semibold ${
                  activeTab === "open"
                    ? "border-[#EE964B] text-[#EE964B]"
                    : "border-transparent text-gray-500 hover:text-[#0D3B66]"
                }`}
              >
                Open Contracts
              </button>
              <button
                onClick={() => setActiveTab("completed")}
                className={`px-4 py-2 border-b-2 font-semibold ${
                  activeTab === "completed"
                    ? "border-[#EE964B] text-[#EE964B]"
                    : "border-transparent text-gray-500 hover:text-[#0D3B66]"
                }`}
              >
                Completed Contracts
              </button>
              <button
                onClick={() => setActiveTab("closed")}
                className={`px-4 py-2 border-b-2 font-semibold ${
                  activeTab === "closed"
                    ? "border-[#EE964B] text-[#EE964B]"
                    : "border-transparent text-gray-500 hover:text-[#0D3B66]"
                }`}
              >
                Closed Contracts
              </button>
            </div>

            {activeTab === "earnings" ? (
              earningsLoading ? (
                <div className="text-center py-12 text-gray-500">Loading earnings...</div>
              ) : earnings.length === 0 ? (
                <div className="text-center py-12">
                  <HandCoins className="h-16 w-16 text-emerald-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-[#0D3B66] mb-2">No earnings yet</h3>
                  <p className="text-gray-600 mb-4">Complete your first contract to see payments here.</p>
                  <button
                    onClick={() => setActiveTab("open")}
                    className="text-[#EE964B] hover:text-[#d97b33] font-semibold"
                  >
                    View Open Contracts →
                  </button>
                </div>
              ) : (
                <div>
                  {/* Total Earnings Summary */}
                  <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-6 mb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-emerald-700 mb-1">Total Earnings</p>
                        <p className="text-3xl font-bold text-emerald-800">
                          ${totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-emerald-600 mt-1">USDC</p>
                      </div>
                      <HandCoins className="h-12 w-12 text-emerald-600" />
                    </div>
                  </div>

                  {/* Transactions List */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-gray-200 bg-gray-50 text-sm text-gray-600">
                      {earnings.length} transaction(s)
                    </div>
                    <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-100">
                      {earnings.map((tx) => (
                        <div
                          key={tx.id}
                          className="p-4 hover:bg-gray-50 transition-all"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-semibold text-[#0D3B66] truncate">
                                {tx.deployedContract?.jobPosting?.title || "Contract Payment"}
                              </h3>
                              <p className="text-xs text-gray-500">
                                {tx.deployedContract?.employer?.company_name || tx.deployedContract?.jobPosting?.company_name || "—"}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {formatDate(tx.created_at)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-emerald-600">
                                +${parseFloat(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </p>
                              <p className="text-xs text-gray-500">{tx.currency || "USDC"}</p>
                              <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                tx.status === "completed"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-amber-100 text-amber-700"
                              }`}>
                                {tx.status === "completed" ? "Paid" : "Pending"}
                              </span>
                            </div>
                          </div>
                          {tx.tx_hash && (
                            <a
                              href={`https://sepolia.basescan.org/tx/${tx.tx_hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 hover:text-blue-800"
                            >
                              View on BaseScan
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            ) : loading ? (
              <div className="text-center py-12 text-gray-500">Loading contracts...</div>
            ) : error ? (
              <div className="text-center py-12 text-red-600">{error}</div>
            ) : activeTab === "open" && openContracts.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📄</div>
                <h3 className="text-xl font-semibold text-[#0D3B66] mb-2">No active contracts yet</h3>
                <p className="text-gray-600 mb-4">Once you sign a contract, it will appear here.</p>
                <button
                  onClick={() => navigate('/job-search')}
                  className="text-[#EE964B] hover:text-[#d97b33] font-semibold"
                >
                  Job search →
                </button>
              </div>
            ) : activeTab === "completed" && completedContracts.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">✅</div>
                <h3 className="text-xl font-semibold text-[#0D3B66] mb-2">No completed contracts yet</h3>
                <p className="text-gray-600">When contracts finish, they will show up here.</p>
              </div>
            ) : activeTab === "closed" && closedContracts.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📁</div>
                <h3 className="text-xl font-semibold text-[#0D3B66] mb-2">No closed contracts</h3>
                <p className="text-gray-600">Contracts that were cancelled or resolved against you will appear here.</p>
              </div>
            ) : activeTab === "closed" ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-4 border border-gray-200 rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-gray-200 bg-gray-50 text-sm text-gray-600">
                    {closedContracts.length} closed contract(s)
                  </div>
                  <div className="max-h-[520px] overflow-y-auto divide-y divide-gray-100">
                    {closedContracts.map(contract => (
                      <button
                        key={contract.deployed_contract_id}
                        onClick={() => setSelectedContract(contract)}
                        className={`w-full text-left p-4 hover:bg-gray-50 transition-all ${
                          selectedContract?.deployed_contract_id === contract.deployed_contract_id
                            ? "bg-[#FFF9F2]" : "bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <h3 className="text-sm font-semibold text-[#0D3B66]">{contract.title}</h3>
                            <p className="text-xs text-gray-500">{contract.company_name || contract.employer_name}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${
                            contract.application_status === "refunded"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-red-100 text-red-800"
                          }`}>
                            {contract.application_status === "refunded" ? "Refunded" : "Terminated"}
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-gray-400">
                          Closed: {formatDate(contract.closed_at)}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-8 border border-gray-200 rounded-xl p-6 bg-white">
                  {selectedContract ? (
                    <div className="space-y-5">
                      <div className="border-b border-gray-200 pb-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div>
                            <h3 className="text-xl font-bold text-[#0D3B66]">{selectedContract.title}</h3>
                            <p className="text-sm text-gray-500">{selectedContract.company_name || selectedContract.employer_name}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            selectedContract.application_status === "refunded"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-red-100 text-red-800"
                          }`}>
                            {selectedContract.application_status === "refunded" ? "Refunded to Employer" : "Terminated"}
                          </span>
                        </div>
                      </div>

                      {/* No Payment Notice */}
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <p className="text-sm text-orange-800">
                          <strong>No payment received.</strong> This contract was {selectedContract.application_status === "refunded" ? "refunded to the employer" : "terminated"} and no funds were released to you.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-xs font-semibold text-gray-500 mb-1">Original Amount</p>
                          <p className="text-sm text-gray-700 line-through">
                            {selectedContract.payment_currency || "USDC"} {selectedContract.payment_amount}
                          </p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-xs font-semibold text-gray-500 mb-1">Closed Date</p>
                          <p className="text-sm text-gray-700">{formatDate(selectedContract.closed_at)}</p>
                        </div>
                      </div>

                      {selectedContract.description && (
                        <div>
                          <h4 className="text-sm font-semibold text-[#0D3B66] mb-2">Contract Summary</h4>
                          <p className="text-sm text-gray-600">{selectedContract.description}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      Select a contract to view details.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-4 border border-gray-200 rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-gray-200 bg-gray-50 text-sm text-gray-600">
                    {activeTab === "open" ? `${openContracts.length} open contract(s)` : `${completedContracts.length} completed contract(s)`}
                  </div>
                  <div className="max-h-[520px] overflow-y-auto divide-y divide-gray-100">
                    {(activeTab === "open" ? openContracts : completedContracts).map(contract => (
                      <button
                        key={contract.deployed_contract_id || contract.application_id}
                        onClick={() => setSelectedContract(contract)}
                        className={`w-full text-left p-4 hover:bg-gray-50 transition-all ${
                          (selectedContract?.deployed_contract_id === contract.deployed_contract_id && contract.deployed_contract_id) ||
                          (selectedContract?.application_id === contract.application_id && contract.application_id)
                            ? "bg-[#FFF9F2]" : "bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <h3 className="text-sm font-semibold text-[#0D3B66]">{contract.title}</h3>
                            <p className="text-xs text-gray-500">{contract.company_name}</p>
                          </div>
                          {activeTab === "open" ? (
                            contract.application_status === "signed" ? (
                              <span className="px-2 py-1 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                                Pending
                              </span>
                            ) : (
                              <span className="px-2 py-1 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                                Active
                              </span>
                            )
                          ) : (
                            <span className="px-2 py-1 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800">
                              Paid
                            </span>
                          )}
                        </div>
                        <div className="mt-2 text-xs text-gray-400">
                          Signed: {formatDate(contract.offer_accepted_at || contract.applied_at)}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-8 border border-gray-200 rounded-xl p-6 bg-white">
                  {selectedContract ? (
                    <div className="space-y-5">
                      <div className="border-b border-gray-200 pb-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div>
                            <h3 className="text-xl font-bold text-[#0D3B66]">{selectedContract.title}</h3>
                            <p className="text-sm text-gray-500">{selectedContract.company_name}</p>
                          </div>
                          {activeTab === "open" ? (
                            selectedContract.application_status === "signed" ? (
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                                Pending Deployment
                              </span>
                            ) : (
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                                Active Contract
                              </span>
                            )
                          ) : (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                              Completed & Paid
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-xs font-semibold text-gray-500 mb-1">Location</p>
                          <p className="text-sm text-gray-700">{selectedContract.location || "Not specified"}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-xs font-semibold text-gray-500 mb-1">Compensation</p>
                          <p className="text-sm text-gray-700">
                            {selectedContract.payment_currency || selectedContract.currency || "USD"} {selectedContract.payment_amount || selectedContract.salary}/{selectedContract.pay_frequency}
                          </p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-xs font-semibold text-gray-500 mb-1">{activeTab === "completed" ? "Completed" : "Signed"}</p>
                          <p className="text-sm text-gray-700">
                            {formatDate(activeTab === "completed" ? selectedContract.completed_at : (selectedContract.deployed_at || selectedContract.offer_accepted_at || selectedContract.applied_at))}
                          </p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-xs font-semibold text-gray-500 mb-1">Type</p>
                          <p className="text-sm text-gray-700">{selectedContract.job_type || "Not specified"}</p>
                        </div>
                      </div>

                      {selectedContract.description && (
                        <div>
                          <h4 className="text-sm font-semibold text-[#0D3B66] mb-2">Contract Summary</h4>
                          <p className="text-sm text-gray-600">{selectedContract.description}</p>
                        </div>
                      )}

                      {activeTab === "open" && selectedContract.application_status === "deployed" && (
                        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                          <button
                            onClick={() => setShowCancelModal(true)}
                            className="flex-1 py-3 px-4 rounded-lg font-semibold text-sm bg-red-100 text-red-700 hover:bg-red-200"
                          >
                            Cancel Contract
                          </button>
                          <button
                            onClick={() => {
                              setDisputeMessage("");
                              setShowDisputeModal(true);
                            }}
                            disabled={!smartWalletClient || !smartWalletAddress}
                            className="flex-1 py-3 px-4 rounded-lg font-semibold text-sm bg-yellow-100 text-yellow-800 hover:bg-yellow-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            <AlertTriangle className="h-4 w-4" />
                            Raise Dispute
                          </button>
                        </div>
                      )}
                      {activeTab === "open" && selectedContract.application_status === "signed" && (
                        <div className="pt-4 border-t border-gray-200">
                          <p className="text-sm text-gray-500 text-center">
                            Waiting for employer to deploy contract on-chain
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      Select a contract to view details.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Reputation Section */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-[#0D3B66] mb-4">Reputation</h2>
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🏆</div>
                <p className="text-gray-500">Coming Soon</p>
                <p className="text-sm text-gray-400 mt-2">Your reputation score will be displayed here</p>
              </div>
            </div>
            
            {/* Disputes Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-[#0D3B66] mb-4">Disputes</h2>
              {disputedContracts.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">⚖️</div>
                  <p className="text-gray-500">No active disputes</p>
                  <p className="text-sm text-gray-400 mt-2">Any ongoing disputes will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {disputedContracts.map((contract) => (
                    <div key={contract.deployed_contract_id} className="p-4 border border-yellow-200 bg-yellow-50 rounded-xl">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-semibold text-[#0D3B66]">{contract.title}</h3>
                          <p className="text-xs text-gray-500 mt-0.5">{contract.employer_name || contract.company_name}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${
                          contract.mediator_id ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {contract.mediator_id ? "Mediator Assigned" : "Awaiting Mediator"}
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-gray-600">
                        <span>Escrow: {contract.payment_currency || "USDC"} {contract.payment_amount}</span>
                      </div>
                      {contract.dispute_reason && (
                        <p className="mt-2 text-xs text-yellow-800 bg-yellow-100 p-2 rounded">
                          {contract.dispute_reason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {showCancelModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-[#0D3B66] mb-2">Cancel contract?</h3>
            <p className="text-sm text-gray-600 mb-6">
              Warning, you are about to cancel this contract. This action will notify the employer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2 px-4 rounded-lg text-sm font-semibold bg-gray-100 text-[#0D3B66] hover:bg-gray-200"
              >
                Nevermind
              </button>
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2 px-4 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700"
              >
                Yes, cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispute Modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#0D3B66]">Raise Dispute</h3>
              <button
                onClick={() => setShowDisputeModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {/* Gas Sponsorship Notice */}
            <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-100 mb-4">
              <Zap className="h-4 w-4 text-green-600" />
              <span className="text-xs text-green-700">Gas fees sponsored — No ETH required</span>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-3">
                Raising a dispute will freeze the escrowed funds until a neutral mediator resolves the issue.
                Please describe the problem clearly.
              </p>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for dispute *
              </label>
              <textarea
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="Describe the issue (e.g., work completed but payment not approved, unsafe conditions, contract terms not honored...)"
                className="w-full rounded-lg border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                rows={4}
              />
            </div>

            {/* Transaction Status */}
            {txStep !== TxSteps.IDLE && disputing && (
              <div className="p-2 bg-blue-50 rounded-lg border border-blue-100 text-xs text-blue-700 mb-3">
                {txMessage || "Processing..."}
              </div>
            )}

            {disputeMessage && (
              <div className={`p-3 rounded-lg text-sm mb-4 ${
                disputeMessage.startsWith("Error")
                  ? "bg-red-50 border border-red-200 text-red-700"
                  : "bg-green-50 border border-green-200 text-green-700"
              }`}>
                {disputeMessage}
              </div>
            )}

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
                    {txStep === TxSteps.SIGNING_USEROP ? "Sign in wallet..." : "Submitting..."}
                  </>
                ) : (
                  "Submit Dispute"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <Footer />
    </div>
  );
};

export default JobTracker;
