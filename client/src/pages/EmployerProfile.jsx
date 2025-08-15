import React, { useEffect, useState } from "react";
import img from "../assets/profile.webp";
import Navbar from "../components/Navbar";
import { useAuth } from "../api/AuthContext";

const EmployerProfile = () => {
  const [employerData, setEmployerData] = useState(null);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      setEmployerData({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email
      });
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      <Navbar />
      <div className="flex flex-col justify-center items-center p-20 gap-10">
        <div className="w-full bg-[#FAF0CA] p-8 rounded-2xl shadow-md flex items-center gap-8">
          <img
            src={img}
            alt={employerData?.first_name || "Profile"}
            className="w-32 h-32 rounded-full border-4 border-[#F4D35E]"
          />
          <div className="text-[#0D3B66]">
            <h1 className="text-4xl font-bold">
              {employerData
                ? `${employerData.first_name} ${employerData.last_name}`
                : "Loading..."}
            </h1>
            <p className="text-lg mt-2">
              {employerData ? employerData.email : "Fetching..."}
            </p>
          </div>
        </div>
        <div className="w-full bg-[#FFF9E5] p-6 rounded-2xl shadow-md text-center">
          <h2 className="text-2xl font-semibold text-[#0D3B66] mb-2">
            Jobs Posted
          </h2>
          <p className="text-3xl font-bold text-[#EE964B]">2</p>
        </div>
        {error && (
          <p className="text-red-500 font-semibold">Error: {error.message}</p>
        )}
      </div>
    </div>
  );
};

export default EmployerProfile;
