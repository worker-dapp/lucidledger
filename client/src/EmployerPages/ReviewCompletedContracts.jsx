import React, { useState, useEffect } from "react";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import EmployerLayout from "../components/EmployerLayout";
import apiService from '../services/api';

const ReviewCompletedContracts = () => {
  const { user } = useDynamicContext();
  
  // --------------------------------------------------------------------------
  // STATE
  // --------------------------------------------------------------------------
  const [employerId, setEmployerId] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);

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
  // FETCH CLOSED JOBS USING EMPLOYER ID
  // --------------------------------------------------------------------------
  useEffect(() => {
    const fetchClosedJobs = async () => {
      if (!employerId) return;

      try {
        setLoading(true);
        
        // Fetch all jobs for this employer
        const response = await apiService.getJobsByEmployer(employerId);
        const data = response.data || [];
        
        // Filter only closed jobs
        const closedJobs = data.filter(job => job.status === 'closed');
        
        setContracts(closedJobs);
      } catch (error) {
        console.error("Error fetching closed jobs:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (employerId) {
      fetchClosedJobs();
    }
  }, [employerId]);

  // --------------------------------------------------------------------------
  // HANDLE SIGN CONTRACT
  // --------------------------------------------------------------------------
  const handleSignContract = (job) => {
    // TODO: Implement contract signing functionality
    alert(`Contract signing functionality for "${job.title}" will be implemented here.`);
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
    <EmployerLayout>
      <div className="min-h-[600px] bg-gray-50 overflow-hidden">
        {/* TOP BAR */}
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-4 flex justify-center items-center border-b border-gray-200">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0D3B66]">Review Completed Contracts</h1>
        </div>

        {/* JOB LISTINGS */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 overflow-y-auto h-full">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EE964B] mx-auto mb-4"></div>
              <p className="text-lg text-gray-600">Loading closed contracts...</p>
            </div>
          ) : contracts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📋</div>
              <p className="text-lg text-gray-600">No closed contracts found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contracts.map((job) => (
                <div
                  key={job.id}
                  className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-all"
                >
                  {/* Job Basic Info */}
                  <div className="mb-4">
                    <div className="flex justify-between items-start mb-3">
                      <h2 className="text-xl font-bold text-[#0D3B66]">
                        {job.title}
                      </h2>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {job.status}
                      </span>
                    </div>
                    
                    <p className="text-lg text-[#EE964B] font-semibold mb-3">
                      {job.company_name}
                    </p>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#0D3B66]">📍 Location:</span>
                        <span>{job.location || 'Not specified'}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#0D3B66]">💰 Salary:</span>
                        <span>{job.currency} {job.salary}{job.pay_frequency ? `/${job.pay_frequency}` : ''}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#0D3B66]">📅 Job Type:</span>
                        <span>{job.job_type || 'Not specified'}</span>
                      </div>
                      
                      {job.created_at && (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#0D3B66]">📆 Posted:</span>
                          <span>{formatDate(job.created_at)}</span>
                        </div>
                      )}
                    </div>
                    
                    {job.description && (
                      <div className="mt-3">
                        <p className="text-sm text-gray-600 line-clamp-3">{job.description}</p>
                      </div>
                    )}
                  </div>

                  {/* Sign Contract Button */}
                  <button
                    className="w-full bg-[#EE964B] text-white px-4 py-3 rounded-lg shadow-md hover:bg-[#d97b33] transition-all font-semibold"
                    onClick={() => handleSignContract(job)}
                  >
                    ✍️ Sign the Contract
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </EmployerLayout>
  );
};

export default ReviewCompletedContracts;
