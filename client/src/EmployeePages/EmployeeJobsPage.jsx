import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import EmployeeNavbar from "../components/EmployeeNavbar";
import Footer from "../components/Footer";
import supabase from "../lib/supabaseClient";

const EmployeeJobsPage = () => {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams] = useSearchParams();

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
      const { data, error } = await supabase.from('jobs').select('*').order('created_at', { ascending: false });
      
      if (error) {
        setError('Failed to fetch jobs');
        console.error('Error fetching jobs:', error);
      } else {
        setJobs(data || []);
        if (data && data.length > 0) {
          setSelectedJob(data[0]);
        }
      }
    } catch (err) {
      setError('Failed to fetch jobs');
      console.error('Error:', err);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <EmployeeNavbar />
        <div className="flex items-center justify-center h-96">
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
        <div className="flex items-center justify-center h-96">
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
    <div className="min-h-screen bg-gray-50">
      <EmployeeNavbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#0D3B66] mb-2">Available Jobs</h1>
          <p className="text-gray-600">Find your next opportunity from our curated job listings</p>
        </div>

        {/* Two-column layout with no gap and narrower left panel */}
        <div className="grid grid-cols-12">
          {/* Left Side - Job List (narrow) */}
          <div className="col-span-12 lg:col-span-4 bg-white border border-gray-200 shadow-lg p-6 rounded-none lg:rounded-l-xl">
            <h2 className="text-xl font-semibold text-[#0D3B66] mb-4">Job Listings</h2>
            
            {jobs.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-6xl mb-4">📋</div>
                <p className="text-gray-600">No jobs available at the moment</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                      selectedJob?.id === job.id
                        ? 'border-[#EE964B] bg-orange-50'
                        : 'border-gray-200 hover:border-[#EE964B]'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-[#0D3B66] text-lg">
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
                    
                    <p className="text-gray-600 mb-2">{job.company_name}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>📍 {job.location}</span>
                      <span>💰 {formatSalary(job.salary, job.currency)}</span>
                    </div>
                    
                    <div className="mt-2 text-xs text-gray-400">
                      Posted: {formatDate(job.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Side - Job Details (wide) */}
          <div className="col-span-12 lg:col-span-8 bg-white border border-gray-200 lg:border-l-0 shadow-lg p-6 rounded-none lg:rounded-r-xl">
            <h2 className="text-xl font-semibold text-[#0D3B66] mb-4">Job Details</h2>
            
            {selectedJob ? (
              <div className="space-y-6">
                {/* Header */}
                <div className="border-b border-gray-200 pb-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-2xl font-bold text-[#0D3B66]">
                      {selectedJob.title}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedJob.status === 'active' ? 'bg-green-100 text-green-800' :
                      selectedJob.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedJob.status}
                    </span>
                  </div>
                  <p className="text-xl text-[#EE964B] font-semibold">
                    {selectedJob.company_name}
                  </p>
                </div>

                {/* Key Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-[#0D3B66] mb-2">📍 Location</h4>
                    <p className="text-gray-600">{selectedJob.location}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-[#0D3B66] mb-2">💰 Salary</h4>
                    <p className="text-gray-600">{formatSalary(selectedJob.salary, selectedJob.currency)}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-[#0D3B66] mb-2">📅 Job Type</h4>
                    <p className="text-gray-600">{selectedJob.job_type || 'Not specified'}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-[#0D3B66] mb-2">💳 Pay Frequency</h4>
                    <p className="text-gray-600">{selectedJob.pay_frequency || 'Not specified'}</p>
                  </div>
                </div>

                {/* Description */}
                {selectedJob.description && (
                  <div>
                    <h4 className="font-semibold text-[#0D3B66] mb-2">📝 Description</h4>
                    <p className="text-gray-600 leading-relaxed">{selectedJob.description}</p>
                  </div>
                )}

                {/* Responsibilities */}
                {selectedJob.responsibilities && (
                  <div>
                    <h4 className="font-semibold text-[#0D3B66] mb-2">🎯 Responsibilities</h4>
                    <p className="text-gray-600 leading-relaxed">{selectedJob.responsibilities}</p>
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
                      <h4 className="font-semibold text-[#0D3B66] mb-2">💎 Additional Benefits</h4>
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

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4 border-t border-gray-200">
                  <button className="flex-1 bg-[#EE964B] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#d97b33] transition-all">
                    Apply Now
                  </button>
                  <button className="flex-1 bg-gray-200 text-[#0D3B66] py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-all">
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

      <Footer />
    </div>
  );
};

export default EmployeeJobsPage;
