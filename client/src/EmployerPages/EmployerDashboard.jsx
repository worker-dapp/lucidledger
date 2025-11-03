import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Users, FolderOpen, CheckCircle, AlertTriangle, Archive } from "lucide-react";
import EmployerNavbar from "../components/EmployerNavbar";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";

const EmployerDashboard = () => {
  const [userName, setUserName] = useState("");
  const navigate = useNavigate();
  const { user } = useDynamicContext();

  useEffect(() => {
    if (user) {
      setUserName(user.first_name || (user.email ? user.email.split("@")[0] : user.phone || 'User'));
    }
  }, [user]);

  

  const dashboardItems = [
    {
      title: "Create New Contract",
      icon: FileText,
      description: "Draft and initialize new contracts",
      iconColor: "bg-[#EE964B]",
      to: "/job",
    },
    {
      title: "View Open Contracts",
      icon: FolderOpen,
      description: "Browse all active contracts",
      iconColor: "bg-green-500",
      to: "/view-open-contracts",
    },
    {
      title: "Review Applications",
      icon: Users,
      description: "Review pending contract applications",
      iconColor: "bg-blue-500",
      to: "/review-applications",
    },
    {
      title: "Active Contracts",
      icon: CheckCircle,
      description: "Sign the contracts and start the work",
      iconColor: "bg-green-600",
      to: "/review-completed-contracts",
    },
    {
      title: "View Ongoing Disputes",
      icon: AlertTriangle,
      description: "Monitor and resolve disputes",
      iconColor: "bg-yellow-500",
      to: "/dispute",
    },
    {
      title: "View Closed Contracts",
      icon: Archive,
      description: "Access archived contracts",
      iconColor: "bg-gray-500",
      to: "/payments",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <EmployerNavbar />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-28">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#0D3B66] mb-2">
            Welcome, {userName}!
          </h1>
          <p className="text-gray-600">
            Manage all your contracts in one place
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboardItems.map(({ title, icon: Icon, description, iconColor, to }) => (
            <div
              key={title}
              onClick={() => navigate(to)}
              className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white border border-gray-200 rounded-xl p-6"
            >
              <div className="flex flex-col items-start gap-4">
                <div
                  className={`p-3 rounded-xl ${iconColor} bg-opacity-10 group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon className={`h-8 w-8 ${iconColor.replace("bg-", "text-")}`} />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-[#0D3B66] group-hover:text-[#EE964B] transition-colors">
                    {title}
                  </h3>
                  <p className="text-sm text-gray-600">{description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default EmployerDashboard;
