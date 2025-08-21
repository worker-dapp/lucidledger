import { Routes, Route, useLocation } from "react-router-dom";
import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import LandingPage from "./pages/LandingPage";
import EmployeeRegister from "./EmployeePages/EmployeeRegister";
import EmployerRegister from "./pages/EmployerRegister";
import EmployeeLogIn from "./EmployeePages/EmployeeLogIn";
import EmployerLogIn from "./pages/EmployerLogIn";
import AboutPage from "./pages/NewAbout";
import EmployeeDashboard from "./EmployeePages/EmployeeDashboard";
import EmployerDashboard from "./pages/EmployerDashboard";
import Dispute from "./pages/Dispute";
import Payments from "./pages/Payments";
import JobDetails from "./pages/JobDetails";
import EmployerProfile from "./pages/EmployerProfile";
import EmployeeProfile from "./EmployeePages/EmployeeProfile";
import EmployerJobPortal from "./pages/EmployerJobPortal";
import ViewOpenContracts from "./pages/ViewOpenContracts";
import DAODashboard from "./pages/DAODashboard";
import Job from "./pages/Job";
import EmployeeJobsPage from "./EmployeePages/EmployeeJobsPage";
import { AuthProvider } from "./api/AuthContext";
import UserProfileModal from "./components/UserProfileModal";
import { useState, useEffect } from "react";

const employeeLoginView = {
  type: 'login',
  sections: [
    { type: 'email', label: 'Employee Login' },
    { type: 'separator', label: 'Or' },
    { type: 'social', defaultItem: 'google' },
    { type: 'wallet' }
  ]
};

const employerLoginView = {
  type: 'login',
  sections: [
    { type: 'email', label: 'Employer Login' },
    { type: 'separator', label: 'Or' },
    { type: 'social', defaultItem: 'google' },
    { type: 'wallet' }
  ]
};

const App = () => {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const location = useLocation();
  const isEmployer = location.pathname.startsWith('/employerLogin');
  const dynamicView = isEmployer ? employerLoginView : employeeLoginView;

  const handleProfileComplete = (profileData) => {
    console.log("Profile completed:", profileData);
    setIsNewUser(false);
    // You can add additional logic here like redirecting to dashboard
  };

  const handleCloseProfileModal = () => {
    setShowProfileModal(false);
    setIsNewUser(false);
  };

  return (
    <DynamicContextProvider
      settings={{
        environmentId: "bb03ee6d-6f22-4d73-b630-439914bf6b18",
        walletConnectors: [EthereumWalletConnectors],
        overrides: { views: [dynamicView] },
        handlers: {
          handleAuthenticatedUser: async (args) => {
            try {
              const role =
                localStorage.getItem('pendingRole') ||
                localStorage.getItem('userRole');
              if (role && args?.user) {
                args.user.metadata = {
                  ...(args.user.metadata || {}),
                  role,
                };
                localStorage.setItem('persistedUserRole', role);
              }
            } finally {
              localStorage.removeItem('pendingRole');
              localStorage.removeItem('userRole');
            }
          },
        },
        events: {
          onAuthSuccess: (args) => {
            const userRole = args?.user?.metadata?.role || localStorage.getItem('persistedUserRole');
            if (userRole === 'employee') {
              window.location.href = '/employeeDashboard';
            } else if (userRole === 'employer') {
              window.location.href = '/employerDashboard';
            }
          },
        },
      }}
    >
      <div>
        <AuthProvider>
          <Routes>
            <Route path="*" element={<h1>404 - Not Found</h1>} />
            <Route path="/" element={<LandingPage />} />
            <Route path="/employeeRegister" element={<EmployeeRegister />} />
            <Route path="/employerRegister" element={<EmployerRegister />} />
            <Route path="/employeeLogin" element={<EmployeeLogIn />} />
            <Route path="/employerLogin" element={<EmployerLogIn />} />
            {/* <Route path='/about-us' element={<AboutUs />} /> */}
            <Route path="/about-us" element={<AboutPage />} />
            <Route path="/employerDashboard" element={<EmployerDashboard />} />
            <Route path="/employeeDashboard" element={<EmployeeDashboard />} />
            {/* <Route path='/view-employees' element={<ViewEmployees />} /> */}
            <Route path="/dispute" element={<Dispute />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/job-details/:id" element={<JobDetails />} />
            <Route path="/employer-profile" element={<EmployerProfile />} />
            <Route path="/employee-profile" element={<EmployeeProfile />} />
            <Route path="/view-employees" element={<EmployerJobPortal />} />
            <Route path="/view-open-contracts" element={<ViewOpenContracts />} />
            <Route path="/dao" element={<DAODashboard />} />
            <Route path="/job" element={<Job />} />
            <Route path="/new-job" element={<Job />} />
            <Route path="/employee-jobs" element={<EmployeeJobsPage />} />
          </Routes>

          {/* User Profile Completion Modal */}
          <UserProfileModal
            isOpen={showProfileModal}
            onClose={handleCloseProfileModal}
            onComplete={handleProfileComplete}
          />
        </AuthProvider>
      </div>
    </DynamicContextProvider>
  );
};

export default App;
