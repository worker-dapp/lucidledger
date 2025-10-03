import React from "react";
import EmployeeNavbar from "../components/EmployeeNavbar";
import JobLandingHero from "../components/JobLandingHero";
import Footer from "../components/Footer";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";

const EmployeeDashboard = () => {
  const { user } = useDynamicContext();

  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      <EmployeeNavbar />
      <div className="pt-20">
        <JobLandingHero />
      </div>
      <Footer />
    </div>
  );
};

export default EmployeeDashboard;
