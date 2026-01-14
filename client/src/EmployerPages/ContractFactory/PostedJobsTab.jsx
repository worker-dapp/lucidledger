import React, { useState, useEffect } from "react";
import apiService from "../../services/api";
import PostJobModal from "./PostJobModal";
import { Plus, Search, Filter, Eye, Edit, Trash2, CheckCircle, XCircle, Clock, FileText } from "lucide-react";

const PostedJobsTab = ({ employerId }) => {
  const [jobPostings, setJobPostings] = useState([]);
  const [filteredPostings, setFilteredPostings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  useEffect(() => {
    if (employerId) {
      fetchJobPostings();
    }
  }, [employerId]);

  useEffect(() => {
    filterPostings();
  }, [jobPostings, searchTerm, statusFilter]);

  const fetchJobPostings = async () => {
    if (!employerId) return;

    setLoading(true);
    try {
      const response = await apiService.getJobPostings(employerId);
      if (response?.success) {
        setJobPostings(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching job postings:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterPostings = () => {
    let filtered = [...jobPostings];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((posting) =>
        posting.title?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((posting) => posting.status === statusFilter);
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

  const handleClose = async (postingId) => {
    if (!window.confirm("Are you sure you want to close this job posting?")) {
      return;
    }

    try {
      await apiService.closeJobPosting(postingId);
      await fetchJobPostings();
    } catch (error) {
      console.error("Error closing job posting:", error);
      alert("Failed to close job posting: " + error.message);
    }
  };

  const handleDelete = async (postingId) => {
    if (!window.confirm("Are you sure you want to delete this job posting? This action cannot be undone.")) {
      return;
    }

    try {
      await apiService.deleteJobPosting(postingId);
      await fetchJobPostings();
    } catch (error) {
      console.error("Error deleting job posting:", error);
      alert("Failed to delete job posting: " + error.message);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { color: "gray", icon: Clock, label: "Draft" },
      active: { color: "green", icon: CheckCircle, label: "Active" },
      closed: { color: "red", icon: XCircle, label: "Closed" },
    };

    const config = statusConfig[status] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 bg-${config.color}-50 text-${config.color}-700 text-xs font-medium rounded`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    );
  };

  if (!employerId) {
    return (
      <div className="text-center py-8 text-gray-600">
        Please complete your employer profile to post jobs.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-600">
        Loading job postings...
      </div>
    );
  }

  return (
    <div>
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        {/* Search */}
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

        {/* Filter & Post Button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EE964B] focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <button
            onClick={() => setIsPostModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#EE964B] text-white rounded-lg hover:bg-[#d88542] transition-colors"
          >
            <Plus className="h-5 w-5" />
            Post New Job
          </button>
        </div>
      </div>

      {/* Job Postings Table */}
      {filteredPostings.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            {searchTerm || statusFilter !== "all" ? "No matching job postings" : "No job postings yet"}
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {searchTerm || statusFilter !== "all"
              ? "Try adjusting your search or filters"
              : "Create your first job posting from a template"}
          </p>
          {!searchTerm && statusFilter === "all" && (
            <button
              onClick={() => setIsPostModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#EE964B] text-white rounded-lg hover:bg-[#d88542] transition-colors"
            >
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Job Title
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Positions
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applications
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPostings.map((posting) => (
                <tr key={posting.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {posting.title}
                    </div>
                    {posting.location && (
                      <div className="text-xs text-gray-500">{posting.location}</div>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {posting.positions_filled || 0} / {posting.positions_available}
                    </div>
                    <div className="text-xs text-gray-500">filled</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {posting.application_count || 0}
                    </div>
                    <div className="text-xs text-gray-500">
                      {posting.accepted_count || 0} accepted
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {getStatusBadge(posting.status)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      {posting.status === "draft" && (
                        <button
                          onClick={() => handleActivate(posting.id)}
                          className="text-green-600 hover:text-green-800"
                          title="Activate"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                      {posting.status === "active" && (
                        <button
                          onClick={() => handleClose(posting.id)}
                          className="text-orange-600 hover:text-orange-800"
                          title="Close"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => alert("Edit functionality coming soon")}
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(posting.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Post Job Modal */}
      {isPostModalOpen && (
        <PostJobModal
          employerId={employerId}
          onClose={() => setIsPostModalOpen(false)}
          onSuccess={() => {
            setIsPostModalOpen(false);
            fetchJobPostings();
          }}
        />
      )}
    </div>
  );
};

export default PostedJobsTab;
