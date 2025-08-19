import React, { useState } from "react";
import EmployeeNavbar from "../components/EmployeeNavbar";
import JobLandingHero from "../components/JobLandingHero";
import Footer from "../components/Footer";
import { useAuth } from "../api/AuthContext";
import UserProfileModal from "../components/UserProfileModal";
import { User } from "lucide-react";

const EmployeeDashboard = () => {
  const { user, isProfileComplete } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);

  const handleProfileComplete = (profileData) => {
    console.log("Profile completed:", profileData);
    // Profile modal will close automatically
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      <EmployeeNavbar />
      
      {/* Profile Completion Alert */}
      {user && !isProfileComplete() && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4 mx-4 mt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <User className="text-blue-400 mr-2" />
              <p className="text-blue-700">
                Please complete your profile to access all features.
              </p>
            </div>
            <button
              onClick={() => setShowProfileModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
            >
              Complete Profile
            </button>
          </div>
        </div>
      )}

      <JobLandingHero />
      <Footer />

      {/* Profile Completion Modal */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onComplete={handleProfileComplete}
      />
    </div>
  );
};

export default EmployeeDashboard;
