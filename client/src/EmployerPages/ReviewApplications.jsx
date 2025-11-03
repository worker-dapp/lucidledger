import React, { useState, useEffect } from "react";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import EmployerNavbar from "../components/EmployerNavbar";
import apiService from '../services/api';

const ReviewApplications = () => {
  const { user } = useDynamicContext();
  
  // --------------------------------------------------------------------------
  // STATE
  // --------------------------------------------------------------------------
  const [employerId, setEmployerId] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [processingJobId, setProcessingJobId] = useState(null);

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
  // FETCH JOBS WITH APPLICATIONS USING EMPLOYER ID
  // --------------------------------------------------------------------------
  useEffect(() => {
    const fetchJobsWithApplications = async () => {
      if (!employerId) return;

      try {
        setLoading(true);
        
        // Directly use employer_id from database
        const response = await apiService.getJobsWithApplicationsByEmployer(employerId);
        const data = response.data || [];
        
        setJobs(data);
      } catch (error) {
        console.error("Error fetching jobs with applications:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (employerId) {
      fetchJobsWithApplications();
    }
  }, [employerId]);

  // --------------------------------------------------------------------------
  // HANDLE JOB CLICK - FETCH APPLICANTS
  // --------------------------------------------------------------------------
  const handleJobClick = async (job) => {
    setSelectedJob(job);
    setApplicants([]);
    
    try {
      setLoadingApplicants(true);
      const response = await apiService.getJobApplications(job.id);
      setApplicants(response.data || []);
    } catch (error) {
      console.error("Error fetching applicants:", error);
      setApplicants([]);
    } finally {
      setLoadingApplicants(false);
    }
  };

  // --------------------------------------------------------------------------
  // HANDLE CLOSE APPLICATIONS
  // --------------------------------------------------------------------------
  const handleCloseApplications = async () => {
    if (!selectedJob) return;

    const confirmed = window.confirm(
      "Are you sure you want to close applications for this job? No one will be able to apply once closed."
    );

    if (!confirmed) return;

    try {
      setProcessingJobId(selectedJob.id);
      await apiService.updateJobStatus(selectedJob.id, 'closed');
      
      // Update local state
      setJobs((prev) =>
        prev.map((j) => (j.id === selectedJob.id ? { ...j, status: 'closed' } : j))
      );
      
      // Update selected job
      setSelectedJob({ ...selectedJob, status: 'closed' });
      
      alert("Applications have been closed for this job.");
    } catch (err) {
      console.error("Error closing applications:", err);
      alert("Failed to close applications. Please try again.");
    } finally {
      setProcessingJobId(null);
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
    <div className="h-screen bg-gray-50 overflow-hidden">
      <EmployerNavbar />
      
      <div className="pt-26 h-full">
        {/* TOP BAR */}
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-4 flex justify-between items-center border-b border-gray-200">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0D3B66]">Review Applications</h1>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-12 h-full">
          {/* Left Side - Job List */}
          <div className="col-span-12 lg:col-span-4 bg-gray-100 p-3 sm:p-4 lg:p-6 overflow-y-auto">
            <h2 className="text-lg sm:text-xl font-semibold text-[#0D3B66] mb-3 sm:mb-4">Jobs with Applications</h2>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EE964B] mx-auto mb-4"></div>
                <p className="text-gray-600">Loading jobs with applications...</p>
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📋</div>
                <p className="text-gray-600">No jobs with applications found.</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {jobs.map((job) => (
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
                        job.status === 'closed' ? 'bg-red-100 text-red-800' :
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
                    
                    <div className="mt-2 flex items-center justify-between">
                      <div className="text-xs text-gray-400">
                        Posted: {formatDate(job.created_at)}
                      </div>
                      <div className="text-xs font-semibold text-[#EE964B]">
                        {job.application_count || 0} {job.application_count === 1 ? 'application' : 'applications'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Side - Applicants List */}
          <div className="hidden lg:block col-span-12 lg:col-span-8 bg-white p-3 sm:p-4 lg:p-6 overflow-y-auto">
            {selectedJob ? (
              <div className="space-y-6">
                {/* Job Header */}
                <div className="border-b border-gray-200 pb-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-2 sm:gap-4">
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold text-[#0D3B66]">
                        {selectedJob.title}
                      </h3>
                      <p className="text-lg sm:text-xl text-[#EE964B] font-semibold">
                        {selectedJob.company_name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        selectedJob.status === 'active' ? 'bg-green-100 text-green-800' :
                        selectedJob.status === 'closed' ? 'bg-red-100 text-red-800' :
                        selectedJob.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedJob.status}
                      </span>
                      {selectedJob.status !== 'closed' && (
                        <button
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={handleCloseApplications}
                          disabled={processingJobId === selectedJob.id}>
                          {processingJobId === selectedJob.id ? 'Processing...' : 'Close Applications'}
                        </button>
                      )}
                    </div>
                  </div>
                  {selectedJob.status === 'closed' && (
                    <div className="mt-2">
                      <p className="text-sm text-red-600 font-medium">⚠️ Applications are closed for this job</p>
                    </div>
                  )}
                </div>

                {/* Applicants Section */}
                <div>
                  <h4 className="text-lg font-semibold text-[#0D3B66] mb-4">
                    Applicants ({applicants.length})
                  </h4>

                  {loadingApplicants ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EE964B] mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading applicants...</p>
                    </div>
                  ) : applicants.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-gray-400 text-6xl mb-4">👤</div>
                      <p className="text-gray-600">No applicants yet for this job.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {applicants.map((application) => {
                        const employee = {
                          id: application.employee_id,
                          first_name: application.first_name,
                          last_name: application.last_name,
                          email: application.email,
                          phone_number: application.phone_number,
                          wallet_address: application.wallet_address,
                          street_address: application.street_address,
                          street_address2: application.street_address2,
                          city: application.city,
                          state: application.state,
                          zip_code: application.zip_code,
                          country: application.country,
                          country_code: application.country_code,
                          created_at: application.employee_created_at
                        };
                        
                        return (
                          <div
                            key={application.id}
                            className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:shadow-md transition-all"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h5 className="font-semibold text-[#0D3B66] text-lg">
                                  {employee.first_name} {employee.last_name}
                                </h5>
                                <p className="text-gray-600 text-sm">{employee.email}</p>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                application.application_status === 'accepted' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {application.application_status}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                              {employee.phone_number && (
                                <div>
                                  <span className="font-semibold text-[#0D3B66]">Phone: </span>
                                  <span className="text-gray-600">{employee.phone_number}</span>
                                </div>
                              )}
                              {employee.wallet_address && (
                                <div>
                                  <span className="font-semibold text-[#0D3B66]">Wallet: </span>
                                  <span className="text-gray-600 text-xs break-all">{employee.wallet_address}</span>
                                </div>
                              )}
                              {(employee.city || employee.state || employee.country) && (
                                <div>
                                  <span className="font-semibold text-[#0D3B66]">Location: </span>
                                  <span className="text-gray-600">
                                    {[employee.city, employee.state, employee.country].filter(Boolean).join(', ') || 'Not specified'}
                                  </span>
                                </div>
                              )}
                              {application.applied_at && (
                                <div>
                                  <span className="font-semibold text-[#0D3B66]">Applied: </span>
                                  <span className="text-gray-600">{formatDate(application.applied_at)}</span>
                                </div>
                              )}
                            </div>

                            {(employee.street_address || employee.street_address2) && (
                              <div className="mt-3 text-sm">
                                <span className="font-semibold text-[#0D3B66]">Address: </span>
                                <span className="text-gray-600">
                                  {[employee.street_address, employee.street_address2].filter(Boolean).join(', ')}
                                  {employee.zip_code && `, ${employee.zip_code}`}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 text-6xl mb-4">👆</div>
                <p className="text-gray-600">Select a job from the list to view applicants</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewApplications;
