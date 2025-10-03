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
        job.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.jobLocation.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (filteredJobs.length > 0) {
        setSelectedJob(filteredJobs[0]);
      }
    }
  }, [searchParams, jobs]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      // Get jobs from API
      const response = await apiService.getAllJobs();
      const data = response.data || [];
      
      setJobs(data);
      if (data && data.length > 0) {
        setSelectedJob(data[0]);
      }
    } catch (err) {
      console.error('API Error:', err);
      // Use sample jobs for development when API fails
      const sampleJobs = [
        {
          id: 1,
          jobTitle: "Deckhand",
          companyName: "Ocean Harvest Fisheries",
          jobLocation: "Seattle, WA",
          jobLocationType: "on site",
          jobPay: 20,
          currency: "USD",
          payFrequency: "hourly",
          JobType: "Full Time",
          summary: "Join our fishing crew for commercial fishing operations. Work on modern fishing vessels in the Pacific Northwest. We provide comprehensive training and safety equipment. This is a physically demanding role that offers competitive pay and the opportunity to work with experienced crew members.",
          responsiblities: "• Assist with fishing operations and equipment maintenance\n• Follow safety protocols and maritime regulations\n• Participate in deck operations and fish processing\n• Maintain vessel cleanliness and organization\n• Work collaboratively with crew members",
          skills: "Must be 18+ years old, physically fit, able to work long hours at sea, comfortable with heights and confined spaces, basic mechanical aptitude preferred",
          associatedSkills: "able to lift 50 lb,able to stand for long periods,mobility",
          additionalCompensation: "Bonus",
          employeeBenefits: "Food and Drink,Paid Time Off,Medical Insurance",
          companyDescription: "Ocean Harvest Fisheries is a family-owned company with over 30 years of experience in sustainable commercial fishing. We pride ourselves on providing safe working conditions and fair compensation for our crew members.",
          status: "open",
          created_at: "2024-01-15T10:00:00Z"
        },
        {
          id: 2,
          jobTitle: "Fish Cutter",
          companyName: "Pacific Seafood Co.",
          jobLocation: "Portland, OR",
          jobLocationType: "on site",
          jobPay: 18,
          currency: "USD",
          payFrequency: "hourly",
          JobType: "Full Time",
          summary: "Process and cut fish in our state-of-the-art facility. Work in a fast-paced environment with opportunities for growth and advancement. We process premium seafood products for distribution across the Pacific Northwest.",
          responsiblities: "• Cut and process fish according to specifications\n• Maintain cleanliness and sanitation standards\n• Operate cutting equipment safely\n• Package products for distribution\n• Follow food safety protocols",
          skills: "Food handling experience preferred, ability to work in cold environment, attention to detail, manual dexterity",
          associatedSkills: "able to stand for long periods,mobility",
          additionalCompensation: "",
          employeeBenefits: "Medical Insurance,Paid Sick Days,Paid Time Off",
          companyDescription: "Pacific Seafood Co. is a leading seafood processor committed to quality and sustainability. We offer competitive wages and comprehensive benefits in a clean, modern facility.",
          status: "open",
          created_at: "2024-01-14T14:30:00Z"
        },
        {
          id: 3,
          jobTitle: "Seafood Processor",
          companyName: "Alaska Gold Seafood",
          jobLocation: "Anchorage, AK",
          jobLocationType: "on site",
          jobPay: 22,
          currency: "USD",
          payFrequency: "hourly",
          JobType: "Temporary",
          summary: "Process salmon and other seafood during peak season. Housing provided for out-of-state workers. Work in Alaska's pristine environment while earning excellent seasonal wages.",
          responsiblities: "• Process salmon and other seafood products\n• Work 12-hour shifts during peak season\n• Maintain processing equipment\n• Follow strict quality control standards\n• Work in cold, wet environment",
          skills: "Must be able to work 12-hour shifts, seasonal availability, physical stamina, ability to work in cold conditions",
          associatedSkills: "able to stand for long periods,able to lift 50 lb",
          additionalCompensation: "Bonus",
          employeeBenefits: "Food and Drink,Transportation Allowance",
          companyDescription: "Alaska Gold Seafood processes premium Alaskan salmon and seafood. We provide housing and transportation for seasonal workers, making it easy to work in beautiful Alaska.",
          status: "open",
          created_at: "2024-01-13T09:15:00Z"
        },
        {
          id: 4,
          jobTitle: "Assembly Technician",
          companyName: "TechFlow Manufacturing",
          jobLocation: "Austin, TX",
          jobLocationType: "on site",
          jobPay: 19,
          currency: "USD",
          payFrequency: "hourly",
          JobType: "Full Time",
          summary: "Assemble electronic components in clean room environment. Great benefits and advancement opportunities. Work with cutting-edge technology in a climate-controlled facility.",
          responsiblities: "• Assemble electronic components according to specifications\n• Maintain clean room protocols\n• Perform quality inspections\n• Troubleshoot assembly issues\n• Document work processes",
          skills: "High school diploma, attention to detail, ability to work with small parts, basic electronics knowledge preferred",
          associatedSkills: "mobility,able to stand for long periods",
          additionalCompensation: "",
          employeeBenefits: "Medical Insurance,Life Insurance,Paid Time Off,Retirement/Pension",
          companyDescription: "TechFlow Manufacturing is a leading electronics manufacturer specializing in precision components. We offer excellent benefits and opportunities for career advancement.",
          status: "open",
          created_at: "2024-01-12T16:45:00Z"
        },
        {
          id: 5,
          jobTitle: "Tea Harvester",
          companyName: "Mountain Peak Tea Gardens",
          jobLocation: "Darjeeling, India",
          jobLocationType: "on site",
          jobPay: 13,
          currency: "USD",
          payFrequency: "hourly",
          JobType: "Temporary",
          summary: "Hand-pick premium tea leaves during harvest season. Experience the beauty of tea gardens while working in the scenic hills of Darjeeling. Seasonal work with traditional tea harvesting methods.",
          responsiblities: "• Hand-pick tea leaves during harvest season\n• Sort and grade tea leaves\n• Maintain tea garden cleanliness\n• Work in outdoor conditions\n• Follow traditional harvesting methods",
          skills: "Physical fitness, ability to work outdoors in various weather conditions, attention to detail, manual dexterity",
          associatedSkills: "able to walk long distances,able to stand for long periods",
          additionalCompensation: "",
          employeeBenefits: "Food and Drink,Transportation Allowance",
          companyDescription: "Mountain Peak Tea Gardens produces premium Darjeeling tea using traditional methods. We offer seasonal work in one of the world's most beautiful tea-growing regions.",
          status: "open",
          created_at: "2024-01-11T11:20:00Z"
        },
        {
          id: 6,
          jobTitle: "Rubber Tapper",
          companyName: "Tropical Rubber Plantation",
          jobLocation: "Kerala, India",
          jobLocationType: "on site",
          jobPay: 11,
          currency: "USD",
          payFrequency: "hourly",
          JobType: "Full Time",
          summary: "Collect rubber latex from trees using traditional tapping methods. Training provided. Work in the lush tropical environment of Kerala while learning traditional rubber harvesting techniques.",
          responsiblities: "• Tap rubber trees using traditional methods\n• Collect latex in proper containers\n• Maintain tapping equipment\n• Work early morning hours\n• Follow safety protocols",
          skills: "Early morning availability, physical stamina, willingness to learn, ability to work outdoors",
          associatedSkills: "able to walk long distances,able to stand for long periods",
          additionalCompensation: "",
          employeeBenefits: "Food and Drink,Transportation Allowance",
          companyDescription: "Tropical Rubber Plantation uses sustainable harvesting methods to produce high-quality natural rubber. We provide comprehensive training and fair compensation.",
          status: "open",
          created_at: "2024-01-10T08:30:00Z"
        },
        {
          id: 7,
          jobTitle: "Palm Oil Harvester",
          companyName: "Green Valley Plantations",
          jobLocation: "Malaysia",
          jobLocationType: "on site",
          jobPay: 16,
          currency: "USD",
          payFrequency: "hourly",
          JobType: "Full Time",
          summary: "Harvest palm oil fruits using specialized equipment. Work in sustainable agriculture. Join our team in Malaysia's premier palm oil plantation with modern equipment and safety standards.",
          responsiblities: "• Harvest palm oil fruits using specialized equipment\n• Maintain harvesting machinery\n• Follow sustainable agriculture practices\n• Work in tropical conditions\n• Ensure quality standards",
          skills: "Experience with agricultural machinery preferred, safety conscious, physical fitness, ability to work in hot conditions",
          associatedSkills: "able to lift 50 lb,able to stand for long periods",
          additionalCompensation: "Bonus",
          employeeBenefits: "Food and Drink,Medical Insurance,Transportation Allowance",
          companyDescription: "Green Valley Plantations is committed to sustainable palm oil production. We offer modern equipment, safety training, and competitive wages in Malaysia's agricultural sector.",
          status: "open",
          created_at: "2024-01-09T13:15:00Z"
        },
        {
          id: 8,
          jobTitle: "Construction Laborer",
          companyName: "BuildRight Construction",
          jobLocation: "Phoenix, AZ",
          jobLocationType: "on site",
          jobPay: 21,
          currency: "USD",
          payFrequency: "hourly",
          JobType: "Full Time",
          summary: "General construction work including site preparation, material handling, and cleanup. Work on commercial and residential projects in the Phoenix area with opportunities for skill development.",
          responsiblities: "• Assist with site preparation and cleanup\n• Handle construction materials\n• Operate basic construction equipment\n• Follow safety protocols\n• Work collaboratively with construction team",
          skills: "Physical strength, ability to work in outdoor conditions, safety training provided, willingness to learn construction skills",
          associatedSkills: "able to lift 50 lb,able to stand for long periods,able to walk long distances",
          additionalCompensation: "",
          employeeBenefits: "Medical Insurance,Paid Time Off,Retirement/Pension",
          companyDescription: "BuildRight Construction is a leading construction company specializing in commercial and residential projects. We provide safety training and opportunities for career advancement.",
          status: "open",
          created_at: "2024-01-08T07:45:00Z"
        },
        {
          id: 9,
          jobTitle: "Seasonal Farmworker",
          companyName: "Sunrise Organic Farms",
          jobLocation: "Salinas, CA",
          jobLocationType: "on site",
          jobPay: 16,
          currency: "USD",
          payFrequency: "hourly",
          JobType: "Temporary",
          summary: "Plant, cultivate, and harvest organic vegetables. Work with sustainable farming practices. Join our organic farming operation in California's Central Valley, known for its agricultural excellence.",
          responsiblities: "• Plant, cultivate, and harvest organic vegetables\n• Maintain farm equipment and tools\n• Follow organic farming practices\n• Work in various weather conditions\n• Ensure crop quality and safety",
          skills: "Agricultural experience helpful but not required, ability to work in various weather, physical fitness, attention to detail",
          associatedSkills: "able to walk long distances,able to stand for long periods,able to lift 50 lb",
          additionalCompensation: "",
          employeeBenefits: "Food and Drink,Transportation Allowance",
          companyDescription: "Sunrise Organic Farms produces premium organic vegetables using sustainable farming methods. We offer seasonal work in California's premier agricultural region.",
          status: "open",
          created_at: "2024-01-07T12:00:00Z"
        }
      ];
      
      setJobs(sampleJobs);
      setSelectedJob(sampleJobs[0]);
      setError(null); // Clear error since we have sample data
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
                        {job.jobTitle}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        job.status === 'active' ? 'bg-green-100 text-green-800' :
                        job.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {job.status}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-2 text-sm sm:text-base">{job.companyName}</p>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                      <span>📍 {job.jobLocation}</span>
                      <span>💰 {job.currency} {job.jobPay}/{job.payFrequency}</span>
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
                    <span className="text-gray-600 text-xs sm:text-sm">{selectedJob.jobLocation}</span>
                  </div>
                  
                  <div className="bg-gray-50 px-3 sm:px-4 py-2 rounded-lg">
                    <span className="font-semibold text-[#0D3B66] text-xs sm:text-sm">💰 </span>
                    <span className="text-gray-600 text-xs sm:text-sm">{selectedJob.currency} {selectedJob.jobPay}/{selectedJob.payFrequency}</span>
                  </div>
                  
                  <div className="bg-gray-50 px-3 sm:px-4 py-2 rounded-lg">
                    <span className="font-semibold text-[#0D3B66] text-xs sm:text-sm">📅 </span>
                    <span className="text-gray-600 text-xs sm:text-sm">{selectedJob.JobType || 'Not specified'}</span>
                  </div>
                  
                  <div className="bg-gray-50 px-3 sm:px-4 py-2 rounded-lg">
                    <span className="font-semibold text-[#0D3B66] text-xs sm:text-sm">🏢 </span>
                    <span className="text-gray-600 text-xs sm:text-sm">{selectedJob.jobLocationType || 'Not specified'}</span>
                  </div>
                </div>

                {/* Description */}
                {selectedJob.summary && (
                  <div>
                    <h4 className="font-semibold text-[#0D3B66] mb-2">📝 Job Summary</h4>
                    <p className="text-gray-600 leading-relaxed">{selectedJob.summary}</p>
                  </div>
                )}

                {/* Responsibilities */}
                {selectedJob.responsiblities && (
                  <div>
                    <h4 className="font-semibold text-[#0D3B66] mb-2">🎯 Responsibilities</h4>
                    <p className="text-gray-600 leading-relaxed whitespace-pre-line">{selectedJob.responsiblities}</p>
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
                  {selectedJob.additionalCompensation && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-[#0D3B66] mb-2">💎 Additional Compensation</h4>
                      <p className="text-gray-600">{selectedJob.additionalCompensation}</p>
                    </div>
                  )}
                  
                  {selectedJob.employeeBenefits && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-[#0D3B66] mb-2">🏥 Employee Benefits</h4>
                      <p className="text-gray-600">{selectedJob.employeeBenefits}</p>
                    </div>
                  )}
                </div>

                {/* Company Description */}
                {selectedJob.companyDescription && (
                  <div>
                    <h4 className="font-semibold text-[#0D3B66] mb-2">🏢 About the Company</h4>
                    <p className="text-gray-600 leading-relaxed">{selectedJob.companyDescription}</p>
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
                    <span className="text-gray-600 text-xs sm:text-sm">{selectedJob.jobLocation}</span>
                  </div>
                  
                  <div className="bg-gray-50 px-3 sm:px-4 py-2 rounded-lg">
                    <span className="font-semibold text-[#0D3B66] text-xs sm:text-sm">💰 </span>
                    <span className="text-gray-600 text-xs sm:text-sm">{selectedJob.currency} {selectedJob.jobPay}/{selectedJob.payFrequency}</span>
                  </div>
                  
                  <div className="bg-gray-50 px-3 sm:px-4 py-2 rounded-lg">
                    <span className="font-semibold text-[#0D3B66] text-xs sm:text-sm">📅 </span>
                    <span className="text-gray-600 text-xs sm:text-sm">{selectedJob.JobType || 'Not specified'}</span>
                  </div>
                  
                  <div className="bg-gray-50 px-3 sm:px-4 py-2 rounded-lg">
                    <span className="font-semibold text-[#0D3B66] text-xs sm:text-sm">🏢 </span>
                    <span className="text-gray-600 text-xs sm:text-sm">{selectedJob.jobLocationType || 'Not specified'}</span>
                  </div>
                </div>

                {/* Description */}
                {selectedJob.summary && (
                  <div>
                    <h4 className="font-semibold text-[#0D3B66] mb-2">📝 Job Summary</h4>
                    <p className="text-gray-600 leading-relaxed">{selectedJob.summary}</p>
                  </div>
                )}

                {/* Responsibilities */}
                {selectedJob.responsiblities && (
                  <div>
                    <h4 className="font-semibold text-[#0D3B66] mb-2">🎯 Responsibilities</h4>
                    <p className="text-gray-600 leading-relaxed whitespace-pre-line">{selectedJob.responsiblities}</p>
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
                  {selectedJob.additionalCompensation && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-[#0D3B66] mb-2">💎 Additional Compensation</h4>
                      <p className="text-gray-600">{selectedJob.additionalCompensation}</p>
                    </div>
                  )}
                  
                  {selectedJob.employeeBenefits && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-[#0D3B66] mb-2">🏥 Employee Benefits</h4>
                      <p className="text-gray-600">{selectedJob.employeeBenefits}</p>
                    </div>
                  )}
                </div>

                {/* Company Description */}
                {selectedJob.companyDescription && (
                  <div>
                    <h4 className="font-semibold text-[#0D3B66] mb-2">🏢 About the Company</h4>
                    <p className="text-gray-600 leading-relaxed">{selectedJob.companyDescription}</p>
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
