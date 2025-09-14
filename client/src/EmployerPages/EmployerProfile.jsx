import React, { useEffect, useState } from "react";
import img from "../assets/profile.webp";
import Navbar from "../components/Navbar";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import supabase from "../lib/supabaseClient";

const EmployerProfile = () => {
  const [employerData, setEmployerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const { user, primaryWallet } = useDynamicContext();

  // Fetch employer details from Supabase
  const fetchEmployerDetails = async () => {
    if (!user || !primaryWallet?.address) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('employer')
        .select('*')
        .eq('wallet_address', primaryWallet.address)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error fetching employer details:', error);
        setMessage('Error loading profile data');
      } else if (data) {
        setEmployerData(data);
      }
    } catch (error) {
      console.error('Error fetching employer details:', error);
      setMessage('Error loading profile data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployerDetails();
  }, [user, primaryWallet]);

  useEffect(() => {
    if (user && !employerData) {
      // Fallback to Dynamic Labs user data if Supabase data not available
      setEmployerData({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email
      });
    }
  }, [user, employerData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFFFF]">
        <Navbar />
        <div className="flex flex-col justify-center items-center p-20 gap-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EE964B] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

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

        {message && (
          <div className="w-full text-center">
            <div className={`text-sm ${message.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
              {message}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default EmployerProfile;
