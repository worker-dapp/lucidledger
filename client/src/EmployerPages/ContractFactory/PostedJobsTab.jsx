import React, { useState, useEffect } from "react";
import apiService from "../../services/api";
import PostJobModal from "./PostJobModal";
import { Plus, Search, X, CheckCircle, CheckCircle2, XCircle, Clock, FileText, PlayCircle } from "lucide-react";

const PostedJobsTab = ({ employerId }) => {
  const [jobPostings, setJobPostings] = useState([]);
  const [filteredPostings, setFilteredPostings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  // Status filter removed - Posted Jobs only shows active/draft jobs
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  useEffect(() => {
    if (employerId) {
      fetchJobPostings();
    }
  }, [employerId]);

  useEffect(() => {
    filterPostings();
  }, [jobPostings, searchTerm]);

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
    // Show active, draft, and in_progress jobs that still have open positions
    let filtered = jobPostings.filter((posting) =>
      posting.status === "active" ||
      posting.status === "draft" ||
      (posting.status === "in_progress" && (posting.positions_filled || 0) < posting.positions_available)
    );

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((posting) =>
        posting.title?.toLowerCase().includes(searchTerm.toLowerCase())
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
    if (!window.confirm("Remove this job posting? It will no longer be visible to workers. Any filled contracts remain accessible in the Workforce Dashboard.")) {
      return;
    }

    try {
      await apiService.deleteJobPosting(postingId);
      await fetchJobPostings();
    } catch (error) {
      console.error("Error removing job posting:", error);
      alert("Failed to remove job posting: " + error.message);
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

        {/* Post Button */}
        <div className="flex items-center gap-3">
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
            {searchTerm ? "No matching job postings" : "No active job postings"}
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {searchTerm
              ? "Try adjusting your search"
              : "Create a new job posting to start recruiting"}
          </p>
          {!searchTerm && (
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
                  Remove
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
                      <button
                        onClick={() => handleRemove(posting.id)}
                        className="text-gray-400 hover:text-red-600"
                        title="Remove"
                      >
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
