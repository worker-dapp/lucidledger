import React from "react";
import EmployeeNavbar from "../components/EmployeeNavbar";
import JobLandingHero from "../components/JobLandingHero";
import Footer from "../components/Footer";

const EmployeeDashboard = () => {
  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      <EmployeeNavbar />
      <JobLandingHero />
      <Footer />
    </div>
  );
};

export default EmployeeDashboard;
