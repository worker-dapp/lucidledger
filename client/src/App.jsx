import { Routes, Route } from "react-router-dom";
import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { SdkViewSectionType, SdkViewType } from "@dynamic-labs/sdk-api";
import LandingPage from "./pages/LandingPage";
import AboutPage from "./pages/NewAbout";
import EmployeeDashboard from "./EmployeePages/EmployeeDashboard";
import EmployerDashboard from "./EmployerPages/EmployerDashboard";
import Dispute from "./pages/Dispute";
import Payments from "./pages/Payments";
import JobDetails from "./pages/JobDetails";
import EmployerProfile from "./EmployerPages/EmployerProfile";
import EmployeeProfile from "./EmployeePages/EmployeeProfile";
import EmployerJobPortal from "./EmployerPages/EmployerJobPortal";
import ViewOpenContracts from "./pages/ViewOpenContracts";
import DAODashboard from "./pages/DAODashboard";
import Job from "./pages/Job";
import EmployeeJobsPage from "./EmployeePages/EmployeeJobsPage";
import { useEffect, useState } from "react";

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
    { type: SdkViewSectionType.Separator, label: 'Or' },
    { type: SdkViewSectionType.Wallet, numOfItemsToDisplay: 2 },
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
  const dynamicEnvId = import.meta.env.VITE_DYNAMIC_ENV_ID || 'bb03ee6d-6f22-4d73-b630-439914bf6b18';
  
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
            const userRole = args?.user?.metadata?.role || localStorage.getItem('persistedUserRole');
            
            if (isNew) {
              // New users go to their profile page based on role
              if (userRole === 'employee') {
                window.location.href = '/employee-profile';
              } else if (userRole === 'employer') {
                window.location.href = '/employer-profile';
              } else {
                // Fallback if no role is set
                window.location.href = '/';
              }
              return;
            }

            // Existing users go to their dashboard
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
            <Route path="*" element={<h1>404 - Not Found</h1>} />
            <Route path="/" element={<LandingPage />} />
            <Route path="/about-us" element={<AboutPage />} />
            <Route path="/employerDashboard" element={<EmployerDashboard />} />
            <Route path="/employeeDashboard" element={<EmployeeDashboard />} />
            <Route path="/dispute" element={<Dispute />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/job-details/:id" element={<JobDetails />} />
            <Route path="/employer-profile" element={<EmployerProfile />} />
            <Route path="/employee-profile" element={<EmployeeProfile />} />
            <Route path="/view-employees" element={<EmployerJobPortal />} />
            <Route path="/view-open-contracts" element={<ViewOpenContracts />} />
            <Route path="/dao" element={<DAODashboard />} />
            <Route path="/job" element={<Job />} />
            <Route path="/employee-jobs" element={<EmployeeJobsPage />} />
          </Routes>
      </div>
    </DynamicContextProvider>
  );
};

export default App;
