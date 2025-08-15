
import React from "react";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";
import Footer from "../components/Footer";
import employerImg from "../assets/employer.jpg";
import employeeImg from "../assets/jobs.jpg";

const LandingPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#FFFFFF]">
      <Navbar />

      {/* Main Content */}
      <div className="flex flex-col items-center text-center px-6 py-20">
        <h1 className="text-5xl md:text-6xl font-extrabold text-[#0D3B66]">
          Welcome to <span className="text-[#EE964B]">LUCID LEDGER</span>
        </h1>
        <h3 className="text-lg text-[#6B7280] mt-3">
          Choose your role and create an account or sign in.
        </h3>

        {/* Cards Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl">
          {/* Employer Card */}
          <div
            className="p-10 rounded-3xl shadow-2xl border border-gray-100 border-l-[#0d3b66] border-l-8 via-white to-white 
  bg-[length:100%_20%] bg-no-repeat  transition-all hover:shadow-2xl hover:scale-[1.03] flex flex-col items-center text-center">
            <img
              src={employerImg}
              alt="Employer"
              className="w-24 h-24 md:w-32 md:h-32 object-contain mb-4"
            />
            <h3 className="text-2xl md:text-3xl font-semibold text-[#0D3B66]">
              I’m an Employer
            </h3>
            <p className="text-[#6B7280] mt-2 text-sm md:text-base">
              Find and hire the best workers with ease.
            </p>
            <Link to="/employerRegister" className="w-full">
              <button
                //  className="mt-6 bg-gradient-to-r from-[#FFB07F] via-[#FFA062] to-[#E08A44] text-white font-medium px-6 py-3 rounded-lg w-full transition-all hover:shadow-lg hover:brightness-110"
                className="mt-6 bg-[#0d3b66] text-white font-medium px-6 py-3 rounded-lg w-full transition-all hover:bg-[#1a5a95] hover:shadow-lg cursor-pointer">
                Create a Contract →
              </button>
            </Link>
          </div>

          {/* Employee Card */}
          <div
            className="p-10 rounded-3xl shadow-2xl border border-gray-100   border-l-[#0d3b66] border-l-8 via-white to-white 
  bg-[length:100%_20%] bg-no-repeat  transition-all hover:shadow-2xl hover:scale-[1.03] flex flex-col items-center text-center">
            <img
              src={employeeImg}
              alt="Employee"
              className="w-24 h-24 md:w-32 md:h-32 object-contain mb-4"
            />
            <h3 className="text-2xl md:text-3xl font-semibold text-[#0D3B66]">
              I’m an Employee
            </h3>
            <p className="text-[#6B7280] mt-2 text-sm md:text-base">
              Find opportunities that suit your needs.
            </p>
            <Link to="/employeeRegister" className="w-full">
              <button
                //   className="mt-6 bg-gradient-to-r from-[#FFB07F] via-[#FFA062] to-[#E08A44] text-white font-medium px-6 py-3 rounded-lg w-full transition-all hover:shadow-lg hover:brightness-110"
                className="mt-6 bg-[#0d3b66] text-white font-medium px-6 py-3 rounded-lg w-full transition-all hover:bg-[#1a5a95] hover:shadow-lg cursor-pointer">
                Find a Job →
              </button>
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default LandingPage;
