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

  // Modal to view job details and applications
  const [openDetailsModal, setOpenDetailsModal] = useState(false);
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
  // VIEW JOB DETAILS (Open Modal)
  // --------------------------------------------------------------------------
  const handleViewJobDetails = (job) => {
    setSelectedJob(job);
    setOpenDetailsModal(true);
  };

  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------
  return (
    <div className="relative min-h-screen bg-[#FFFFFF]">
      <EmployerNavbar />
      
      {/* TOP BAR */}
      <div className="max-w-5xl mx-auto pt-10 flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[#0D3B66]">Review Applications</h1>
      </div>

      {/* JOB LISTINGS */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-lg text-gray-600">Loading jobs with applications...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg text-gray-600">No jobs with applications found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 max-w-5xl mx-auto">
        {jobs.map((job) => (
          <div
            key={job.id}
            className="bg-white p-4 rounded-lg shadow-md border-l-4 border-[#F4D35E]">
            <h2 className="text-lg font-bold text-[#EE964B] mb-2">
              {job.title}
            </h2>
            <p className="text-sm text-[#0D3B66]">
              <strong>Company:</strong> {job.company_name}
            </p>
            <p className="text-sm text-[#0D3B66]">
              <strong>Location:</strong> {job.location}
            </p>
            <p className="text-sm text-[#0D3B66]">
              <strong>Salary:</strong> {job.salary} {job.currency}
            </p>
            <p className="text-sm text-[#0D3B66]">
              <strong>Status:</strong> {job.status}
            </p>
            <p className="text-sm text-[#0D3B66]">
              <strong>Applications:</strong> {job.application_count || 0}
            </p>

            {/* Button to see job details */}
            <button
              className="mt-4 w-full bg-[#EE964B] text-white px-4 py-2 rounded-full shadow-md cursor-pointer"
              onClick={() => handleViewJobDetails(job)}>
              View Details
            </button>
          </div>
        ))}
        </div>
      )}

      {/* VIEW JOB DETAILS MODAL */}
      {openDetailsModal && selectedJob && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 relative max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-orange-600 mb-4">Job Details</h2>

            <div className="space-y-3">
              <p><strong>Title:</strong> {selectedJob.title}</p>
              <p><strong>Company:</strong> {selectedJob.company_name}</p>
              <p><strong>Location:</strong> {selectedJob.location}</p>
              <p><strong>Job Type:</strong> {selectedJob.job_type}</p>
              <p><strong>Salary:</strong> {selectedJob.salary} {selectedJob.currency}</p>
              <p><strong>Status:</strong> {selectedJob.status}</p>
              <p><strong>Applications:</strong> {selectedJob.application_count || 0}</p>
              {selectedJob.description && (
                <p><strong>Description:</strong> {selectedJob.description}</p>
              )}
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button
                className="border border-gray-300 px-4 py-2 rounded"
                onClick={() => setOpenDetailsModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewApplications;
