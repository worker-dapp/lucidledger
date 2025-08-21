import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import apiService from "../api/apiService";

const EmployerJobPortal = () => {
  // --------------------------------------------------------------------------
  // STATE
  // --------------------------------------------------------------------------
  const [contracts, setContracts] = useState([]);
  const [filteredContracts, setFilteredContracts] = useState([]);

  // For filtering (optional)
  const [showFilters, setShowFilters] = useState(false);
  const [searchTitle, setSearchTitle] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modal to view signers
  const [openSignersModal, setOpenSignersModal] = useState(false);
  // We will store the *entire* selected contract here
  const [selectedContract, setSelectedContract] = useState(null);

  // --------------------------------------------------------------------------
  // FETCH JOBS
  // --------------------------------------------------------------------------
  useEffect(() => {
    const fetchJobs = async () => {
      const { data, error } = await apiService.getJobs();

      if (error) {
        console.error("Error fetching jobs:", error);
      } else {
        setContracts(data || []);
        setFilteredContracts(data || []);
      }
    };
    fetchJobs();
  }, []);

  // --------------------------------------------------------------------------
  // FILTERING LOGIC
  // --------------------------------------------------------------------------
  useEffect(() => {
    filterContracts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTitle, statusFilter, contracts]);

  const filterContracts = () => {
    let updated = [...contracts];

    // 1. Filter by job title
    if (searchTitle.trim() !== "") {
      updated = updated.filter((job) =>
        job.title
          ?.toLowerCase()
          .includes(searchTitle.toLowerCase())
      );
    }

    // 2. Filter by status
    if (statusFilter.trim() !== "") {
      updated = updated.filter(
        (job) =>
          job.status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    setFilteredContracts(updated);
  };

  // --------------------------------------------------------------------------
  // VIEW JOB DETAILS (Open Modal)
  // --------------------------------------------------------------------------
  const handleViewJobDetails = (job) => {
    // Set the entire job in state so we know which one we're working with
    setSelectedContract(job);
    setOpenSignersModal(true);
  };

  // --------------------------------------------------------------------------
  // HANDLE JOB STATUS UPDATE
  // --------------------------------------------------------------------------
  const handleJobStatusUpdate = async (jobId, newStatus) => {
    try {
      const { error } = await apiService.updateJob(jobId, { status: newStatus });
      
      if (error) {
        console.error("Error updating job:", error);
        alert("Could not update job status!");
      } else {
        // Update local state
        setContracts((prev) =>
          prev.map((j) => (j.id === jobId ? { ...j, status: newStatus } : j))
        );
        setFilteredContracts((prev) =>
          prev.map((j) => (j.id === jobId ? { ...j, status: newStatus } : j))
        );
        setOpenSignersModal(false);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      alert("Something went wrong!");
    }
  };

  // --------------------------------------------------------------------------
  // SAVE JOB STATUS
  // --------------------------------------------------------------------------
  const handleSave = async () => {
    if (!selectedContract) return;

    try {
      // Update the job status to 'active'
      await handleJobStatusUpdate(selectedContract.id, 'active');
    } catch (err) {
      console.error("Unexpected error:", err);
      alert("Something went wrong!");
    }
  };

  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------
  return (
    <div className="relative min-h-screen p-6 bg-[#FFFFFF]">
      {/* TOP BAR */}
      <div className="max-w-5xl mx-auto flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[#0D3B66]">View Jobs</h1>

        {/* Button or Link to create new job */}
        <Link
          to="/new-job"
          className="bg-[#EE964B] text-white px-6 py-2 rounded-full shadow-md hover:bg-[#d97b33] transition">
          Create a new Job
        </Link>
      </div>

      {/* JOB LISTINGS (FILTERED) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 max-w-5xl mx-auto">
        {filteredContracts.map((job) => (
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
              <strong>Job Type:</strong> {job.job_type}
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

      {/* FILTER BUTTON IN UPPER LEFT CORNER */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="absolute top-6 left-6 w-12 h-12 rounded-full bg-white shadow-md border 
                   flex items-center justify-center text-[#EE964B] hover:bg-orange-50 cursor-pointer">
        {/* Icon (funnel/hamburger) */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 4h18M8 12h8m-6 8h4"
          />
        </svg>
      </button>

      {/* FILTER PANEL */}
      {showFilters && (
        <div
          className="absolute top-20 left-6 w-64 bg-white p-4 rounded shadow-md border 
                     transition-all"
          style={{ zIndex: 9999 }}>
          <h2 className="text-xl font-bold mb-4">Filters</h2>

          {/* Search by Title */}
          <div className="mb-4">
            <label
              className="block text-sm font-medium mb-1"
              htmlFor="searchTitle">
              Search Job Title
            </label>
            <input
              id="searchTitle"
              type="text"
              placeholder="e.g. Software Engineer"
              className="w-full p-2 border rounded"
              value={searchTitle}
              onChange={(e) => setSearchTitle(e.target.value)}
            />
          </div>

          {/* Status Filter Example */}
          <div className="mb-4">
            <label
              className="block text-sm font-medium mb-1"
              htmlFor="statusFilter">
              Status
            </label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-2 border rounded">
              <option value="">-- Any Status --</option>
              <option value="draft">Draft</option>
              <option value="Contract Created">Contract Created</option>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <button
            className="mt-2 w-full bg-[#EE964B] text-white py-2 rounded shadow cursor-pointer"
            onClick={() => setShowFilters(false)}>
            Close
          </button>
        </div>
      )}

      {/* VIEW JOB DETAILS MODAL */}
      {openSignersModal && selectedContract && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 relative">
            <h2 className="text-xl font-bold text-orange-600 mb-4">Job Details</h2>

            <div className="space-y-3">
              <p><strong>Title:</strong> {selectedContract.title}</p>
              <p><strong>Company:</strong> {selectedContract.company_name}</p>
              <p><strong>Location:</strong> {selectedContract.location}</p>
              <p><strong>Job Type:</strong> {selectedContract.job_type}</p>
              <p><strong>Salary:</strong> {selectedContract.salary} {selectedContract.currency}</p>
              <p><strong>Status:</strong> {selectedContract.status}</p>
              <p><strong>Description:</strong> {selectedContract.description}</p>
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button
                className="border border-gray-300 px-4 py-2 rounded"
                onClick={() => setOpenSignersModal(false)}>
                Close
              </button>
              {selectedContract.status === 'draft' && (
                <button
                  className="bg-orange-600 text-white px-4 py-2 rounded"
                  onClick={handleSave}>
                  Activate Job
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployerJobPortal;
