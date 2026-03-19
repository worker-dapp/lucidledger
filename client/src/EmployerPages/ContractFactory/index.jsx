import React, { useState } from "react";
import { useEmployer } from "../../components/EmployerLayout";
import ContractLibrary from "./ContractLibrary";
import PostedJobsTab from "./PostedJobsTab";
import ApplicationReviewTab from "./ApplicationReviewTab";
import AwaitingDeploymentTab from "./AwaitingDeploymentTab";
import { FileText, Users, Rocket } from "lucide-react";

const ContractFactory = () => {
  const { employerId, isLoading } = useEmployer();
  const [activeTab, setActiveTab] = useState("contracts");

  const tabs = [
    {
      id: "contracts",
      label: "Contract Library",
      shortLabel: "Library",
      icon: FileText,
      description: "Create and manage job contracts"
    },
    {
      id: "posted",
      label: "Posted Jobs",
      shortLabel: "Posted",
      icon: FileText,
      description: "Manage active job postings"
    },
    {
      id: "applications",
      label: "Application Review",
      shortLabel: "Applications",
      icon: Users,
      description: "Review and accept applications"
    },
    {
      id: "deployment",
      label: "Awaiting Deployment",
      shortLabel: "Deploy",
      icon: Rocket,
      description: "Deploy contracts to blockchain"
    }
  ];

  return (
    <main className="container mx-auto">
        {/* Tab Navigation */}
        <div className="mb-6 mt-2">
          {/* Mobile: dropdown */}
          <select
            className="sm:hidden w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#EE964B]"
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
          >
            {tabs.map(({ id, label }) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>

          {/* Desktop: tab buttons */}
          <div className="hidden sm:block border-b border-gray-200">
            <nav className="-mb-px flex space-x-6" aria-label="Tabs">
              {tabs.map(({ id, label, icon: Icon, description }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`
                    group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
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
          {activeTab === "contracts" && <ContractLibrary employerId={employerId} isLoading={isLoading} />}
          {activeTab === "posted" && <PostedJobsTab employerId={employerId} />}
          {activeTab === "applications" && <ApplicationReviewTab employerId={employerId} />}
          {activeTab === "deployment" && <AwaitingDeploymentTab employerId={employerId} />}
        </div>
    </main>
  );
};

export default ContractFactory;
