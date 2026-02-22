import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import EmployeeNavbar from "../components/EmployeeNavbar";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import apiService from '../services/api';
import { useAuth } from "../hooks/useAuth";

const EmployeeJobsPage = () => {
  const { user, primaryWallet, smartWalletAddress, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams] = useSearchParams();
  const [showJobModal, setShowJobModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'saved', 'applied', 'offers'
  const [processingJobId, setProcessingJobId] = useState(null); // Track which job is being processed
  const [employeeData, setEmployeeData] = useState(null); // Store employee data from API
  const [employeeLoaded, setEmployeeLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [jobTypeFilter, setJobTypeFilter] = useState('');
  const [offersCount, setOffersCount] = useState(0);
  const [signing, setSigning] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declining, setDeclining] = useState(false);

  // Demo mode detection
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';
  const [showDemoInfo, setShowDemoInfo] = useState(isDemoMode);

  // Fetch employee data on component mount
  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (!user) {
        console.log('No user logged in');
        setEmployeeLoaded(true);
        return;
      }

      try {
        setEmployeeLoaded(false);
        // Try to get employee by email first (primary method)
        const userEmail = user?.email?.address || user?.email;
        if (userEmail) {
          const response = await apiService.getEmployeeByEmail(userEmail);
          setEmployeeData(response.data);
          console.log('Employee data loaded:', response.data);
        }
        // Fallback to wallet address if email is not available
        else if (smartWalletAddress || primaryWallet?.address) {
          const response = await apiService.getEmployeeByWallet(smartWalletAddress || primaryWallet?.address);
          setEmployeeData(response.data);
          console.log('Employee data loaded:', response.data);
        } else {
          console.warn('No email or wallet address available for authentication');
        }
      } catch (error) {
        console.error('Error fetching employee data:', error);
        console.error('User object:', user);
      } finally {
        setEmployeeLoaded(true);
      }
    };

    fetchEmployeeData();
  }, [user, primaryWallet]);

  // Fetch jobs when employee data is loaded or filter changes
  useEffect(() => {
    if (!employeeLoaded) {
      return;
    }

    if (user && !employeeData) {
      return;
    }

    if (employeeData) {
      fetchJobs(employeeData.id);
    } else {
      // Load jobs without employee context if not logged in
      fetchJobs(null);
    }
  }, [employeeData, activeFilter, employeeLoaded, user]);

  useEffect(() => {
    const fetchOffersCount = async () => {
      if (!employeeData?.id) {
        setOffersCount(0);
        return;
      }

      try {
        const response = await apiService.getAppliedJobs(employeeData.id);
        const data = response.data || [];
        const count = data.filter(app =>
          app.application_status === 'accepted'
        ).length;
        setOffersCount(count);
      } catch (err) {
        console.error('Error fetching offers count:', err);
        setOffersCount(0);
      }
    };

    fetchOffersCount();
  }, [employeeData]);

  // Handle search query from URL
  useEffect(() => {
    const urlSearchQuery = searchParams.get('search');
    if (urlSearchQuery) {
      setSearchQuery(urlSearchQuery);
      if (jobs.length > 0) {
        const filteredJobs = jobs.filter(job =>
          job.title.toLowerCase().includes(urlSearchQuery.toLowerCase()) ||
          job.company_name.toLowerCase().includes(urlSearchQuery.toLowerCase()) ||
          job.location.toLowerCase().includes(urlSearchQuery.toLowerCase())
        );
        if (filteredJobs.length > 0) {
          setSelectedJob(filteredJobs[0]);
        }
      }
    }
  }, [searchParams, jobs]);

  // Handle post-auth pending actions
  useEffect(() => {
    const action = searchParams.get('action');
    const jobId = searchParams.get('jobId');

    if (action && jobId && employeeData && jobs.length > 0) {
      const job = jobs.find(j => j.id === parseInt(jobId));

      if (job) {
        if (action === 'save') {
          handleSaveJob(job);
        } else if (action === 'apply') {
          handleApplyToJob(job);
        }
      }

      // Clear localStorage and URL params
      localStorage.removeItem('pendingAction');
      navigate('/job-search', { replace: true });
    }
  }, [employeeData, jobs, searchParams, navigate]);

  const fetchJobs = async (employeeId = null) => {
    try {
      setLoading(true);
      setError(null);

      let data = [];

      // Fetch based on active filter
      if (activeFilter === 'all') {
        // Get all ACTIVE job postings with application status if logged in
        const response = await apiService.getActiveJobPostings(employeeId);
        data = response.data || [];
      } else if (activeFilter === 'saved' && employeeId) {
        // Get only saved jobs for this employee
        const response = await apiService.getSavedJobs(employeeId);
        data = response.data || [];
        // Extract job data from application records
        data = data.map(app => ({
          ...app.job,
          is_saved: true,
          application_status: app.application_status,
          application_id: app.id
        }));
      } else if (activeFilter === 'applied' && employeeId) {
        // Get only applied jobs for this employee
        const response = await apiService.getAppliedJobs(employeeId);
        data = response.data || [];
        // Extract job data from application records
        data = data.map(app => ({
          ...app.job,
          is_saved: app.is_saved,
          application_status: app.application_status,
          application_id: app.id
        }));
      } else if (activeFilter === 'offers' && employeeId) {
        // Get accepted offers for this employee
        const response = await apiService.getAppliedJobs(employeeId);
        data = response.data || [];
        // Filter for accepted status
        data = data
          .filter(app => app.application_status === 'accepted')
          .map(app => ({
            ...app.job,
            is_saved: app.is_saved,
            application_status: app.application_status,
            application_id: app.id
          }));
      }
      
      const visibleJobs = (data || []).filter(job => !['signed', 'deployed', 'declined', 'completed'].includes(job.application_status));
      setJobs(visibleJobs);
      if (visibleJobs.length > 0) {
        setSelectedJob(visibleJobs[0]);
      } else {
        setSelectedJob(null);
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

  const handleSaveJob = async (job) => {
    if (!user) {
      // Store pending action for after authentication
      localStorage.setItem('pendingAction', JSON.stringify({
        type: 'save',
        jobId: job.id,
        timestamp: Date.now()
      }));
      localStorage.setItem('pendingRole', 'employee');
      localStorage.setItem('userRole', 'employee');
      window.dispatchEvent(new Event('roleSelected'));
      login();
      return;
    }

    const employeeId = employeeData?.id;
    if (!employeeId) {
      alert('Unable to find your employee profile. Please complete your profile first.');
      return;
    }

    setProcessingJobId(job.id);
    try {
      if (job.is_saved) {
        // Unsave the job
        await apiService.unsaveJob(employeeId, job.id);
        
        // If on saved filter, refetch to update the list
        if (activeFilter === 'saved') {
          await fetchJobs(employeeId);
        } else {
          // Update local state
          setJobs(jobs.map(j => 
            j.id === job.id ? { ...j, is_saved: false } : j
          ));
          if (selectedJob?.id === job.id) {
            setSelectedJob({ ...selectedJob, is_saved: false });
          }
        }
      } else {
        // Save the job
        await apiService.saveJob(employeeId, job.id);
        // Update local state
        setJobs(jobs.map(j => 
          j.id === job.id ? { ...j, is_saved: true } : j
        ));
        if (selectedJob?.id === job.id) {
          setSelectedJob({ ...selectedJob, is_saved: true });
        }
      }
    } catch (err) {
      console.error('Error saving job:', err);
      // Show specific error message from backend if available
      const errorMessage = err.response?.data?.message || 'Failed to save job. Please try again.';
      alert(errorMessage);
    } finally {
      setProcessingJobId(null);
    }
  };

  const handleApplyToJob = async (job) => {
    if (!user) {
      // Store pending action for after authentication
      localStorage.setItem('pendingAction', JSON.stringify({
        type: 'apply',
        jobId: job.id,
        timestamp: Date.now()
      }));
      localStorage.setItem('pendingRole', 'employee');
      localStorage.setItem('userRole', 'employee');
      window.dispatchEvent(new Event('roleSelected'));
      login();
      return;
    }

    const employeeId = employeeData?.id;
    if (!employeeId) {
      alert('Unable to find your employee profile. Please complete your profile first.');
      return;
    }

    // Check if already applied
    if (job.application_status === 'pending' || job.application_status === 'applied' || job.application_status === 'accepted' || job.application_status === 'rejected' || job.application_status === 'declined' || job.application_status === 'signed' || job.application_status === 'deployed') {
      alert('You have already applied to this job');
      return;
    }

    setProcessingJobId(job.id);
    try {
      await apiService.applyToJob(employeeId, job.id);
      
      // If on saved filter, refetch to remove the job from saved list
      if (activeFilter === 'saved') {
        await fetchJobs(employeeId);
      }
      // If on applied or offers filter, refetch to update the list
      else if (activeFilter === 'applied' || activeFilter === 'offers') {
        await fetchJobs(employeeId);
      } else {
        // Update local state - mark as applied and unsaved
        setJobs(jobs.map(j => 
          j.id === job.id ? { ...j, application_status: 'pending', is_saved: false } : j
        ));
        if (selectedJob?.id === job.id) {
          setSelectedJob({ ...selectedJob, application_status: 'pending', is_saved: false });
        }
      }
      
      alert('Application submitted successfully!');
    } catch (err) {
      console.error('Error applying to job:', err);
      alert('Failed to apply to job. Please try again.');
    } finally {
      setProcessingJobId(null);
    }
  };

  const handleSignContract = async () => {
    if (!selectedJob?.application_id) {
      alert('Unable to find the application record for this offer.');
      return;
    }

    if (!primaryWallet) {
      alert('Wallet not connected. Please wait for your wallet to load.');
      return;
    }

    setSigning(true);
    try {
      // Get the embedded wallet provider for EIP-712 signing
      const provider = await primaryWallet.getEthereumProvider();

      const domain = {
        name: "LucidLedger",
        version: "1",
        chainId: 84532,
      };
      const types = {
        EIP712Domain: [
          { name: "name", type: "string" },
          { name: "version", type: "string" },
          { name: "chainId", type: "uint256" },
        ],
        OfferAcceptance: [
          { name: "jobPostingId", type: "uint256" },
          { name: "applicationId", type: "uint256" },
          { name: "worker", type: "address" },
          { name: "timestamp", type: "uint256" },
        ],
      };
      const timestamp = Math.floor(Date.now() / 1000);
      const message = {
        jobPostingId: String(selectedJob.id),
        applicationId: String(selectedJob.application_id),
        worker: smartWalletAddress,
        timestamp: String(timestamp),
      };

      const msgParams = JSON.stringify({
        domain,
        types,
        primaryType: "OfferAcceptance",
        message,
      });

      const signature = await provider.request({
        method: "eth_signTypedData_v4",
        params: [primaryWallet.address, msgParams],
      });

      // Send signature + status update to backend
      await apiService.updateApplicationStatus(selectedJob.application_id, 'signed', {
        offer_signature: signature,
        offer_signed_at: new Date().toISOString(),
      });

      const remainingJobs = jobs.filter(job => job.application_id !== selectedJob.application_id);
      setJobs(remainingJobs);
      setSelectedJob(remainingJobs[0] || null);
      setOffersCount((prev) => Math.max(prev - 1, 0));
      alert('Offer signed! The employer can now deploy and fund the contract.');
    } catch (err) {
      console.error('Error signing contract:', err);
      if (err?.message?.includes('rejected') || err?.message?.includes('denied')) {
        alert('Signature request was cancelled.');
      } else {
        alert('Failed to sign the contract. Please try again.');
      }
    } finally {
      setSigning(false);
    }
  };

  const handleDeclineOffer = () => {
    if (!selectedJob?.application_id) {
      alert('Unable to find the application record for this offer.');
      return;
    }
    setShowDeclineModal(true);
  };

  const confirmDeclineOffer = async () => {
    setDeclining(true);
    try {
      await apiService.updateApplicationStatus(selectedJob.application_id, 'declined');

      if (activeFilter === 'offers') {
        // Remove from offers list
        const remainingJobs = jobs.filter(job => job.application_id !== selectedJob.application_id);
        setJobs(remainingJobs);
        setSelectedJob(remainingJobs[0] || null);
      } else {
        // Update status in-place on All/Applied tabs
        const updatedJobs = jobs.map(job =>
          job.application_id === selectedJob.application_id
            ? { ...job, application_status: 'declined' }
            : job
        );
        setJobs(updatedJobs);
        setSelectedJob({ ...selectedJob, application_status: 'declined' });
      }

      setOffersCount((prev) => Math.max(prev - 1, 0));
      setShowDeclineModal(false);
    } catch (err) {
      console.error('Error declining offer:', err);
      alert('Failed to decline the offer. Please try again.');
    } finally {
      setDeclining(false);
    }
  };

  // Client-side filtering based on search and filter inputs
  const filteredJobs = jobs.filter(job => {
    // Search filter (searches title, company name, and location)
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery ||
      job.title?.toLowerCase().includes(searchLower) ||
      job.company_name?.toLowerCase().includes(searchLower) ||
      job.location?.toLowerCase().includes(searchLower) ||
      job.description?.toLowerCase().includes(searchLower);

    // Location filter
    const matchesLocation = !locationFilter ||
      job.location?.toLowerCase().includes(locationFilter.toLowerCase());

    // Job type filter
    const matchesJobType = !jobTypeFilter ||
      job.job_type === jobTypeFilter;

    return matchesSearch && matchesLocation && matchesJobType;
  });

  // Get unique locations and job types for filter dropdowns
  const uniqueLocations = [...new Set(jobs.map(job => job.location).filter(Boolean))];
  const uniqueJobTypes = [...new Set(jobs.map(job => job.job_type).filter(Boolean))];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {user ? <EmployeeNavbar /> : <Navbar />}
        <div className={`flex items-center justify-center h-96 ${user ? 'pt-32' : 'pt-8'}`}>
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
        {user ? <EmployeeNavbar /> : <Navbar />}
        <div className={`flex items-center justify-center h-96 ${user ? 'pt-32' : 'pt-8'}`}>
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
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {user ? <EmployeeNavbar /> : <Navbar />}

      <div className={`flex-1 flex flex-col ${user ? 'pt-32' : 'pt-20'} overflow-hidden`}>

        {/* Demo Mode Info Banner */}
        {isDemoMode && showDemoInfo && user && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mx-4 mt-4 relative flex-shrink-0">
            <button
              onClick={() => setShowDemoInfo(false)}
              className="absolute top-2 right-2 text-blue-700 hover:text-blue-900 text-xl font-bold"
            >
              ×
            </button>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Demo Mode</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>This is a demonstration environment using Base Sepolia testnet. To test the full workflow with different roles, use separate email addresses for employer, worker, and mediator accounts.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Two-column layout taking full page width */}
        <div className="grid grid-cols-12 flex-1 overflow-hidden">
          {/* Left Side - Job List (narrow) */}
          <div className="col-span-12 lg:col-span-4 bg-gray-100 p-3 sm:p-4 lg:p-6 overflow-y-auto">
            <h2 className="text-lg sm:text-xl font-semibold text-[#0D3B66] mb-3 sm:mb-4">Job Listings</h2>

            {/* Search and Filter Section */}
            <div className="mb-4 space-y-3">
              {/* Search Input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search jobs, companies, locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EE964B] focus:border-transparent text-sm"
                />
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Filter Dropdowns */}
              <div className="grid grid-cols-2 gap-2">
                {/* Location Filter */}
                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EE964B] focus:border-transparent text-sm bg-white"
                >
                  <option value="">All Locations</option>
                  {uniqueLocations.map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>

                {/* Job Type Filter */}
                <select
                  value={jobTypeFilter}
                  onChange={(e) => setJobTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EE964B] focus:border-transparent text-sm bg-white"
                >
                  <option value="">All Types</option>
                  {uniqueJobTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Active filters indicator */}
              {(searchQuery || locationFilter || jobTypeFilter) && (
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span>Filters active:</span>
                  {searchQuery && (
                    <span className="bg-[#EE964B]/20 text-[#0D3B66] px-2 py-1 rounded">
                      "{searchQuery}"
                    </span>
                  )}
                  {locationFilter && (
                    <span className="bg-[#EE964B]/20 text-[#0D3B66] px-2 py-1 rounded">
                      {locationFilter}
                    </span>
                  )}
                  {jobTypeFilter && (
                    <span className="bg-[#EE964B]/20 text-[#0D3B66] px-2 py-1 rounded">
                      {jobTypeFilter}
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setLocationFilter('');
                      setJobTypeFilter('');
                    }}
                    className="ml-auto text-[#EE964B] hover:text-[#d97b33] font-medium"
                  >
                    Clear all
                  </button>
                </div>
              )}

              {/* Results count */}
              <div className="text-xs text-gray-500">
                Showing {filteredJobs.length} of {jobs.length} jobs
              </div>
            </div>

            {/* Filter Navigation */}
            <div className="flex gap-2 mb-4 bg-white p-1 rounded-lg shadow-sm">
              <button
                onClick={() => setActiveFilter('all')}
                className={`flex-1 py-2 px-3 rounded-md text-xs sm:text-sm font-medium transition-all ${
                  activeFilter === 'all'
                    ? 'bg-[#EE964B] text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                All Jobs
              </button>
              {user && (
                <>
                  <button
                    onClick={() => setActiveFilter('saved')}
                    className={`flex-1 py-2 px-3 rounded-md text-xs sm:text-sm font-medium transition-all ${
                      activeFilter === 'saved'
                        ? 'bg-[#EE964B] text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Saved
                  </button>
                  <button
                    onClick={() => setActiveFilter('applied')}
                    className={`flex-1 py-2 px-3 rounded-md text-xs sm:text-sm font-medium transition-all ${
                      activeFilter === 'applied'
                        ? 'bg-[#EE964B] text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Applied
                  </button>
                  <button
                    onClick={() => setActiveFilter('offers')}
                    className={`flex-1 py-2 px-3 rounded-md text-xs sm:text-sm font-medium transition-all ${
                      activeFilter === 'offers'
                        ? 'bg-[#EE964B] text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      Offers
                      {offersCount > 0 && (
                        <span className="bg-white text-[#EE964B] px-2 py-0.5 rounded-full text-[10px] font-semibold">
                          {offersCount}
                        </span>
                      )}
                    </span>
                  </button>
                </>
              )}
            </div>
            
            {filteredJobs.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-6xl mb-4">
                  {(searchQuery || locationFilter || jobTypeFilter) ? '🔍' : '📋'}
                </div>
                <p className="text-gray-600">
                  {(searchQuery || locationFilter || jobTypeFilter)
                    ? 'No jobs match your search criteria'
                    : activeFilter === 'all'
                    ? 'No jobs available at the moment'
                    : activeFilter === 'offers'
                    ? 'No offers yet'
                    : `No ${activeFilter} jobs`
                  }
                </p>
                {(searchQuery || locationFilter || jobTypeFilter) && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setLocationFilter('');
                      setJobTypeFilter('');
                    }}
                    className="mt-3 text-[#EE964B] hover:text-[#d97b33] font-medium text-sm"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {filteredJobs.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => handleJobClick(job)}
                    className={`p-3 sm:p-4 rounded-lg cursor-pointer transition-all hover:bg-white hover:shadow-md ${
                      selectedJob?.id === job.id
                        ? 'bg-white shadow-md border-l-4 border-[#EE964B]'
                        : 'bg-white/50 hover:bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-[#0D3B66] text-base sm:text-lg">
                        {job.title}
                      </h3>
                      <div className="flex gap-2 items-center">
                        {job.application_status && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            job.application_status === 'accepted' ? 'bg-green-100 text-green-800' :
                            job.application_status === 'rejected' ? 'bg-red-100 text-red-800' :
                            job.application_status === 'declined' ? 'bg-amber-100 text-amber-800' :
                            job.application_status === 'pending' ? 'bg-blue-100 text-blue-800' :
                            job.application_status === 'signed' ? 'bg-purple-100 text-purple-800' :
                            job.application_status === 'deployed' ? 'bg-emerald-100 text-emerald-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {job.application_status === 'accepted'
                              ? (activeFilter === 'applied' ? 'Offer Made' : 'Accepted')
                              : job.application_status === 'rejected' ? 'Rejected'
                              : job.application_status === 'declined' ? 'Declined'
                              : job.application_status === 'pending'
                              ? (activeFilter === 'applied' ? 'Under Review' : 'Applied')
                              : job.application_status === 'signed' ? 'Signed'
                              : job.application_status === 'deployed' ? 'Deployed'
                              : job.application_status}
                          </span>
                        )}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          job.status === 'active' ? 'bg-green-100 text-green-800' :
                          job.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {job.status}
                        </span>
                      </div>
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
                      {selectedJob.jobTitle || selectedJob.title}
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
                    {selectedJob.companyName || selectedJob.company_name}
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

                  {selectedJob.application_deadline && (
                    <div className="bg-gray-50 px-3 sm:px-4 py-2 rounded-lg">
                      <span className="font-semibold text-[#0D3B66] text-xs sm:text-sm">⏰ Apply by: </span>
                      <span className="text-gray-600 text-xs sm:text-sm">{new Date(selectedJob.application_deadline).toLocaleDateString()}</span>
                    </div>
                  )}
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
                  {selectedJob.application_status === 'accepted' ? (
                    activeFilter === 'applied' ? (
                      // Applied tab: informational only — show Offer Made badge
                      <div className="w-full text-center py-3">
                        <span className="inline-block px-4 py-2 rounded-lg text-sm font-medium bg-green-100 text-green-800">
                          Offer Made
                        </span>
                      </div>
                    ) : (
                      // Offers / All tabs: action buttons
                      <div className="flex gap-3 w-full">
                        <button
                          onClick={handleSignContract}
                          disabled={signing}
                          className="flex-1 py-3 px-4 sm:px-6 rounded-lg font-semibold transition-all text-sm sm:text-base bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {signing ? 'Signing...' : 'Sign & Accept'}
                        </button>
                        <button
                          onClick={handleDeclineOffer}
                          className="flex-1 py-3 px-4 sm:px-6 rounded-lg font-semibold transition-all text-sm sm:text-base border-2 border-red-300 text-red-600 hover:bg-red-50"
                        >
                          Decline Offer
                        </button>
                      </div>
                    )
                  ) : selectedJob.application_status === 'signed' ? (
                    <div className="w-full text-center py-3">
                      <span className="inline-block px-4 py-2 rounded-lg text-sm font-medium bg-purple-100 text-purple-800">
                        Offer Signed ✓
                      </span>
                    </div>
                  ) : selectedJob.application_status === 'deployed' ? (
                    <div className="w-full text-center py-3">
                      <span className="inline-block px-4 py-2 rounded-lg text-sm font-medium bg-emerald-100 text-emerald-800">
                        Contract Deployed ✓
                      </span>
                    </div>
                  ) : selectedJob.application_status === 'declined' ? (
                    <div className="w-full text-center py-3">
                      <span className="inline-block px-4 py-2 rounded-lg text-sm font-medium bg-amber-100 text-amber-800">
                        Offer Declined
                      </span>
                    </div>
                  ) : selectedJob.application_status === 'pending' || selectedJob.application_status === 'rejected' ? (
                    <div className="w-full text-center py-3">
                      <span className={`inline-block px-4 py-2 rounded-lg text-sm font-medium ${
                        selectedJob.application_status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {selectedJob.application_status === 'rejected'
                          ? 'Application Rejected'
                          : activeFilter === 'applied' ? 'Under Review' : 'Application Submitted ✓'}
                      </span>
                    </div>
                  ) : selectedJob.is_saved ? (
                    <button
                      onClick={() => handleApplyToJob(selectedJob)}
                      disabled={processingJobId === selectedJob.id}
                      className="w-full py-3 px-4 sm:px-6 rounded-lg font-semibold transition-all text-sm sm:text-base bg-[#EE964B] text-white hover:bg-[#d97b33]"
                    >
                      {processingJobId === selectedJob.id ? 'Processing...' : 'Apply Now'}
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleApplyToJob(selectedJob)}
                        disabled={processingJobId === selectedJob.id}
                        className="flex-1 py-3 px-4 sm:px-6 rounded-lg font-semibold transition-all text-sm sm:text-base bg-[#EE964B] text-white hover:bg-[#d97b33]"
                      >
                        {processingJobId === selectedJob.id ? 'Processing...' : 'Apply Now'}
                      </button>
                      <button
                        onClick={() => handleSaveJob(selectedJob)}
                        disabled={processingJobId === selectedJob.id}
                        className="flex-1 py-3 px-4 sm:px-6 rounded-lg font-semibold transition-all text-sm sm:text-base bg-gray-200 text-[#0D3B66] hover:bg-gray-300"
                      >
                        {processingJobId === selectedJob.id ? 'Processing...' : 'Save Job'}
                      </button>
                    </>
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
                      {selectedJob.jobTitle || selectedJob.title}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedJob.status === 'active' ? 'bg-green-100 text-green-800' :
                      selectedJob.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedJob.status}
                    </span>
                  </div>
                  {selectedJob.application_status && (selectedJob.application_status === 'accepted' || selectedJob.application_status === 'rejected' || selectedJob.application_status === 'signed' || selectedJob.application_status === 'deployed') && (
                    <div className="mb-2">
                      <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                        selectedJob.application_status === 'accepted' ? 'bg-green-100 text-green-800' :
                        selectedJob.application_status === 'rejected' ? 'bg-red-100 text-red-800' :
                        selectedJob.application_status === 'signed' ? 'bg-purple-100 text-purple-800' :
                        selectedJob.application_status === 'deployed' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedJob.application_status === 'accepted' ? '✓ Accepted' :
                         selectedJob.application_status === 'rejected' ? '✗ Rejected' :
                         selectedJob.application_status === 'signed' ? '✓ Signed' :
                         selectedJob.application_status === 'deployed' ? '✓ Deployed' :
                         selectedJob.application_status}
                      </span>
                    </div>
                  )}
                  <p className="text-lg sm:text-xl text-[#EE964B] font-semibold">
                    {selectedJob.companyName || selectedJob.company_name}
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

                  {selectedJob.application_deadline && (
                    <div className="bg-gray-50 px-3 sm:px-4 py-2 rounded-lg">
                      <span className="font-semibold text-[#0D3B66] text-xs sm:text-sm">⏰ Apply by: </span>
                      <span className="text-gray-600 text-xs sm:text-sm">{new Date(selectedJob.application_deadline).toLocaleDateString()}</span>
                    </div>
                  )}
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
                  {selectedJob.application_status === 'accepted' ? (
                    activeFilter === 'applied' ? (
                      <div className="w-full text-center py-3">
                        <span className="inline-block px-4 py-2 rounded-lg text-sm font-medium bg-green-100 text-green-800">
                          Offer Made
                        </span>
                      </div>
                    ) : (
                      <div className="flex gap-3 w-full">
                        <button
                          onClick={handleSignContract}
                          disabled={signing}
                          className="flex-1 py-3 px-4 sm:px-6 rounded-lg font-semibold transition-all text-sm sm:text-base bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {signing ? 'Signing...' : 'Sign & Accept'}
                        </button>
                        <button
                          onClick={handleDeclineOffer}
                          className="flex-1 py-3 px-4 sm:px-6 rounded-lg font-semibold transition-all text-sm sm:text-base border-2 border-red-300 text-red-600 hover:bg-red-50"
                        >
                          Decline Offer
                        </button>
                      </div>
                    )
                  ) : selectedJob.application_status === 'signed' ? (
                    <div className="w-full text-center py-3">
                      <span className="inline-block px-4 py-2 rounded-lg text-sm font-medium bg-purple-100 text-purple-800">
                        Offer Signed ✓
                      </span>
                    </div>
                  ) : selectedJob.application_status === 'deployed' ? (
                    <div className="w-full text-center py-3">
                      <span className="inline-block px-4 py-2 rounded-lg text-sm font-medium bg-emerald-100 text-emerald-800">
                        Contract Deployed ✓
                      </span>
                    </div>
                  ) : selectedJob.application_status === 'declined' ? (
                    <div className="w-full text-center py-3">
                      <span className="inline-block px-4 py-2 rounded-lg text-sm font-medium bg-amber-100 text-amber-800">
                        Offer Declined
                      </span>
                    </div>
                  ) : selectedJob.application_status === 'pending' || selectedJob.application_status === 'rejected' ? (
                    <div className="w-full text-center py-3">
                      <span className={`inline-block px-4 py-2 rounded-lg text-sm font-medium ${
                        selectedJob.application_status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {selectedJob.application_status === 'rejected'
                          ? 'Application Rejected'
                          : activeFilter === 'applied' ? 'Under Review' : 'Application Submitted ✓'}
                      </span>
                    </div>
                  ) : selectedJob.is_saved ? (
                    <button
                      onClick={() => handleApplyToJob(selectedJob)}
                      disabled={processingJobId === selectedJob.id}
                      className="w-full py-3 px-4 sm:px-6 rounded-lg font-semibold transition-all text-sm sm:text-base bg-[#EE964B] text-white hover:bg-[#d97b33]"
                    >
                      {processingJobId === selectedJob.id ? 'Processing...' : 'Apply Now'}
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleApplyToJob(selectedJob)}
                        disabled={processingJobId === selectedJob.id}
                        className="flex-1 py-3 px-4 sm:px-6 rounded-lg font-semibold transition-all text-sm sm:text-base bg-[#EE964B] text-white hover:bg-[#d97b33]"
                      >
                        {processingJobId === selectedJob.id ? 'Processing...' : 'Apply Now'}
                      </button>
                      <button
                        onClick={() => handleSaveJob(selectedJob)}
                        disabled={processingJobId === selectedJob.id}
                        className="flex-1 py-3 px-4 sm:px-6 rounded-lg font-semibold transition-all text-sm sm:text-base bg-gray-200 text-[#0D3B66] hover:bg-gray-300"
                      >
                        {processingJobId === selectedJob.id ? 'Processing...' : 'Save Job'}
                      </button>
                    </>
                  )}
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

      {/* Decline Offer Confirmation Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#0D3B66]">Decline Offer</h3>
              <button
                onClick={() => setShowDeclineModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                &times;
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-3">
                Are you sure you want to decline the offer for <strong>{selectedJob?.title}</strong> with <strong>{selectedJob?.company_name}</strong>?
              </p>
              <p className="text-sm text-red-600 font-medium">
                This action cannot be undone. The offer will be moved to the employer's rejected archive.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeclineModal(false)}
                disabled={declining}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeclineOffer}
                disabled={declining}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {declining ? 'Declining...' : 'Decline Offer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeJobsPage;
