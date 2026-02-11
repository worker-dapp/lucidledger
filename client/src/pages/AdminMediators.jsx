import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Loader2,
  LogOut,
  Plus,
  Shield,
  Trash2,
  UserCheck,
  UserX,
  Zap,
  XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import apiService from "../services/api";
import { assignMediator } from "../contracts/workContractInteractions";
import { parseAAError } from "../contracts/aaClient";
import { getOnChainAdminAddress } from "../contracts/adminUtils";
import { useAuth } from "../hooks/useAuth";
import LogoutButton from "../components/LogoutButton";

const AdminMediators = () => {
  const { user, login, smartWalletClient, smartWalletAddress } = useAuth();
  const [loading, setLoading] = useState(true);
  const [mediators, setMediators] = useState([]);
  const [disputedContracts, setDisputedContracts] = useState([]);
  const [assignmentSelection, setAssignmentSelection] = useState({});
  const [assigningId, setAssigningId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [txMessage, setTxMessage] = useState("");
  const [newMediator, setNewMediator] = useState({
    email: "",
    first_name: "",
    last_name: "",
    phone_number: "",
  });

  // On-chain admin wallet mismatch detection
  const [onChainAdmin, setOnChainAdmin] = useState(null);
  const [walletMismatch, setWalletMismatch] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckComplete, setAdminCheckComplete] = useState(false);

  // Get current user's email
  const userEmail = user?.email?.address?.toLowerCase() || "";

  const handleTxStatusChange = ({ message }) => {
    setTxMessage(message);
  };

  // Check admin status server-side by attempting to fetch admin data
  useEffect(() => {
    const checkAdminStatus = async () => {
      // Check if user has a session (wallet or user object)
      if (!user && !smartWalletAddress) {
        setAdminCheckComplete(true);
        return;
      }

      try {
        // Attempt to fetch mediators - will fail with 403 if not admin
        const response = await apiService.getAllMediators();
        if (response.success) {
          setIsAdmin(true);
        }
      } catch (err) {
        // 403 means not admin, which is expected for non-admins
        if (err.status !== 403) {
          console.error("Error checking admin status:", err);
        }
        setIsAdmin(false);
      } finally {
        setAdminCheckComplete(true);
      }
    };

    checkAdminStatus();
  }, [user, smartWalletAddress]);

  // Fetch on-chain admin address on mount
  useEffect(() => {
    const fetchOnChainAdmin = async () => {
      const admin = await getOnChainAdminAddress();
      setOnChainAdmin(admin);
    };
    fetchOnChainAdmin();
  }, []);

  // Check for wallet mismatch when wallet or onChainAdmin changes
  useEffect(() => {
    if (onChainAdmin && smartWalletAddress) {
      const mismatch = onChainAdmin.toLowerCase() !== smartWalletAddress.toLowerCase();
      setWalletMismatch(mismatch);
    } else {
      setWalletMismatch(false);
    }
  }, [onChainAdmin, smartWalletAddress]);

  // Fetch mediators and disputed contracts after admin check completes
  useEffect(() => {
    const fetchAdminData = async () => {
      // Wait for admin check to complete
      if (!adminCheckComplete) {
        return;
      }

      if ((!user && !smartWalletAddress) || !isAdmin) {
        setLoading(false);
        return;
      }

      try {
        const [mediatorsResponse, disputesResponse] = await Promise.all([
          apiService.getAllMediators(),
          apiService.getDisputedContractsForAdmin(),
        ]);

        if (mediatorsResponse.success) {
          setMediators(mediatorsResponse.data);
        }

        if (disputesResponse.success) {
          setDisputedContracts(disputesResponse.data);
          const selections = {};
          disputesResponse.data.forEach((contract) => {
            if (contract.mediator_id || contract.mediator?.id) {
              selections[contract.id] = String(contract.mediator_id || contract.mediator.id);
            }
          });
          setAssignmentSelection(selections);
        }
      } catch (err) {
        console.error("Error fetching mediators:", err);
        setError(err.message || "Failed to fetch mediators");
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [user, smartWalletAddress, isAdmin, adminCheckComplete]);

  const handleAddMediator = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response = await apiService.createMediator(newMediator);
      if (response.success) {
        setMediators([response.data, ...mediators]);
        setNewMediator({ email: "", first_name: "", last_name: "", phone_number: "" });
        setShowAddForm(false);
        setSuccess("Mediator added successfully");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      console.error("Error adding mediator:", err);
      setError(err.message || "Failed to add mediator");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (mediator) => {
    const newStatus = mediator.status === "active" ? "inactive" : "active";

    try {
      const response = await apiService.updateMediator(mediator.id, { status: newStatus });
      if (response.success) {
        setMediators(mediators.map(m =>
          m.id === mediator.id ? { ...m, status: newStatus } : m
        ));
        setSuccess(`Mediator ${newStatus === "active" ? "activated" : "deactivated"}`);
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      console.error("Error updating mediator:", err);
      setError(err.message || "Failed to update mediator");
    }
  };

  const handleDelete = async (mediator) => {
    if (!confirm(`Are you sure you want to delete ${mediator.email}?`)) {
      return;
    }

    try {
      const response = await apiService.deleteMediator(mediator.id);
      if (response.success) {
        setMediators(mediators.filter(m => m.id !== mediator.id));
        setSuccess("Mediator deleted successfully");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      console.error("Error deleting mediator:", err);
      setError(err.message || "Failed to delete mediator");
    }
  };

  const activeMediators = mediators.filter(
    (mediator) => mediator.status === "active" && mediator.wallet_address
  );

  const handleAssignMediator = async (contract) => {
    const selectedMediatorId = assignmentSelection[contract.id];
    if (!selectedMediatorId) {
      setError("Select a mediator before assigning.");
      return;
    }

    if (!smartWalletClient || !smartWalletAddress) {
      setError("Connect the admin wallet to assign mediators.");
      return;
    }

    setAssigningId(contract.id);
    setError("");
    setSuccess("");
    setTxMessage("");

    try {
      const mediator = mediators.find((m) => String(m.id) === String(selectedMediatorId));
      if (!mediator?.wallet_address) {
        throw new Error("Selected mediator has no wallet address");
      }

      await assignMediator({
        smartWalletClient,
        contractAddress: contract.contract_address,
        mediatorAddress: mediator.wallet_address,
        onStatusChange: handleTxStatusChange,
      });

      const response = await apiService.assignMediatorToDeployedContract(
        contract.id,
        selectedMediatorId
      );

      if (response.success) {
        const mediator = mediators.find((m) => String(m.id) === String(selectedMediatorId));
        setDisputedContracts((prev) =>
          prev.map((item) =>
            item.id === contract.id
              ? { ...item, mediator_id: Number(selectedMediatorId), mediator }
              : item
          )
        );
        setSuccess("Mediator assigned successfully");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      console.error("Error assigning mediator:", err);
      setError(parseAAError(err) || err.message || "Failed to assign mediator");
    } finally {
      setAssigningId(null);
      setTxMessage("");
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

  // Show login if no session at all
  if (!user && !smartWalletAddress) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-md text-center">
          <Shield className="h-12 w-12 text-blue-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-800 mb-2">
            Administrator Login
          </h1>
          <p className="text-gray-600 mb-6">
            Sign in with your authorized email address to access the admin dashboard.
          </p>
          <button
            onClick={login}
            className="px-4 py-2 bg-[#0D3B66] text-white rounded-lg hover:bg-[#0a2d4d] transition-colors"
          >
            Sign In
          </button>
          <p className="text-xs text-gray-400 mt-4">
            Only authorized administrators can access this page.
          </p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-red-200 p-8 max-w-md text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-800 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-4">
            This page is only accessible to platform administrators.
          </p>
          <div className="bg-gray-50 rounded-lg p-3 text-sm mb-4">
            <p className="text-gray-500 mb-1">Your email:</p>
            <p className="font-mono text-xs text-gray-700 break-all">
              {userEmail || "Not available"}
            </p>
          </div>
          <LogoutButton className="flex items-center gap-2 px-4 py-2 mx-auto text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200">
            <LogOut className="h-4 w-4" />
            Sign Out & Try Another Account
          </LogoutButton>
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
              <Link to="/admin" className="text-gray-400 hover:text-gray-600 transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <Shield className="h-8 w-8 text-[#0D3B66]" />
              <div>
                <h1 className="text-xl font-semibold text-[#0D3B66]">
                  Admin: Mediator Management
                </h1>
                <p className="text-sm text-gray-500">
                  Add, remove, and manage approved mediators
                </p>
              </div>
            </div>
            <LogoutButton className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
              <LogOut className="h-4 w-4" />
              Sign Out
            </LogoutButton>
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
                  Your connected wallet does not match the on-chain admin address.
                  Mediator assignment transactions will fail.
                </p>
                <div className="mt-2 text-xs font-mono">
                  <p className="text-amber-600">Connected: {smartWalletAddress}</p>
                  <p className="text-amber-600">Expected: {onChainAdmin}</p>
                </div>
                <p className="text-sm text-amber-700 mt-2">
                  Please connect the correct smart wallet, or redeploy the
                  factory with the current wallet as admin.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Messages */}
        {error && (
          <div className="mb-6 rounded-xl p-4 bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            {error}
            <button onClick={() => setError("")} className="ml-auto">
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-xl p-4 bg-green-50 border border-green-200 text-green-700 flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            {success}
          </div>
        )}

        {/* Add Mediator Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2 bg-[#0D3B66] text-white rounded-lg hover:bg-[#0a2d4d] transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Mediator
          </button>
        </div>

        {/* Add Mediator Form */}
        {showAddForm && (
          <div className="mb-6 bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-[#0D3B66] mb-4">
              Add New Mediator
            </h2>
            <form onSubmit={handleAddMediator} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={newMediator.email}
                    onChange={(e) => setNewMediator({ ...newMediator, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0D3B66] focus:border-transparent"
                    placeholder="mediator@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={newMediator.phone_number}
                    onChange={(e) => setNewMediator({ ...newMediator, phone_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0D3B66] focus:border-transparent"
                    placeholder="+1234567890"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={newMediator.first_name}
                    onChange={(e) => setNewMediator({ ...newMediator, first_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0D3B66] focus:border-transparent"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={newMediator.last_name}
                    onChange={(e) => setNewMediator({ ...newMediator, last_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0D3B66] focus:border-transparent"
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#EE964B] text-white rounded-lg hover:bg-[#d97b33] transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Add Mediator
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Disputed Contract Assignments */}
        <div className="mb-8 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-[#0D3B66]">
              Assign Mediators to Disputed Contracts
            </h2>
            <p className="text-sm text-gray-500">
              {disputedContracts.length} disputed contract(s) awaiting mediator assignment
            </p>
          </div>

          {txMessage && (
            <div className="px-6 py-3 border-b border-gray-100 text-sm text-gray-600 flex items-center gap-2">
              <Zap className="h-4 w-4 text-[#0D3B66]" />
              {txMessage}
            </div>
          )}

          {disputedContracts.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              <Shield className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p>No disputed contracts need mediator assignment.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {activeMediators.length === 0 && (
                <div className="px-6 py-3 bg-amber-50 border-b border-amber-200">
                  <p className="text-sm text-amber-800">
                    <strong>No mediators available for assignment.</strong> Mediators must log in to{" "}
                    <code className="bg-amber-100 px-1 rounded">/resolve-disputes</code> at least once
                    to register their wallet address before they can be assigned to disputes.
                  </p>
                </div>
              )}
              {disputedContracts.map((contract) => {
                const jobTitle = contract.jobPosting?.title || "Untitled role";
                const employerName = contract.employer?.company_name || "Unknown employer";
                const employeeName = contract.employee
                  ? `${contract.employee.first_name || ""} ${contract.employee.last_name || ""}`.trim()
                  : "Unknown worker";
                const assignedMediator = contract.mediator?.email || "Unassigned";
                const selectedValue = assignmentSelection[contract.id] || "";
                const isAssigned = !!(contract.mediator_id || contract.mediator?.id);

                return (
                  <div key={contract.id} className="px-6 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium text-[#0D3B66]">{jobTitle}</p>
                      <p className="text-sm text-gray-500">
                        Employer: {employerName} · Worker: {employeeName}
                      </p>
                      <p className="text-xs text-gray-400">
                        Contract: {contract.contract_address}
                      </p>
                      <p className="text-xs text-gray-400">
                        Current mediator: {assignedMediator}
                      </p>
                    </div>
                    <div className="flex flex-col md:flex-row gap-2 md:items-center">
                      <select
                        value={selectedValue}
                        disabled={isAssigned}
                        onChange={(e) =>
                          setAssignmentSelection((prev) => ({
                            ...prev,
                            [contract.id]: e.target.value,
                          }))
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0D3B66] focus:border-transparent disabled:bg-gray-100"
                      >
                        <option value="">Select mediator</option>
                        {activeMediators.map((mediator) => (
                          <option key={mediator.id} value={mediator.id}>
                            {mediator.first_name && mediator.last_name
                              ? `${mediator.first_name} ${mediator.last_name}`
                              : mediator.email}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleAssignMediator(contract)}
                        disabled={isAssigned || !activeMediators.length || assigningId === contract.id || walletMismatch}
                        className="px-4 py-2 bg-[#0D3B66] text-white rounded-lg hover:bg-[#0a2d4d] transition-colors disabled:opacity-50 flex items-center gap-2"
                        title={walletMismatch ? "Wallet mismatch - connect correct admin wallet" : undefined}
                      >
                        {assigningId === contract.id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Assigning...
                          </>
                        ) : (
                          "Assign"
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Mediators List */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-[#0D3B66]">
              Approved Mediators
            </h2>
            <p className="text-sm text-gray-500">
              {mediators.length} mediator(s) registered
            </p>
          </div>

          {mediators.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              <Shield className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p>No mediators registered yet.</p>
              <p className="text-sm mt-1">
                Click "Add Mediator" to register your first mediator.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {mediators.map((mediator) => (
                <div
                  key={mediator.id}
                  className="px-6 py-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      mediator.status === "active"
                        ? "bg-green-100 text-green-600"
                        : "bg-gray-100 text-gray-400"
                    }`}>
                      {mediator.status === "active" ? (
                        <UserCheck className="h-5 w-5" />
                      ) : (
                        <UserX className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-[#0D3B66]">
                        {mediator.first_name && mediator.last_name
                          ? `${mediator.first_name} ${mediator.last_name}`
                          : mediator.email}
                      </p>
                      <p className="text-sm text-gray-500">{mediator.email}</p>
                      {mediator.wallet_address ? (
                        <p className="text-xs text-gray-400 font-mono">
                          {mediator.wallet_address.slice(0, 10)}...{mediator.wallet_address.slice(-8)}
                        </p>
                      ) : (
                        <p className="text-xs text-amber-600">
                          ⚠ No wallet — mediator must log in to /resolve-disputes first
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      mediator.status === "active" && mediator.wallet_address
                        ? "bg-green-100 text-green-700"
                        : mediator.status === "active"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {mediator.status === "active" && !mediator.wallet_address ? "needs login" : mediator.status}
                    </span>
                    <button
                      onClick={() => handleToggleStatus(mediator)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        mediator.status === "active"
                          ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                          : "bg-green-100 text-green-700 hover:bg-green-200"
                      }`}
                    >
                      {mediator.status === "active" ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => handleDelete(mediator)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete mediator"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminMediators;
