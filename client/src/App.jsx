import { Routes, Route } from "react-router-dom";
import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { SdkViewSectionType, SdkViewType } from "@dynamic-labs/sdk-api";
import LandingPage from "./pages/LandingPage";
import AboutPage from "./pages/NewAbout";
import EmployeeDashboard from "./EmployeePages/EmployeeDashboard";
import EmployerDashboard from "./EmployerPages/EmployerDashboard";
import Dispute from "./EmployerPages/Dispute";
import JobDetails from "./pages/JobDetails";
import EmployerProfile from "./EmployerPages/EmployerProfile";
import EmployeeProfile from "./EmployeePages/EmployeeProfile";
import EmployerJobPortal from "./EmployerPages/EmployerJobPortal";
import OpenContracts from "./EmployerPages/OpenContracts";
import ReviewCompletedContracts from "./EmployerPages/ReviewCompletedContracts";
import Job from "./EmployerPages/Job";
import ReviewApplications from "./EmployerPages/ReviewApplications";
import EmployeeJobsPage from "./EmployeePages/EmployeeJobsPage";
import { useEffect, useState } from "react";
import UserProfile from "./pages/UserProfile";
import ClosedContracts from "./EmployerPages/ClosedContracts";

const enhancedEmployeeView = {
  type: SdkViewType.Login,
  sections: [
    { type: SdkViewSectionType.Email, label: 'Employee Login', alignment: 'center' },
    { type: SdkViewSectionType.Separator, label: 'Or' },
    { type: SdkViewSectionType.Phone, label: 'Employee Login' },
  ]
};

const enhancedEmployerView = {
  type: SdkViewType.Login,
  sections: [
    { type: SdkViewSectionType.Email, label: 'Employer Login' },
    { type: SdkViewSectionType.Separator, label: 'Or' },
    { type: SdkViewSectionType.Phone, label: 'Employer Login' },
  ]
};

const App = () => {
  const [selectedRole, setSelectedRole] = useState(
    localStorage.getItem('userRole') ||
    localStorage.getItem('pendingRole') ||
    localStorage.getItem('persistedUserRole') || ''
  );

  const getLoginView = () => {
    if (selectedRole === 'employer') return enhancedEmployerView;
    if (selectedRole === 'employee') return enhancedEmployeeView;
    return null;
  };

  useEffect(() => {
    const updateRole = () => {
      const nextRole =
        localStorage.getItem('userRole') ||
        localStorage.getItem('pendingRole') ||
        localStorage.getItem('persistedUserRole') || '';
      setSelectedRole(nextRole);
    };

    const onStorage = (e) => {
      if (!e.key || ['userRole', 'pendingRole', 'persistedUserRole'].includes(e.key)) {
        updateRole();
      }
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('roleSelected', updateRole);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('roleSelected', updateRole);
    };
  }, []);

  // Check if Dynamic Labs environment ID is configured
  const dynamicEnvId = import.meta.env.VITE_DYNAMIC_ENV_ID;
  
  if (!dynamicEnvId) {
    console.error('VITE_DYNAMIC_ENV_ID is not configured. Please set this environment variable.');
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Configuration Error</h2>
        <p>Dynamic Labs environment ID is not configured.</p>
        <p>Please contact the administrator.</p>
      </div>
    );
  }

  return (
    <DynamicContextProvider
      settings={{
        environmentId: dynamicEnvId,
        walletConnectors: [EthereumWalletConnectors],
        overrides: { views: getLoginView() ? [getLoginView()] : [] },
        // Add debug info for production
        ...(import.meta.env.MODE === 'production' && {
          debugMode: true,
          enableLogging: true,
        }),
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
            const isNew = args?.user?.newUser === true;
            if (isNew) {
              window.location.href = '/user-profile';
              return;
            }

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
          <Routes>
            {/* Common Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/about-us" element={<AboutPage />} />
            <Route path="/user-profile" element={<UserProfile />} />
            <Route path="/job-details/:id" element={<JobDetails />} />

            {/* Employee Routes */}
            <Route path="/employeeDashboard" element={<EmployeeDashboard />} />
            <Route path="/employee-profile" element={<EmployeeProfile />} />
            <Route path="/employee-jobs" element={<EmployeeJobsPage />} />

            {/* Employer Routes */}
            <Route path="/employerDashboard" element={<EmployerDashboard />} />
            <Route path="/employer-profile" element={<EmployerProfile />} />
            <Route path="/job" element={<Job />} />
            <Route path="/view-employees" element={<EmployerJobPortal />} />
            <Route path="/view-open-contracts" element={<OpenContracts />} />
            <Route path="/review-applications" element={<ReviewApplications />} />
            <Route path="/review-completed-contracts" element={<ReviewCompletedContracts />} />
            <Route path="/dispute" element={<Dispute />} />
            <Route path="/closed-contracts" element={<ClosedContracts />} />

            {/* 404 - Must be last */}
            <Route path="*" element={<h1>404 - Not Found</h1>} />
          </Routes>
      </div>
    </DynamicContextProvider>
  );
};

export default App;