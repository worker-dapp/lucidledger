import React, { useState, useEffect } from "react";
import { getAddress } from "viem";
import apiService from "../../services/api";
import PostJobModal from "./PostJobModal";
import { Plus, Search, X, CheckCircle, CheckCircle2, XCircle, Clock, FileText, PlayCircle, UserPlus, UserCheck, DollarSign, Loader2, ExternalLink } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { sendSponsoredTransaction, encodeTransferData, TxSteps, parseAAError, getBasescanUrl } from "../../contracts/aaClient";

const USDC_ADDRESS = import.meta.env.VITE_USDC_ADDRESS;

const AssignRecruiterModal = ({ job, onClose, onSuccess }) => {
  const [search, setSearch] = useState("");
  const [recruiters, setRecruiters] = useState([]);
  const [loadingRecruiters, setLoadingRecruiters] = useState(false);
  const [selected, setSelected] = useState(null);
  const [feeAmount, setFeeAmount] = useState(job.recruiter_fee_amount || "");
  const [feeCurrency, setFeeCurrency] = useState(job.recruiter_fee_currency || "USD");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecruiters = async () => {
      setLoadingRecruiters(true);
      try {
        const response = await apiService.getAllRecruiters(search);
        setRecruiters(response?.data ?? []);
      } catch (err) {
        console.error("Error fetching recruiters:", err);
      } finally {
        setLoadingRecruiters(false);
      }
    };
    const timer = setTimeout(fetchRecruiters, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const handleSave = async () => {
    if (!selected) { setError("Please select a recruiter."); return; }
    setSaving(true);
    setError(null);
    try {
      await apiService.assignRecruiter(job.id, selected.id, feeAmount || null, feeCurrency);
      onSuccess();
    } catch (err) {
      setError(err?.message || "Failed to assign recruiter.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[#0D3B66]">Assign Recruiter</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Job: <span className="font-medium text-gray-700">{job.title}</span>
        </p>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or agency..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D3B66]"
          />
        </div>

        <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto mb-4">
          {loadingRecruiters ? (
            <div className="text-center py-4 text-sm text-gray-400">Loading...</div>
          ) : recruiters.length === 0 ? (
            <div className="text-center py-4 text-sm text-gray-400">No recruiters found</div>
          ) : (
            recruiters.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelected(r)}
                className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors ${selected?.id === r.id ? "bg-[#EEF5FF] text-[#0D3B66]" : "text-gray-700"}`}
              >
                <div className="font-medium">{r.first_name} {r.last_name}</div>
                {r.agency_name && <div className="text-xs text-gray-400">{r.agency_name}</div>}
                <div className="text-xs text-gray-400">{r.email}</div>
              </button>
            ))
          )}
        </div>

        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-600 mb-1">Recruiter Fee</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={feeAmount}
              onChange={(e) => setFeeAmount(e.target.value)}
              placeholder="0.00"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D3B66]"
            />
          </div>
          <div className="w-24">
            <label className="block text-xs font-medium text-gray-600 mb-1">Currency</label>
            <select
              value={feeCurrency}
              onChange={(e) => setFeeCurrency(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D3B66]"
            >
              <option>USD</option>
              <option>USDC</option>
            </select>
          </div>
        </div>

        {error && <p className="text-red-600 text-xs mb-3">{error}</p>}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving || !selected}
            className="flex-1 px-4 py-2 bg-[#0D3B66] text-white rounded-lg text-sm font-medium hover:bg-[#0a2d50] disabled:opacity-50">
            {saving ? "Assigning..." : "Assign Recruiter"}
          </button>
        </div>
      </div>
    </div>
  );
};

const PostedJobsTab = ({ employerId }) => {
  const { smartWalletClient, smartWalletAddress } = useAuth();
  const [jobPostings, setJobPostings] = useState([]);
  const [filteredPostings, setFilteredPostings] = useState([]);
  const [feePayments, setFeePayments] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [assignModalJob, setAssignModalJob] = useState(null);
  const [payingJobId, setPayingJobId] = useState(null);
  const [payError, setPayError] = useState(null);

  useEffect(() => {
    if (employerId) {
      fetchJobPostings();
      fetchFeePayments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loads on employer change by design; fetch fn identities are stable
  }, [employerId]);

  useEffect(() => {
    filterPostings();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-filters on postings/search change; filterPostings identity is stable
  }, [jobPostings, searchTerm]);

  const fetchJobPostings = async () => {
    if (!employerId) return;
    setLoading(true);
    try {
      const response = await apiService.getJobPostings(employerId);
      if (response?.success) setJobPostings(response.data || []);
    } catch (error) {
      console.error("Error fetching job postings:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeePayments = async () => {
    try {
      const response = await apiService.getRecruiterFeePayments({ employer_id: employerId });
      const byJobId = {};
      for (const payment of response?.data ?? []) {
        byJobId[payment.job_posting_id] = payment;
      }
      setFeePayments(byJobId);
    } catch (error) {
      console.error("Error fetching recruiter fee payments:", error);
    }
  };

  const handlePayRecruiterFee = async (posting) => {
    setPayError(null);
    if (!smartWalletClient || !smartWalletAddress) {
      setPayError("Please connect your wallet first.");
      return;
    }
    if (!posting.recruiter?.wallet_address) {
      setPayError("This recruiter has no wallet on file yet.");
      return;
    }
    setPayingJobId(posting.id);
    try {
      const data = encodeTransferData(getAddress(posting.recruiter.wallet_address), posting.recruiter_fee_amount);
      const result = await sendSponsoredTransaction({
        smartWalletClient,
        to: getAddress(USDC_ADDRESS),
        data,
      });

      await apiService.createRecruiterFeePayment({
        job_posting_id: posting.id,
        recruiter_id: posting.recruiter_id,
        employer_id: employerId,
        fee_amount: posting.recruiter_fee_amount,
        fee_currency: posting.recruiter_fee_currency || "USD",
        tx_hash: result.hash,
      });

      await fetchFeePayments();
    } catch (error) {
      console.error("Error paying recruiter fee:", error);
      setPayError(parseAAError(error));
    } finally {
      setPayingJobId(null);
    }
  };

  const filterPostings = () => {
    let filtered = jobPostings.filter((p) =>
      ["active", "draft", "in_progress", "completed"].includes(p.status)
    );
    if (searchTerm) {
      filtered = filtered.filter((p) =>
        p.title?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredPostings(filtered);
  };

  const handleActivate = async (postingId) => {
    try {
      await apiService.activateJobPosting(postingId);
      await fetchJobPostings();
    } catch (error) {
      console.error("Error activating job posting:", error);
      alert("Failed to activate job posting: " + error.message);
    }
  };

  const handleRemove = async (postingId) => {
    if (!window.confirm("Remove this job posting? It will no longer be visible to workers. Any filled contracts remain accessible in the Workforce Dashboard.")) return;
    try {
      await apiService.deleteJobPosting(postingId);
      await fetchJobPostings();
    } catch (error) {
      console.error("Error removing job posting:", error);
      alert("Failed to remove job posting: " + error.message);
    }
  };

  const handleUnassignRecruiter = async (postingId) => {
    if (!window.confirm("Remove recruiter assignment from this job?")) return;
    try {
      await apiService.unassignRecruiter(postingId);
      await fetchJobPostings();
    } catch (error) {
      console.error("Error unassigning recruiter:", error);
      alert("Failed to remove recruiter: " + error.message);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { classes: "bg-gray-50 text-gray-700", icon: Clock, label: "Draft" },
      active: { classes: "bg-green-50 text-green-700", icon: CheckCircle, label: "Active" },
      in_progress: { classes: "bg-blue-50 text-blue-700", icon: PlayCircle, label: "In Progress" },
      completed: { classes: "bg-emerald-50 text-emerald-700", icon: CheckCircle2, label: "Completed" },
      closed: { classes: "bg-red-50 text-red-700", icon: XCircle, label: "Closed" },
    };
    const config = statusConfig[status] || statusConfig.draft;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 ${config.classes} text-xs font-medium rounded`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    );
  };

  if (!employerId) return <div className="text-center py-8 text-gray-600">Please complete your employer profile to post jobs.</div>;
  if (loading) return <div className="text-center py-8 text-gray-600">Loading job postings...</div>;

  return (
    <div>
      {payError && (
        <div className="mb-4 flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm">
          {payError}
        </div>
      )}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search job postings..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EE964B] focus:border-transparent"
          />
        </div>
        <button
          onClick={() => setIsPostModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#EE964B] text-white rounded-lg hover:bg-[#d88542] transition-colors"
        >
          <Plus className="h-5 w-5" />
          Post New Job
        </button>
      </div>

      {filteredPostings.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            {searchTerm ? "No matching job postings" : "No active job postings"}
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {searchTerm ? "Try adjusting your search" : "Create a new job posting to start recruiting"}
          </p>
          {!searchTerm && (
            <button onClick={() => setIsPostModalOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-[#EE964B] text-white rounded-lg hover:bg-[#d88542] transition-colors">
              <Plus className="h-5 w-5" />
              Post New Job
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job Title</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Positions</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applications</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recruiter</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPostings.map((posting) => (
                <tr key={posting.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{posting.title}</div>
                    {posting.location && <div className="text-xs text-gray-500">{posting.location}</div>}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{posting.positions_filled || 0} / {posting.positions_available}</div>
                    <div className="text-xs text-gray-500">filled</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{posting.application_count || 0}</div>
                    <div className="text-xs text-gray-500">{posting.accepted_count || 0} accepted</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {posting.recruiter_id ? (
                      <div className="flex items-center gap-1.5">
                        <UserCheck className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-gray-700 truncate max-w-[120px]">
                            {posting.recruiter?.agency_name || `${posting.recruiter?.first_name ?? ""} ${posting.recruiter?.last_name ?? ""}`.trim() || "Assigned"}
                          </div>
                          {posting.recruiter_fee_amount && (
                            <div className="text-xs text-green-600">
                              {parseFloat(posting.recruiter_fee_amount).toLocaleString()} {posting.recruiter_fee_currency}
                            </div>
                          )}
                          {posting.recruiter_fee_amount && (
                            feePayments[posting.id]?.payment_status === "paid" ? (
                              <a
                                href={getBasescanUrl(feePayments[posting.id].tx_hash, "tx")}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-green-700 hover:underline mt-0.5"
                              >
                                <DollarSign className="h-3 w-3" /> Paid <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : (
                              <button
                                onClick={() => handlePayRecruiterFee(posting)}
                                disabled={payingJobId === posting.id}
                                className="flex items-center gap-1 text-xs text-[#0D3B66] hover:text-[#EE964B] transition-colors mt-0.5 disabled:opacity-50"
                              >
                                {payingJobId === posting.id ? (
                                  <><Loader2 className="h-3 w-3 animate-spin" /> Paying...</>
                                ) : (
                                  <><DollarSign className="h-3 w-3" /> Pay Fee</>
                                )}
                              </button>
                            )
                          )}
                        </div>
                        <button onClick={() => handleUnassignRecruiter(posting.id)} className="text-gray-300 hover:text-red-500 ml-1" title="Remove recruiter">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAssignModalJob(posting)}
                        className="flex items-center gap-1 text-xs text-[#0D3B66] hover:text-[#EE964B] transition-colors"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        Assign
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">{getStatusBadge(posting.status)}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      {(posting.status === "draft" || posting.status === "completed") && (
                        <button onClick={() => handleActivate(posting.id)} className="text-green-600 hover:text-green-800" title={posting.status === "completed" ? "Reactivate" : "Activate"}>
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                      <button onClick={() => handleRemove(posting.id)} className="text-gray-400 hover:text-red-600" title="Remove">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isPostModalOpen && (
        <PostJobModal
          employerId={employerId}
          onClose={() => setIsPostModalOpen(false)}
          onSuccess={() => { setIsPostModalOpen(false); fetchJobPostings(); }}
        />
      )}

      {assignModalJob && (
        <AssignRecruiterModal
          job={assignModalJob}
          employerId={employerId}
          onClose={() => setAssignModalJob(null)}
          onSuccess={() => { setAssignModalJob(null); fetchJobPostings(); }}
        />
      )}
    </div>
  );
};

export default PostedJobsTab;
