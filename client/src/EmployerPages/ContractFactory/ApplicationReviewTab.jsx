import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle, Search, Users, XCircle } from "lucide-react";
import apiService from "../../services/api";

const statusBadgeStyles = {
  pending: "bg-blue-100 text-blue-800",
  accepted: "bg-green-100 text-green-800",
  signed: "bg-purple-100 text-purple-800",
  rejected: "bg-red-100 text-red-800",
  deployed: "bg-gray-100 text-gray-700",
};

const ApplicationReviewTab = ({ employerId }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [jobFilter, setJobFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [message, setMessage] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [lastSelectedId, setLastSelectedId] = useState(null);
  const isPendingView = statusFilter === "pending";
  const isAllView = statusFilter === "all";

  const isPendingStatus = (status) => !status || status === "pending";
  const isArchivedStatus = (status) => status === "rejected" || status === "deployed";

  const fetchApplications = async () => {
    if (!employerId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const statusParam = statusFilter === "all" ? null : statusFilter;
      const jobParam = jobFilter || null;
      const response = await apiService.getApplicationsByEmployer(employerId, statusParam, jobParam);
      const data = response?.data || [];
      setApplications(data);
      if (data.length === 0) {
        setSelectedApplication(null);
      } else if (!selectedApplication) {
        setSelectedApplication(data[0]);
      } else {
        const match = data.find((application) => application.id === selectedApplication.id);
        setSelectedApplication(match || data[0]);
      }
    } catch (error) {
      setMessage(error.message || "Failed to load applications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [employerId, statusFilter, jobFilter]);

  useEffect(() => {
    setSelectedIds(new Set());
    setSelectedApplication(null);
  }, [statusFilter, jobFilter]);

  const jobOptions = useMemo(() => {
    const map = new Map();
    applications.forEach((application) => {
      const job = application.job;
      if (job && !map.has(job.id)) {
        map.set(job.id, job.title || `Job ${job.id}`);
      }
    });
    return Array.from(map.entries());
  }, [applications]);

  const filteredApplications = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return applications.filter((application) => {
      const status = application.application_status || "pending";
      if (!showArchived && isArchivedStatus(status)) {
        return false;
      }
      const employeeName = `${application?.employee?.first_name || ""} ${application?.employee?.last_name || ""}`.trim();
      const jobTitle = application?.job?.title || "";
      if (!term) {
        return true;
      }
      return employeeName.toLowerCase().includes(term) || jobTitle.toLowerCase().includes(term);
    });
  }, [applications, searchTerm, showArchived]);

  useEffect(() => {
    if (!selectedApplication) {
      const fallback = lastSelectedId
        ? filteredApplications.find((application) => application.id === lastSelectedId)
        : null;
      setSelectedApplication(fallback || filteredApplications[0] || null);
      return;
    }
    const stillVisible = filteredApplications.some((application) => application.id === selectedApplication.id);
    if (!stillVisible) {
      const fallback = lastSelectedId
        ? filteredApplications.find((application) => application.id === lastSelectedId)
        : null;
      setSelectedApplication(fallback || filteredApplications[0] || null);
    }
  }, [filteredApplications, selectedApplication, lastSelectedId]);

  const toggleSelect = (id, status) => {
    if (!isPendingStatus(status)) {
      return;
    }
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    const selectableIds = filteredApplications
      .filter((application) => isPendingStatus(application.application_status))
      .map((application) => application.id);
    if (selectedIds.size === selectableIds.length) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(selectableIds));
  };

  const handleUpdateStatus = async (applicationId, status) => {
    setMessage("");
    try {
      await apiService.updateApplicationStatus(applicationId, status);
      await fetchApplications();
      setSelectedIds(new Set());
    } catch (error) {
      setMessage(error.message || "Unable to update application.");
    }
  };

  const handleBulkUpdate = async (status) => {
    if (selectedIds.size === 0) {
      setMessage("Select at least one application.");
      return;
    }
    setMessage("");
    try {
      await apiService.bulkUpdateApplicationStatus(Array.from(selectedIds), status);
      await fetchApplications();
      setSelectedIds(new Set());
    } catch (error) {
      setMessage(error.message || "Unable to update applications.");
    }
  };

  const formatDate = (value) => {
    if (!value) return "--";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "--";
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-600">
        Loading applications...
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-[#0D3B66]">Application Review</h2>
          <p className="text-sm text-gray-500">Review applications and issue offers.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {["all", "pending", "accepted", "signed", "rejected"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-full text-xs font-semibold border ${
                statusFilter === status
                  ? "border-[#EE964B] text-[#EE964B] bg-[#FFF4E6]"
                  : "border-gray-200 text-gray-500 bg-white hover:border-gray-300"
              }`}
            >
              {status === "all" ? "All Applications" : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-2/5 bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b border-gray-200 space-y-3">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <Users className="h-4 w-4" />
              <span>{filteredApplications.length} applications</span>
              <label className="flex items-center gap-2 text-xs text-gray-500">
                <input
                  type="checkbox"
                  checked={showArchived}
                  onChange={(event) => setShowArchived(event.target.checked)}
                  className="rounded border-gray-300 text-[#EE964B] focus:ring-[#EE964B]"
                />
                View archived
              </label>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by name or role..."
                className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#EE964B]"
              />
            </div>
            <select
              value={jobFilter}
              onChange={(event) => setJobFilter(event.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#EE964B]"
            >
              <option value="">All job postings</option>
              {jobOptions.map(([id, title]) => (
                <option key={id} value={id}>
                  {title}
                </option>
              ))}
            </select>

            {(isPendingView || isAllView) && (
              <div className="flex items-center justify-between text-xs text-gray-500">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={
                      filteredApplications.length > 0 &&
                      selectedIds.size ===
                        filteredApplications.filter((application) => isPendingStatus(application.application_status)).length
                    }
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-[#EE964B] focus:ring-[#EE964B]"
                  />
                  Select all
                </label>
                <span>{selectedIds.size} selected</span>
              </div>
            )}
          </div>

          <div className="max-h-[560px] overflow-y-auto divide-y divide-gray-100">
            {filteredApplications.map((application) => {
              const employee = application.employee;
              const job = application.job;
              const status = application.application_status || "pending";
              return (
                <div
                  key={application.id}
                  onClick={() => {
                    setSelectedApplication(application);
                    setLastSelectedId(application.id);
                  }}
                  className={`p-4 cursor-pointer hover:bg-gray-50 ${
                    selectedApplication?.id === application.id ? "bg-[#FFF9F2]" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {(isPendingView || isAllView) && (
                        <input
                          type="checkbox"
                          checked={selectedIds.has(application.id)}
                          disabled={!isPendingStatus(status)}
                          onChange={(event) => {
                            event.stopPropagation();
                            toggleSelect(application.id, status);
                          }}
                          className="mt-1 rounded border-gray-300 text-[#EE964B] focus:ring-[#EE964B] disabled:cursor-not-allowed disabled:opacity-40"
                        />
                      )}
                      <div>
                        <p className="font-semibold text-[#0D3B66]">
                          {employee?.first_name || "Unknown"} {employee?.last_name || ""}
                        </p>
                        <p className="text-xs text-gray-500">{employee?.email || ""}</p>
                        <p className="text-xs text-gray-500">{job?.title || "Job role"}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadgeStyles[status] || "bg-gray-100 text-gray-600"}`}>
                      {status}
                    </span>
                  </div>
                </div>
              );
            })}
            {filteredApplications.length === 0 && (
              <div className="p-6 text-center text-sm text-gray-500">
                No applications match this filter.
              </div>
            )}
          </div>

          {isPendingView && (
            <div className="p-4 border-t border-gray-200 flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => handleBulkUpdate("accepted")}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors"
              >
                Accept Selected
              </button>
              <button
                onClick={() => handleBulkUpdate("rejected")}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors"
              >
                Reject Selected
              </button>
            </div>
          )}
        </div>

        <div className="lg:w-3/5 bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-[#0D3B66] mb-4">Applicant Detail</h3>
          {!selectedApplication && (
            <p className="text-sm text-gray-500">Select an application to review details.</p>
          )}
          {selectedApplication && (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-400">Applicant</p>
                  <p className="text-lg font-semibold text-[#0D3B66]">
                    {selectedApplication.employee?.first_name || "Unknown"} {selectedApplication.employee?.last_name || ""}
                  </p>
                  <p className="text-sm text-gray-500">{selectedApplication.employee?.email || ""}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadgeStyles[selectedApplication.application_status || "pending"] || "bg-gray-100 text-gray-600"}`}>
                  {selectedApplication.application_status || "pending"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <p className="text-xs uppercase text-gray-400">Role</p>
                  <p>{selectedApplication.job?.title || "--"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-400">Applied On</p>
                  <p>{formatDate(selectedApplication.applied_at)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-400">Offer Sent</p>
                  <p>{formatDate(selectedApplication.offer_sent_at)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-400">Offer Signed</p>
                  <p>{formatDate(selectedApplication.offer_accepted_at)}</p>
                </div>
              </div>

              {(() => {
                const emp = selectedApplication.employee;
                const location = [emp?.city, emp?.country].filter(Boolean).join(", ");
                let skills = [];
                try {
                  skills = emp?.skills ? JSON.parse(emp.skills) : [];
                } catch {
                  skills = [];
                }
                const experience = Array.isArray(emp?.work_experience) ? emp.work_experience : [];
                const hasProfile = location || skills.length > 0 || experience.length > 0;

                return hasProfile ? (
                  <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
                    <p className="font-semibold text-[#0D3B66] mb-3">Worker Profile</p>
                    {location && (
                      <div className="mb-3">
                        <p className="text-xs uppercase text-gray-400 mb-1">Location</p>
                        <p>{location}</p>
                      </div>
                    )}
                    {skills.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs uppercase text-gray-400 mb-1">Skills</p>
                        <div className="flex flex-wrap gap-1">
                          {skills.map((skill, i) => (
                            <span key={i} className="px-2 py-0.5 bg-[#FFF4E6] text-[#EE964B] rounded-full text-xs font-medium">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {experience.length > 0 && (
                      <div>
                        <p className="text-xs uppercase text-gray-400 mb-1">Work Experience</p>
                        <div className="space-y-1">
                          {experience.map((exp, i) => (
                            <div key={i} className="flex justify-between">
                              <span className="font-medium text-[#0D3B66]">{exp.title}</span>
                              <span className="text-xs text-gray-400">
                                {exp.startDate || ""}
                                {exp.endDate ? ` – ${exp.endDate}` : exp.startDate ? " – Present" : ""}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null;
              })()}

              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
                <p className="font-semibold text-[#0D3B66] mb-2">Offer Letter</p>
                <p className="mb-1">
                  Position: <span className="font-medium">{selectedApplication.job?.title || "Role"}</span>
                </p>
                <p className="mb-1">
                  Compensation: {selectedApplication.job?.currency || "USD"} {selectedApplication.job?.salary || "--"} / {selectedApplication.job?.pay_frequency || "--"}
                </p>
                <p className="text-xs text-gray-500">
                  Offer is issued upon acceptance and will move to Awaiting Deployment once signed.
                </p>
              </div>

              {isPendingStatus(selectedApplication.application_status) && (
                <p className="text-xs text-gray-500">
                  Use the bulk actions in the left panel to accept or reject pending applicants.
                </p>
              )}
            </div>
          )}
          {message && <p className="mt-4 text-sm text-amber-700">{message}</p>}
        </div>
      </div>
    </div>
  );
};

export default ApplicationReviewTab;
