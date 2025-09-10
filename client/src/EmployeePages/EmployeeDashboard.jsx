import React from "react";
import EmployeeNavbar from "../components/EmployeeNavbar";
import JobLandingHero from "../components/JobLandingHero";
import Footer from "../components/Footer";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { User } from "lucide-react";

const EmployeeDashboard = () => {
  const { user } = useDynamicContext();

  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      <EmployeeNavbar />
      
      {/* Profile Completion Alert */}
      {user && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4 mx-4 mt-4">
          <div className="flex items-center">
            <User className="text-blue-400 mr-2" />
            <p className="text-blue-700">
              Please complete your profile to access all features.
            </p>
          </div>
        </div>
      )}

      <JobLandingHero />
      <Footer />

      {/* Profile Completion Modal removed */}
    </div>
  );
};

export default EmployeeDashboard;
