import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Factory, CheckCircle, AlertTriangle, Archive } from "lucide-react";
import EmployerNavbar from "../components/EmployerNavbar";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import apiService from "../services/api";

const EmployerDashboard = () => {
  const [userName, setUserName] = useState("User");
  const navigate = useNavigate();
  const { user, primaryWallet } = useDynamicContext();

  useEffect(() => {
    const fetchEmployerName = async () => {
      const walletAddress = primaryWallet?.address;

      if (!walletAddress && !user?.first_name) {
        setUserName("User");
        return;
      }

      try {
        if (walletAddress) {
          const response = await apiService.getEmployerByWallet(walletAddress);
          const firstName = response?.data?.first_name;

          if (firstName && firstName.trim()) {
            setUserName(firstName.trim());
            return;
          }
        }
      } catch (error) {
        // Optional: handle error silently and fall back to Dynamic Labs data
      }

      const fallbackName = (user?.first_name || "").trim();
      setUserName(fallbackName || "User");
    };

    fetchEmployerName();
  }, [primaryWallet?.address, user?.first_name]);

  

  const dashboardItems = [
    {
      title: "Contract Factory & Recruitment",
      icon: Factory,
      description: "Create contracts, post jobs, and review applications",
      iconColor: "bg-[#EE964B]",
      to: "/contract-factory",
    },
    {
      title: "Active Contracts & Workforce",
      icon: CheckCircle,
      description: "Manage ongoing work and payments",
      iconColor: "bg-green-600",
      to: "/review-completed-contracts",
    },
    {
      title: "Disputes & Resolution",
      icon: AlertTriangle,
      description: "Monitor and resolve disputes",
      iconColor: "bg-yellow-500",
      to: "/dispute",
    },
    {
      title: "Closed Contracts & History",
      icon: Archive,
      description: "Access archived contracts and reports",
      iconColor: "bg-gray-500",
      to: "/closed-contracts",
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
