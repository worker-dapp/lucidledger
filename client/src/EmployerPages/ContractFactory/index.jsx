import React, { useState, useEffect } from "react";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import EmployerNavbar from "../../components/EmployerNavbar";
import apiService from "../../services/api";
import ContractLibrary from "./ContractLibrary";
import PostedJobsTab from "./PostedJobsTab";
import ApplicationReviewTab from "./ApplicationReviewTab";
import AwaitingDeploymentTab from "./AwaitingDeploymentTab";
import { FileText, Users, Rocket } from "lucide-react";

const ContractFactory = () => {
  const { primaryWallet } = useDynamicContext();
  const [activeTab, setActiveTab] = useState("contracts");
  const [employerId, setEmployerId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployer = async () => {
      const walletAddress = primaryWallet?.address;

      if (!walletAddress) {
        setLoading(false);
        return;
      }

      try {
        const response = await apiService.getEmployerByWallet(walletAddress);
        if (response?.data?.id) {
          setEmployerId(response.data.id);
        }
      } catch (error) {
        console.error("Error fetching employer:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployer();
  }, [primaryWallet?.address]);

  const tabs = [
    {
      id: "contracts",
      label: "Contract Library",
      icon: FileText,
      description: "Create and manage job contracts"
    },
    {
      id: "posted",
      label: "Posted Jobs",
      icon: FileText,
      description: "Manage active job postings"
    },
    {
      id: "applications",
      label: "Application Review",
      icon: Users,
      description: "Review and accept applications"
    },
    {
      id: "deployment",
      label: "Awaiting Deployment",
      icon: Rocket,
      description: "Deploy contracts to blockchain"
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <EmployerNavbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <EmployerNavbar />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-28">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#0D3B66] mb-2">
            Contract Factory & Recruitment Hub
          </h1>
          <p className="text-gray-600">
            Create job contracts and manage bulk recruitment campaigns
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {tabs.map(({ id, label, icon: Icon, description }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`
                    group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                    ${
                      activeTab === id
                        ? "border-[#EE964B] text-[#EE964B]"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }
                    transition-colors duration-200
                  `}
                  aria-current={activeTab === id ? "page" : undefined}
                >
                  <Icon
                    className={`
                      -ml-0.5 mr-2 h-5 w-5
                      ${activeTab === id ? "text-[#EE964B]" : "text-gray-400 group-hover:text-gray-500"}
                    `}
                  />
                  <div className="flex flex-col items-start">
                    <span>{label}</span>
                    <span className="text-xs text-gray-400 hidden md:block">
                      {description}
                    </span>
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className={activeTab === "contracts" ? "" : "bg-white rounded-xl shadow-sm border border-gray-200 p-6"}>
          {activeTab === "contracts" && <ContractLibrary employerId={employerId} />}
          {activeTab === "posted" && <PostedJobsTab employerId={employerId} />}
          {activeTab === "applications" && <ApplicationReviewTab employerId={employerId} />}
          {activeTab === "deployment" && <AwaitingDeploymentTab employerId={employerId} />}
        </div>
      </main>
    </div>
  );
};

export default ContractFactory;
