import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import apiService from '../services/api';

const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        // Get job details from API
        const response = await apiService.getJobById(id);
        setJob(response.data);
      } catch (error) {
        console.error("Error fetching job details:", error);
        setJob(null);
      } finally {
        setLoading(false);
      }
    };
    fetchJobDetails();
  }, [id]);

  const handleApply = async () => {
    setApplying(true);
    try {
      alert("Application submitted successfully!");
      navigate("/employee-dashboard");
    } catch (error) {
      console.error("Error applying for job:", error);
      alert("Failed to apply for job. Please try again.");
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFFFF] flex items-center justify-center">
        <div className="text-2xl text-[#0D3B66]">Loading...</div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-[#FFFFFF] flex items-center justify-center">
        <div className="text-2xl text-[#0D3B66]">Job not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      <Navbar />
      <div className="max-w-4xl mx-auto p-8">
        <button
          onClick={() => navigate("/job-search")}
          className="mb-6 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all"
        >
          ← Back to Jobs
        </button>

        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Job Header */}
          <div className="border-b border-gray-200 pb-6 mb-6">
            <h1 className="text-4xl font-bold text-[#0D3B66] mb-4">
              {job.title}
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xl text-[#EE964B] font-semibold">
                  {job.company_name}
                </p>
                <p className="text-lg text-gray-600">
                  📍 {job.location} ({job.location_type})
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-[#0D3B66]">
                  {job.salary} {job.currency}
                </p>
                <p className="text-lg text-gray-600">
                  {job.pay_frequency}
                </p>
              </div>
            </div>
          </div>

          {/* Job Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-bold text-[#0D3B66] mb-4">
                Job Details
              </h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-[#EE964B]">Job Type</h3>
                  <p className="text-gray-700">{job.job_type}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-[#EE964B]">Additional Compensation</h3>
                  <p className="text-gray-700">{job.additional_compensation || "N/A"}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-[#EE964B]">Employee Benefits</h3>
                  <p className="text-gray-700">{job.employee_benefits || "N/A"}</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[#0D3B66] mb-4">
                Requirements
              </h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-[#EE964B]">Skills Required</h3>
                  <p className="text-gray-700">{job.skills || "N/A"}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-[#EE964B]">Associated Skills</h3>
                  <p className="text-gray-700">{job.associated_skills || "N/A"}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-[#EE964B]">Responsibilities</h3>
                  <p className="text-gray-700">{job.responsibilities || "N/A"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Job Description */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-[#0D3B66] mb-4">
              Job Description
            </h2>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-gray-700 whitespace-pre-wrap">
                {job.description || "No description available."}
              </p>
            </div>
          </div>

          {/* Company Description */}
          {job.company_description && (
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-[#0D3B66] mb-4">
                About the Company
              </h2>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {job.company_description}
                </p>
              </div>
            </div>
          )}

          {/* Apply Button */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={handleApply}
              disabled={applying}
              className="w-full bg-[#EE964B] text-white py-4 px-8 rounded-lg text-xl font-semibold hover:bg-[#F4D35E] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {applying ? "Applying..." : "Apply for this Job"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetails;
