import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CheckCircle,
  Clock,
  Loader2,
  LogOut,
  Shield,
  XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import apiService from "../services/api";
import { useAuth } from "../hooks/useAuth";
import LogoutButton from "../components/LogoutButton";

const AdminEmployers = () => {
  const { user, login, smartWalletAddress } = useAuth();

  const [loading, setLoading] = useState(true);
  const [employers, setEmployers] = useState([]);
  const [statusCounts, setStatusCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [processingId, setProcessingId] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingEmployer, setRejectingEmployer] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckComplete, setAdminCheckComplete] = useState(false);

  const userEmail = user?.email?.address?.toLowerCase() || "";

  // Check admin status
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user && !smartWalletAddress) {
        setAdminCheckComplete(true);
        return;
      }

      try {
        const response = await apiService.getAllEmployersForAdmin();
        if (response.success) {
          setIsAdmin(true);
        }
      } catch (err) {
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

  // Fetch employers after admin check completes
  useEffect(() => {
    const fetchEmployers = async () => {
      if (!adminCheckComplete || !isAdmin) {
        setLoading(false);
        return;
      }

      try {
        const response = await apiService.getAllEmployersForAdmin(statusFilter);
        if (response.success) {
          setEmployers(response.data);
          setStatusCounts(response.statusCounts || { pending: 0, approved: 0, rejected: 0 });
        }
      } catch (err) {
        console.error("Error fetching employers:", err);
        setError(err.message || "Failed to fetch employers");
      } finally {
        setLoading(false);
      }
    };

    fetchEmployers();
  }, [adminCheckComplete, isAdmin, statusFilter]);

  const handleApprove = async (employer) => {
    setProcessingId(employer.id);
    setError("");
    setSuccess("");

    try {
      const response = await apiService.approveEmployer(employer.id);
      if (response.success) {
        setEmployers(employers.filter(e => e.id !== employer.id));
        setStatusCounts(prev => ({
          ...prev,
          pending: Math.max(0, prev.pending - 1),
          approved: prev.approved + 1
        }));
        setSuccess(`${employer.company_name || employer.email} has been approved`);
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      console.error("Error approving employer:", err);
      setError(err.message || "Failed to approve employer");
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectModal = (employer) => {
    setRejectingEmployer(employer);
    setRejectionReason("");
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError("Please provide a reason for rejection");
      return;
    }

    setProcessingId(rejectingEmployer.id);
    setError("");
    setSuccess("");

    try {
      const response = await apiService.rejectEmployer(rejectingEmployer.id, rejectionReason);
      if (response.success) {
        setEmployers(employers.filter(e => e.id !== rejectingEmployer.id));
        setStatusCounts(prev => ({
          ...prev,
          pending: Math.max(0, prev.pending - 1),
          rejected: prev.rejected + 1
        }));
        setSuccess(`${rejectingEmployer.company_name || rejectingEmployer.email} has been rejected`);
        setTimeout(() => setSuccess(""), 3000);
        setShowRejectModal(false);
        setRejectingEmployer(null);
        setRejectionReason("");
      }
    } catch (err) {
      console.error("Error rejecting employer:", err);
      setError(err.message || "Failed to reject employer");
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
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

  if (!user && !smartWalletAddress) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-md text-center">
          <Shield className="h-12 w-12 text-blue-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-800 mb-2">
            Administrator Login
          </h1>
          <p className="text-gray-600 mb-6">
            Sign in with your authorized email address to access employer management.
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
              <Building2 className="h-8 w-8 text-[#0D3B66]" />
              <div>
                <h1 className="text-xl font-semibold text-[#0D3B66]">
                  Admin: Employer Approvals
                </h1>
                <p className="text-sm text-gray-500">
                  Review and approve employer accounts
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

      <main className="container mx-auto px-6 py-8 max-w-5xl">
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-gray-800">{statusCounts.pending}</p>
                <p className="text-sm text-gray-500">Pending Review</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-gray-800">{statusCounts.approved}</p>
                <p className="text-sm text-gray-500">Approved</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-gray-800">{statusCounts.rejected}</p>
                <p className="text-sm text-gray-500">Rejected</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {["pending", "approved", "rejected"].map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setLoading(true);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === status
                  ? "bg-[#0D3B66] text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {status === "pending" && statusCounts.pending > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-700">
                  {statusCounts.pending}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Employers List */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-[#0D3B66]">
              {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Employers
            </h2>
            <p className="text-sm text-gray-500">
              {employers.length} employer(s)
            </p>
          </div>

          {employers.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p>No {statusFilter} employers found.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {employers.map((employer) => (
                <div
                  key={employer.id}
                  className="px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex-1">
                    <p className="font-medium text-[#0D3B66] text-lg">
                      {employer.company_name || "No company name"}
                    </p>

                    {/* Contact Info */}
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                      <div>
                        <span className="text-gray-500">Contact: </span>
                        <span className="text-gray-700">{employer.first_name} {employer.last_name}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Email: </span>
                        <span className="text-gray-700">{employer.email || "Not provided"}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Phone: </span>
                        <span className="text-gray-700">
                          {employer.phone_number
                            ? `${employer.country_code ? `+${employer.country_code} ` : ""}${employer.phone_number}`
                            : "Not provided"}
                        </span>
                      </div>
                      {employer.website && (
                        <div>
                          <span className="text-gray-500">Website: </span>
                          <span className="text-gray-700">{employer.website}</span>
                        </div>
                      )}
                    </div>

                    {/* Address */}
                    {(employer.street_address || employer.city) && (
                      <div className="mt-2 text-sm">
                        <span className="text-gray-500">Address: </span>
                        <span className="text-gray-700">
                          {[
                            employer.street_address,
                            employer.street_address2,
                            employer.city,
                            employer.state,
                            employer.zip_code,
                            employer.country,
                          ].filter(Boolean).join(", ")}
                        </span>
                      </div>
                    )}

                    {/* Company Details */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                      {employer.industry && <span>Industry: {employer.industry}</span>}
                      {employer.company_size && <span>Size: {employer.company_size}</span>}
                      <span>Registered: {formatDate(employer.created_at)}</span>
                    </div>

                    {employer.company_description && (
                      <p className="mt-2 text-sm text-gray-600 bg-gray-50 rounded px-3 py-2 max-h-40 overflow-y-auto">
                        {employer.company_description}
                      </p>
                    )}

                    {employer.rejection_reason && (
                      <p className="mt-2 text-sm text-red-600 bg-red-50 rounded px-2 py-1">
                        Rejection reason: {employer.rejection_reason}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {statusFilter === "pending" && (
                      <>
                        <button
                          onClick={() => handleApprove(employer)}
                          disabled={processingId === employer.id}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                          {processingId === employer.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                          Approve
                        </button>
                        <button
                          onClick={() => openRejectModal(employer)}
                          disabled={processingId === employer.id}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                          <XCircle className="h-4 w-4" />
                          Reject
                        </button>
                      </>
                    )}
                    {statusFilter === "approved" && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                        Approved {employer.approved_at && `on ${formatDate(employer.approved_at)}`}
                      </span>
                    )}
                    {statusFilter === "rejected" && (
                      <button
                        onClick={() => handleApprove(employer)}
                        disabled={processingId === employer.id}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        {processingId === employer.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                        Approve
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Reject Employer
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Rejecting <strong>{rejectingEmployer?.company_name || rejectingEmployer?.email}</strong>.
              Their job postings will be paused.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Provide a reason for rejection (required)..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0D3B66] focus:border-transparent resize-none"
              rows={4}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleReject}
                disabled={!rejectionReason.trim() || processingId}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processingId ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  "Confirm Rejection"
                )}
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectingEmployer(null);
                  setRejectionReason("");
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEmployers;
