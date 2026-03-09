import React, { useState } from "react";
import { LayoutDashboard, Shield, CheckCircle, FileText, Download } from "lucide-react";
import OverviewTab from "./OverviewTab";
import DisputesTab from "./DisputesTab";
import CompletedContractsTab from "./CompletedContractsTab";
import AuditLogTab from "./AuditLogTab";
import ReportsTab from "./ReportsTab";

const tabs = [
  { id: "overview",   label: "Overview",            icon: LayoutDashboard },
  { id: "disputes",   label: "Disputes",             icon: Shield          },
  { id: "completed",  label: "Completed Contracts",  icon: CheckCircle     },
  { id: "audit",      label: "Audit Log",            icon: FileText        },
  { id: "reports",    label: "Reports & Exports",    icon: Download        },
];

const ComplianceHub = () => {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0D3B66]">Compliance Hub</h1>
        <p className="text-sm text-gray-500 mt-1">
          Contract health, dispute history, audit trail, and compliance exports.
        </p>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === id
                ? "border-[#EE964B] text-[#0D3B66]"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "overview"  && <OverviewTab />}
      {activeTab === "disputes"  && <DisputesTab />}
      {activeTab === "completed" && <CompletedContractsTab />}
      {activeTab === "audit"     && <AuditLogTab />}
      {activeTab === "reports"   && <ReportsTab />}
    </div>
  );
};

export default ComplianceHub;
