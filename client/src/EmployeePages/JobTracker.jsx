import React, { useEffect, useState } from "react";
import EmployeeNavbar from "../components/EmployeeNavbar";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";
import apiService from "../services/api";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";

const JobTracker = () => {
  const navigate = useNavigate();
  const { user, primaryWallet } = useDynamicContext();
  const [employeeData, setEmployeeData] = useState(null);
  const [openContracts, setOpenContracts] = useState([]);
  const [completedContracts, setCompletedContracts] = useState([]);
  const [activeTab, setActiveTab] = useState("open");
  const [selectedContract, setSelectedContract] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (!user) {
        setEmployeeData(null);
        return;
      }

      try {
        if (user.email) {
          const response = await apiService.getEmployeeByEmail(user.email);
          setEmployeeData(response.data);
        } else if (primaryWallet?.address) {
          const response = await apiService.getEmployeeByWallet(primaryWallet.address);
          setEmployeeData(response.data);
        }
      } catch (err) {
        console.error("Error fetching employee data:", err);
      }
    };

    fetchEmployeeData();
  }, [user, primaryWallet]);

  useEffect(() => {
    const fetchOpenContracts = async () => {
      if (!employeeData?.id) {
        setOpenContracts([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const response = await apiService.getAppliedJobs(employeeData.id);
        const data = response.data || [];
        const contracts = data
          .filter(app => app.application_status === "signed" || app.application_status === "deployed")
          .map(app => ({
            ...app.job,
            application_status: app.application_status,
            application_id: app.id,
            offer_accepted_at: app.offer_accepted_at,
            applied_at: app.applied_at
          }));
        setOpenContracts(contracts);
        setCompletedContracts([]);
      } catch (err) {
        console.error("Error fetching open contracts:", err);
        setError("Unable to load contracts. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchOpenContracts();
  }, [employeeData]);

  useEffect(() => {
    if (activeTab === "open") {
      setSelectedContract(openContracts[0] || null);
    } else {
      setSelectedContract(completedContracts[0] || null);
    }
  }, [activeTab, openContracts, completedContracts]);

  const formatDate = (value) => {
    if (!value) return "Not specified";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Not specified";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <EmployeeNavbar />

      <main className="pt-32 pb-12">
        {/* Welcome Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-[#0D3B66] mb-4">
              Welcome to your Work Tracker
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Keep track of every step — from finding a job to getting paid.
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="flex items-start gap-3">
                <span className="text-2xl">📋</span>
                <div>
                  <h3 className="font-semibold text-[#0D3B66]">Track Your Contracts</h3>
                  <p className="text-sm text-gray-600">View jobs you've applied for, those in progress, and contracts you've completed.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">📊</span>
                <div>
                  <h3 className="font-semibold text-[#0D3B66]">Check Your Status</h3>
                  <p className="text-sm text-gray-600">See the stage of each job and stay on top of next steps.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">⭐</span>
                <div>
                  <h3 className="font-semibold text-[#0D3B66]">Build Your Reputation</h3>
                  <p className="text-sm text-gray-600">See your reputation score grow as you complete work — earn trust and better jobs.</p>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => navigate('/job-search')}
              className="bg-[#EE964B] hover:bg-[#d97b33] text-white px-6 py-3 rounded-lg font-semibold transition-all"
            >
              Search for Jobs
            </button>
          </div>
          
          {/* Contracts Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
            <h2 className="text-2xl font-bold text-[#0D3B66] mb-6">Contracts</h2>
            
            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-gray-200">
              <button
                onClick={() => setActiveTab("open")}
                className={`px-4 py-2 border-b-2 font-semibold ${
                  activeTab === "open"
                    ? "border-[#EE964B] text-[#EE964B]"
                    : "border-transparent text-gray-500 hover:text-[#0D3B66]"
                }`}
              >
                Open Contracts
              </button>
              <button
                onClick={() => setActiveTab("completed")}
                className={`px-4 py-2 border-b-2 font-semibold ${
                  activeTab === "completed"
                    ? "border-[#EE964B] text-[#EE964B]"
                    : "border-transparent text-gray-500 hover:text-[#0D3B66]"
                }`}
              >
                Completed Contracts
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12 text-gray-500">Loading contracts...</div>
            ) : error ? (
              <div className="text-center py-12 text-red-600">{error}</div>
            ) : activeTab === "open" && openContracts.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📄</div>
                <h3 className="text-xl font-semibold text-[#0D3B66] mb-2">No active contracts yet</h3>
                <p className="text-gray-600 mb-4">Once you sign a contract, it will appear here.</p>
                <button
                  onClick={() => navigate('/job-search')}
                  className="text-[#EE964B] hover:text-[#d97b33] font-semibold"
                >
                  Job search →
                </button>
              </div>
            ) : activeTab === "completed" && completedContracts.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">✅</div>
                <h3 className="text-xl font-semibold text-[#0D3B66] mb-2">No completed contracts yet</h3>
                <p className="text-gray-600">When contracts finish, they will show up here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-4 border border-gray-200 rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-gray-200 bg-gray-50 text-sm text-gray-600">
                    {activeTab === "open" ? `${openContracts.length} open contract(s)` : `${completedContracts.length} completed contract(s)`}
                  </div>
                  <div className="max-h-[520px] overflow-y-auto divide-y divide-gray-100">
                    {(activeTab === "open" ? openContracts : completedContracts).map(contract => (
                      <button
                        key={contract.application_id}
                        onClick={() => setSelectedContract(contract)}
                        className={`w-full text-left p-4 hover:bg-gray-50 transition-all ${
                          selectedContract?.application_id === contract.application_id ? "bg-[#FFF9F2]" : "bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <h3 className="text-sm font-semibold text-[#0D3B66]">{contract.title}</h3>
                            <p className="text-xs text-gray-500">{contract.company_name}</p>
                          </div>
                          {activeTab === "open" && (
                            contract.application_status === "signed" ? (
                              <span className="px-2 py-1 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                                Pending
                              </span>
                            ) : (
                              <span className="px-2 py-1 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                                Active
                              </span>
                            )
                          )}
                        </div>
                        <div className="mt-2 text-xs text-gray-400">
                          Signed: {formatDate(contract.offer_accepted_at || contract.applied_at)}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-8 border border-gray-200 rounded-xl p-6 bg-white">
                  {selectedContract ? (
                    <div className="space-y-5">
                      <div className="border-b border-gray-200 pb-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div>
                            <h3 className="text-xl font-bold text-[#0D3B66]">{selectedContract.title}</h3>
                            <p className="text-sm text-gray-500">{selectedContract.company_name}</p>
                          </div>
                          {activeTab === "open" && (
                            selectedContract.application_status === "signed" ? (
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                                Pending Deployment
                              </span>
                            ) : (
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                                Active Contract
                              </span>
                            )
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-xs font-semibold text-gray-500 mb-1">Location</p>
                          <p className="text-sm text-gray-700">{selectedContract.location || "Not specified"}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-xs font-semibold text-gray-500 mb-1">Compensation</p>
                          <p className="text-sm text-gray-700">
                            {selectedContract.currency} {selectedContract.salary}/{selectedContract.pay_frequency}
                          </p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-xs font-semibold text-gray-500 mb-1">Signed</p>
                          <p className="text-sm text-gray-700">{formatDate(selectedContract.offer_accepted_at || selectedContract.applied_at)}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-xs font-semibold text-gray-500 mb-1">Type</p>
                          <p className="text-sm text-gray-700">{selectedContract.job_type || "Not specified"}</p>
                        </div>
                      </div>

                      {selectedContract.description && (
                        <div>
                          <h4 className="text-sm font-semibold text-[#0D3B66] mb-2">Contract Summary</h4>
                          <p className="text-sm text-gray-600">{selectedContract.description}</p>
                        </div>
                      )}

                      {activeTab === "open" && (
                        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                          <button
                            onClick={() => setShowCancelModal(true)}
                            className="flex-1 py-3 px-4 rounded-lg font-semibold text-sm bg-red-100 text-red-700 hover:bg-red-200"
                          >
                            Cancel Contract
                          </button>
                          <button
                            onClick={() => navigate("/support-center")}
                            className="flex-1 py-3 px-4 rounded-lg font-semibold text-sm bg-gray-100 text-[#0D3B66] hover:bg-gray-200"
                          >
                            Raise Dispute
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      Select a contract to view details.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Reputation Section */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-[#0D3B66] mb-4">Reputation</h2>
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🏆</div>
                <p className="text-gray-500">Coming Soon</p>
                <p className="text-sm text-gray-400 mt-2">Your reputation score will be displayed here</p>
              </div>
            </div>
            
            {/* Disputes Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-[#0D3B66] mb-4">Disputes</h2>
              <div className="text-center py-8">
                <div className="text-6xl mb-4">⚖️</div>
                <p className="text-gray-500">Coming Soon</p>
                <p className="text-sm text-gray-400 mt-2">Any ongoing disputes will appear here</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {showCancelModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-[#0D3B66] mb-2">Cancel contract?</h3>
            <p className="text-sm text-gray-600 mb-6">
              Warning, you are about to cancel this contract. This action will notify the employer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2 px-4 rounded-lg text-sm font-semibold bg-gray-100 text-[#0D3B66] hover:bg-gray-200"
              >
                Nevermind
              </button>
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2 px-4 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700"
              >
                Yes, cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      <Footer />
    </div>
  );
};

export default JobTracker;
