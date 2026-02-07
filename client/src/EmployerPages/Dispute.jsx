import React, { useEffect, useState } from "react";
import { Loader2, Shield, Clock, UserCheck, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import EmployerLayout from "../components/EmployerLayout";
import apiService from "../services/api";
import { useAuth } from "../hooks/useAuth";

const getStatusBadge = (dispute) => {
  if (dispute.resolved_at) {
    const isWorkerPaid = dispute.resolution === "worker_paid";
    const isEmployerRefunded = dispute.resolution === "employer_refunded";
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
        isWorkerPaid ? "bg-green-100 text-green-700" :
        isEmployerRefunded ? "bg-blue-100 text-blue-700" :
        "bg-gray-100 text-gray-700"
      }`}>
        <CheckCircle className="h-3 w-3" />
        {isWorkerPaid ? "Resolved - Worker Paid" :
         isEmployerRefunded ? "Resolved - Refunded" :
         dispute.resolution === "split" ? "Resolved - Split" :
         "Resolved"}
      </span>
    );
  }
  if (dispute.mediator_id) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
        <UserCheck className="h-3 w-3" />
        Mediator Assigned
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
      <Clock className="h-3 w-3" />
      Awaiting Mediator
    </span>
  );
};

const formatDate = (dateString) => {
  if (!dateString) return "--";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
};

const Dispute = () => {
  const { smartWalletAddress } = useAuth();
  const [employerId, setEmployerId] = useState(null);
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all, pending, resolved

  useEffect(() => {
    const fetchEmployer = async () => {
      if (!smartWalletAddress) {
        setLoading(false);
        return;
      }
      try {
        const response = await apiService.getEmployerByWallet(smartWalletAddress);
        if (response?.data?.id) {
          setEmployerId(response.data.id);
        }
      } catch (err) {
        console.error("Error fetching employer:", err);
        setError("Unable to load employer profile.");
      }
    };
    fetchEmployer();
  }, [smartWalletAddress]);

  useEffect(() => {
    const fetchDisputes = async () => {
      if (!employerId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const response = await apiService.getDisputesByEmployer(employerId);
        setDisputes(response?.data || []);
      } catch (err) {
        console.error("Error fetching disputes:", err);
        setError("Unable to load dispute history.");
      } finally {
        setLoading(false);
      }
    };
    fetchDisputes();
  }, [employerId]);

  const filtered = disputes.filter((d) => {
    // Filter by status
    if (filter === "pending" && d.resolved_at) return false;
    if (filter === "resolved" && !d.resolved_at) return false;

    // Filter by search term
    const term = search.toLowerCase();
    if (!term) return true;
    const title = d.deployedContract?.jobPosting?.title || "";
    const worker = `${d.raisedByEmployee?.first_name || ""} ${d.raisedByEmployee?.last_name || ""}`.trim();
    const employer = d.raisedByEmployer?.company_name || "";
    return title.toLowerCase().includes(term) ||
           worker.toLowerCase().includes(term) ||
           employer.toLowerCase().includes(term);
  });

  const stats = {
    total: disputes.length,
    pending: disputes.filter(d => !d.resolved_at).length,
    resolved: disputes.filter(d => d.resolved_at).length
  };

  return (
    <EmployerLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#0D3B66]">Compliance</h1>
          <p className="text-sm text-gray-500 mt-1">
            Complete dispute history and audit trail. Track all disputes — pending and resolved.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total Disputes</p>
            <p className="text-2xl font-semibold text-[#0D3B66]">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Pending</p>
            <p className="text-2xl font-semibold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Resolved</p>
            <p className="text-2xl font-semibold text-green-600">{stats.resolved}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            placeholder="Search by job title or worker name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 p-3 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#EE964B]"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="p-3 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#EE964B]"
          >
            <option value="all">All Disputes</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading dispute history...
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-600">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Shield className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-[#0D3B66] mb-1">No disputes</h3>
            <p className="text-sm text-gray-500">
              {search || filter !== "all"
                ? "No disputes match your filters."
                : "No disputes have been filed for your contracts."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((dispute) => {
              const contract = dispute.deployedContract;
              const raisedBy = dispute.raised_by_role === "employee"
                ? `${dispute.raisedByEmployee?.first_name || ""} ${dispute.raisedByEmployee?.last_name || ""}`.trim() || "Employee"
                : dispute.raisedByEmployer?.company_name || "Employer";

              return (
                <div
                  key={dispute.id}
                  className={`p-5 rounded-xl border bg-white ${
                    dispute.resolved_at ? "border-gray-200" : "border-yellow-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-[#0D3B66]">
                        {contract?.jobPosting?.title || "Contract Dispute"}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Filed by: {raisedBy} ({dispute.raised_by_role})
                      </p>
                    </div>
                    {getStatusBadge(dispute)}
                  </div>

                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-400">Filed On</p>
                      <p className="text-gray-700">{formatDate(dispute.raised_at)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Amount</p>
                      <p className="text-gray-700">
                        {contract?.payment_amount} {contract?.payment_currency || "USDC"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Mediator</p>
                      <p className="text-gray-700">
                        {dispute.mediator
                          ? `${dispute.mediator.first_name} ${dispute.mediator.last_name}`
                          : "Not assigned"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Resolved On</p>
                      <p className="text-gray-700">{formatDate(dispute.resolved_at)}</p>
                    </div>
                  </div>

                  {dispute.reason && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-100 rounded-lg">
                      <p className="text-xs font-medium text-yellow-700">Dispute Reason</p>
                      <p className="text-sm text-yellow-800 mt-0.5">{dispute.reason}</p>
                    </div>
                  )}

                  {dispute.resolution_notes && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-100 rounded-lg">
                      <p className="text-xs font-medium text-green-700">Resolution Notes</p>
                      <p className="text-sm text-green-800 mt-0.5">{dispute.resolution_notes}</p>
                    </div>
                  )}

                  {dispute.resolution_tx_hash && (
                    <div className="mt-3">
                      <a
                        href={`https://sepolia.basescan.org/tx/${dispute.resolution_tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                      >
                        View Resolution Transaction
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </EmployerLayout>
  );
};

export default Dispute;
