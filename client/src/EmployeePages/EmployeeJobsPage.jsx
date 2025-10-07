import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import EmployeeNavbar from "../components/EmployeeNavbar";
import Footer from "../components/Footer";
import apiService from '../services/api';

const EmployeeJobsPage = () => {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams] = useSearchParams();
  const [showJobModal, setShowJobModal] = useState(false);

  // Fetch jobs on component mount
  useEffect(() => {
    fetchJobs();
  }, []);

  // Handle search query from URL
  useEffect(() => {
    const searchQuery = searchParams.get('search');
    if (searchQuery && jobs.length > 0) {
      const filteredJobs = jobs.filter(job => 
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (filteredJobs.length > 0) {
        setSelectedJob(filteredJobs[0]);
      }
    }
  }, [searchParams, jobs]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get jobs from API
      const response = await apiService.getAllJobs();
      const data = response.data || [];
      
      setJobs(data);
      if (data && data.length > 0) {
        setSelectedJob(data[0]);
      }
    } catch (err) {
      console.error('API Error:', err);
      setError('Failed to load jobs. Please try again later.');
      setJobs([]);
      setSelectedJob(null);
    } finally {
      setLoading(false);
    }
  };

  const formatSalary = (salary, currency) => {
    if (!salary) return 'Not specified';
    return `${currency || '$'}${salary.toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleJobClick = (job) => {
    setSelectedJob(job);
    // On mobile screens, show modal instead of side panel
    if (window.innerWidth < 1024) {
      setShowJobModal(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <EmployeeNavbar />
        <div className="pt-26 flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EE964B] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading jobs...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <EmployeeNavbar />
        <div className="pt-26 flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <p className="text-gray-600">{error}</p>
            <button 
              onClick={fetchJobs}
              className="mt-4 bg-[#EE964B] text-white px-6 py-2 rounded-lg hover:bg-[#d97b33] transition-all"
            >
              Try Again
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 overflow-hidden">
      <EmployeeNavbar />
      
      <div className="pt-26 h-full">

        {/* Two-column layout taking full page width */}
        <div className="grid grid-cols-12 h-full">
          {/* Left Side - Job List (narrow) */}
          <div className="col-span-12 lg:col-span-4 bg-gray-100 p-3 sm:p-4 lg:p-6 overflow-y-auto">
            <h2 className="text-lg sm:text-xl font-semibold text-[#0D3B66] mb-3 sm:mb-4">Job Listings</h2>
            
            {jobs.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-6xl mb-4">📋</div>
                <p className="text-gray-600">No jobs available at the moment</p>
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
                        job.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {job.status}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-2 text-sm sm:text-base">{job.company_name}</p>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                      <span>📍 {job.location}</span>
                      <span>💰 {job.currency} {job.salary}/{job.pay_frequency}</span>
                    </div>
                    
                    <div className="mt-2 text-xs text-gray-400">
                      Posted: {formatDate(job.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Side - Job Details (wide) - Hidden on mobile */}
          <div className="hidden lg:block col-span-12 lg:col-span-8 bg-white p-3 sm:p-4 lg:p-6 overflow-y-auto">
            
            {selectedJob ? (
              <div className="space-y-6">
                {/* Header */}
                <div className="border-b border-gray-200 pb-4 text-center">
                  <div className="flex flex-col sm:flex-row sm:justify-center sm:items-center mb-2 gap-2 sm:gap-4">
                    <h3 className="text-xl sm:text-2xl font-bold text-[#0D3B66]">
                      {selectedJob.jobTitle}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedJob.status === 'active' ? 'bg-green-100 text-green-800' :
                      selectedJob.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedJob.status}
                    </span>
                  </div>
                  <p className="text-lg sm:text-xl text-[#EE964B] font-semibold">
                    {selectedJob.companyName}
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
                    <span className="text-gray-600 text-xs sm:text-sm">{selectedJob.currency} {selectedJob.salary}/{selectedJob.pay_frequency}</span>
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
                  <button className="flex-1 bg-[#EE964B] text-white py-3 px-4 sm:px-6 rounded-lg font-semibold hover:bg-[#d97b33] transition-all text-sm sm:text-base">
                    Apply Now
                  </button>
                  <button className="flex-1 bg-gray-200 text-[#0D3B66] py-3 px-4 sm:px-6 rounded-lg font-semibold hover:bg-gray-300 transition-all text-sm sm:text-base">
                    Save Job
                  </button>
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

      {/* Mobile Job Modal */}
      {showJobModal && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-[#0D3B66]">Job Details</h2>
              <button
                onClick={() => setShowJobModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="p-4 sm:p-6">
              {/* Same job details content as desktop */}
              <div className="space-y-6">
                {/* Header */}
                <div className="border-b border-gray-200 pb-4 text-center">
                  <div className="flex flex-col sm:flex-row sm:justify-center sm:items-center mb-2 gap-2 sm:gap-4">
                    <h3 className="text-xl sm:text-2xl font-bold text-[#0D3B66]">
                      {selectedJob.jobTitle}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedJob.status === 'active' ? 'bg-green-100 text-green-800' :
                      selectedJob.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedJob.status}
                    </span>
                  </div>
                  <p className="text-lg sm:text-xl text-[#EE964B] font-semibold">
                    {selectedJob.companyName}
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
                    <span className="text-gray-600 text-xs sm:text-sm">{selectedJob.currency} {selectedJob.salary}/{selectedJob.pay_frequency}</span>
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
                  <button className="flex-1 bg-[#EE964B] text-white py-3 px-4 sm:px-6 rounded-lg font-semibold hover:bg-[#d97b33] transition-all text-sm sm:text-base">
                    Apply Now
                  </button>
                  <button className="flex-1 bg-gray-200 text-[#0D3B66] py-3 px-4 sm:px-6 rounded-lg font-semibold hover:bg-gray-300 transition-all text-sm sm:text-base">
                    Save Job
                  </button>
                </div>

                {/* Posted Date */}
                <div className="text-sm text-gray-500 text-center">
                  Posted on {formatDate(selectedJob.created_at)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeJobsPage;
