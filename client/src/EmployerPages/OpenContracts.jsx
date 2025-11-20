import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import EmployerNavbar from "../components/EmployerNavbar";
import apiService from '../services/api';

const OpenContracts = () => {
  const { user } = useDynamicContext();
  const navigate = useNavigate();
  
  // --------------------------------------------------------------------------
  // STATE
  // --------------------------------------------------------------------------
  const [employerId, setEmployerId] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);

  // --------------------------------------------------------------------------
  // FETCH EMPLOYER ID FROM DATABASE
  // --------------------------------------------------------------------------
  useEffect(() => {
    const fetchEmployerId = async () => {
      if (!user?.email) {
        console.error("No email available");
        setLoading(false);
        return;
      }

      try {
        // Directly fetch employer ID from employer table
        const employerResponse = await apiService.getEmployerByEmail(user.email);
        
        if (employerResponse.data && employerResponse.data.id) {
          setEmployerId(employerResponse.data.id);
        } else {
          console.error("Employer not found");
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching employer ID:", error);
        setLoading(false);
      }
    };
    
    if (user?.email) {
      fetchEmployerId();
    }
  }, [user?.email]);

  // --------------------------------------------------------------------------
  // FETCH JOBS USING EMPLOYER ID
  // --------------------------------------------------------------------------
  useEffect(() => {
    const fetchJobs = async () => {
      if (!employerId) return;

      try {
        setLoading(true);
        
        // Directly use employer_id from database
        const response = await apiService.getJobsByEmployer(employerId);
        const data = response.data || [];
        
        setContracts(data);
      } catch (error) {
        console.error("Error fetching jobs:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (employerId) {
      fetchJobs();
    }
  }, [employerId]);

  // --------------------------------------------------------------------------
  // ENSURE FIRST JOB IS SELECTED WHEN JOBS CHANGE
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (contracts.length > 0 && !selectedJob) {
      setSelectedJob(contracts[0]);
    }
  }, [contracts, selectedJob]);

  // --------------------------------------------------------------------------
  // HANDLE JOB CLICK
  // --------------------------------------------------------------------------
  const handleJobClick = (job) => {
    setSelectedJob(job);
  };

  // --------------------------------------------------------------------------
  // HANDLE EDIT JOB
  // --------------------------------------------------------------------------
  const handleEditJob = () => {
    if (!selectedJob) return;
    // Navigate to job edit page with job ID
    navigate(`/job?edit=${selectedJob.id}`, { state: { job: selectedJob } });
  };

  // --------------------------------------------------------------------------
  // HANDLE JOB STATUS UPDATE
  // --------------------------------------------------------------------------
  const handleJobStatusUpdate = async (jobId, newStatus) => {
    try {
      // Update job status via API
      await apiService.updateJobStatus(jobId, newStatus);
      
      // Update local state
      setContracts((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, status: newStatus } : j))
      );
      
      // If selected job was updated, update it too
      if (selectedJob && selectedJob.id === jobId) {
        setSelectedJob({ ...selectedJob, status: newStatus });
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      alert("Something went wrong!");
    }
  };

  // --------------------------------------------------------------------------
  // ACTIVATE JOB
  // --------------------------------------------------------------------------
  const handleActivateJob = async () => {
    if (!selectedJob) return;

    try {
      await handleJobStatusUpdate(selectedJob.id, 'active');
    } catch (err) {
      console.error("Unexpected error:", err);
      alert("Something went wrong!");
    }
  };

  // --------------------------------------------------------------------------
  // FORMAT DATE
  // --------------------------------------------------------------------------
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-50">
      <EmployerNavbar />
      
      <div className="h-full">
        {/* TOP BAR */}
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-4 flex justify-center items-center border-b border-gray-200">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0D3B66]">Open Contracts</h1>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-12 h-full">
          {/* Left Side - Job List */}
          <div className="col-span-12 lg:col-span-4 bg-gray-100 p-3 sm:p-4 lg:p-6 overflow-y-auto">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EE964B] mx-auto mb-4"></div>
                <p className="text-gray-600">Loading contracts...</p>
              </div>
            ) : contracts.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📋</div>
                <p className="text-gray-600">No contracts found. Create your first job!</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {contracts.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => handleJobClick(job)}
                    className={`p-3 sm:p-4 rounded-lg cursor-pointer transition-all hover:bg-white hover:shadow-md ${
                      selectedJob?.id === job.id
                        ? 'bg-white shadow-md'
                        : 'bg-white/50 hover:bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-[#0D3B66] text-base sm:text-lg">
                        {job.title}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        job.status === 'active' ? 'bg-green-100 text-green-800' :
                        job.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {job.status}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-2 text-sm sm:text-base">{job.company_name}</p>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                      <span>📍 {job.location}</span>
                      <span>💰 {job.currency} {job.salary}</span>
                    </div>
                    
                    <div className="mt-2 text-xs text-gray-400">
                      Posted: {formatDate(job.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Side - Job Details */}
          <div className="hidden lg:flex flex-col col-span-12 lg:col-span-8 bg-white p-3 sm:p-4 lg:p-6 overflow-y-auto max-h-[calc(100vh-112px)]">
            {selectedJob ? (
              <div className="space-y-6">
                {/* Header */}
                <div className="border-b border-gray-200 pb-4 text-center">
                  <div className="flex flex-col sm:flex-row sm:justify-center sm:items-center mb-2 gap-2 sm:gap-4">
                    <h3 className="text-xl sm:text-2xl font-bold text-[#0D3B66]">
                      {selectedJob.title}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedJob.status === 'active' ? 'bg-green-100 text-green-800' :
                      selectedJob.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                      selectedJob.status === 'closed' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedJob.status}
                    </span>
                  </div>
                  <p className="text-lg sm:text-xl text-[#EE964B] font-semibold">
                    {selectedJob.company_name}
                  </p>
                </div>

                {/* Key Information */}
                <div className="flex flex-wrap gap-2 sm:gap-4 justify-center">
                  <div className="bg-gray-50 px-3 sm:px-4 py-2 rounded-lg">
                    <span className="font-semibold text-[#0D3B66] text-xs sm:text-sm">📍 </span>
                    <span className="text-gray-600 text-xs sm:text-sm">{selectedJob.location}</span>
                  </div>
                  
                  <div className="bg-gray-50 px-3 sm:px-4 py-2 rounded-lg">
                    <span className="font-semibold text-[#0D3B66] text-xs sm:text-sm">💰 </span>
                    <span className="text-gray-600 text-xs sm:text-sm">{selectedJob.currency} {selectedJob.salary}{selectedJob.pay_frequency ? `/${selectedJob.pay_frequency}` : ''}</span>
                  </div>
                  
                  <div className="bg-gray-50 px-3 sm:px-4 py-2 rounded-lg">
                    <span className="font-semibold text-[#0D3B66] text-xs sm:text-sm">📅 </span>
                    <span className="text-gray-600 text-xs sm:text-sm">{selectedJob.job_type || 'Not specified'}</span>
                  </div>
                  
                  <div className="bg-gray-50 px-3 sm:px-4 py-2 rounded-lg">
                    <span className="font-semibold text-[#0D3B66] text-xs sm:text-sm">🏢 </span>
                    <span className="text-gray-600 text-xs sm:text-sm">{selectedJob.location_type || 'Not specified'}</span>
                  </div>
                </div>

                {/* Description */}
                {selectedJob.description && (
                  <div>
                    <h4 className="font-semibold text-[#0D3B66] mb-2">📝 Job Summary</h4>
                    <p className="text-gray-600 leading-relaxed">{selectedJob.description}</p>
                  </div>
                )}

                {/* Responsibilities */}
                {selectedJob.responsibilities && (
                  <div>
                    <h4 className="font-semibold text-[#0D3B66] mb-2">🎯 Responsibilities</h4>
                    <p className="text-gray-600 leading-relaxed whitespace-pre-line">{selectedJob.responsibilities}</p>
                  </div>
                )}

                {/* Skills */}
                {selectedJob.skills && (
                  <div>
                    <h4 className="font-semibold text-[#0D3B66] mb-2">🛠️ Required Skills</h4>
                    <p className="text-gray-600 leading-relaxed">{selectedJob.skills}</p>
                  </div>
                )}

                {/* Additional Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedJob.additional_compensation && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-[#0D3B66] mb-2">💎 Additional Compensation</h4>
                      <p className="text-gray-600">{selectedJob.additional_compensation}</p>
                    </div>
                  )}
                  
                  {selectedJob.employee_benefits && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-[#0D3B66] mb-2">🏥 Employee Benefits</h4>
                      <p className="text-gray-600">{selectedJob.employee_benefits}</p>
                    </div>
                  )}
                </div>

                {/* Company Description */}
                {selectedJob.company_description && (
                  <div>
                    <h4 className="font-semibold text-[#0D3B66] mb-2">🏢 About the Company</h4>
                    <p className="text-gray-600 leading-relaxed">{selectedJob.company_description}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={handleEditJob}
                    className="flex-1 py-3 px-4 sm:px-6 rounded-lg font-semibold transition-all text-sm sm:text-base bg-[#EE964B] text-white hover:bg-[#d97b33]"
                  >
                    ✏️ Edit Job
                  </button>
                  {selectedJob.status === 'draft' && (
                    <button
                      onClick={handleActivateJob}
                      className="flex-1 py-3 px-4 sm:px-6 rounded-lg font-semibold transition-all text-sm sm:text-base bg-green-600 text-white hover:bg-green-700"
                    >
                      Activate Job
                    </button>
                  )}
                </div>

                {/* Posted Date */}
                <div className="text-sm text-gray-500 text-center">
                  Posted on {formatDate(selectedJob.created_at)}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 text-6xl mb-4">👆</div>
                <p className="text-gray-600">Select a job from the list to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpenContracts;
