import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { DynamicContextProvider, useDynamicContext } from "@dynamic-labs/sdk-react-core";
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

import ProtectedRoute from "./components/ProtectedRoute";

// Inner component to handle redirects based on auth state
const AppContent = () => {
  const { user, isAuthenticated, isLoading } = useDynamicContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    // Wait for loading to complete and user to be available
    if (!isLoading && isAuthenticated && user && location.pathname === '/' && !hasRedirected) {
      const isNew = user.newUser === true;
      const userRole = 
        user?.metadata?.role || 
        localStorage.getItem('persistedUserRole') ||
        localStorage.getItem('userRole') ||
        localStorage.getItem('pendingRole');
      
      console.log('AppContent: User authenticated, role:', userRole, 'isNew:', isNew, 'user:', user);
      
      setHasRedirected(true);
      
      // Add a small delay to ensure user state is fully set
      setTimeout(() => {
        if (isNew) {
          console.log('Redirecting new user to /user-profile');
          navigate('/user-profile', { replace: true });
        } else if (userRole === 'employee') {
          console.log('Redirecting employee to /employeeDashboard');
          navigate('/employeeDashboard', { replace: true });
        } else if (userRole === 'employer') {
          console.log('Redirecting employer to /employerDashboard');
          navigate('/employerDashboard', { replace: true });
        } else {
          console.warn('No role found, redirecting to /user-profile');
          navigate('/user-profile', { replace: true });
        }
      }, 300);
    }
  }, [isLoading, isAuthenticated, user, location.pathname, navigate, hasRedirected]);

  return null;
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
            console.log('Auth success event fired:', args);
            const isNew = args?.user?.newUser === true;
            
            // Get role from multiple sources
            const userRole = 
              args?.user?.metadata?.role || 
              localStorage.getItem('persistedUserRole') ||
              localStorage.getItem('userRole') ||
              localStorage.getItem('pendingRole');
            
            console.log('User role detected:', userRole, 'isNew:', isNew);
            
            // Use a longer delay to ensure user state is fully loaded before redirect
            setTimeout(() => {
              if (isNew) {
                console.log('Redirecting new user to /user-profile');
                window.location.href = '/user-profile';
                return;
              }

              if (userRole === 'employee') {
                console.log('Redirecting employee to /employeeDashboard');
                window.location.href = '/employeeDashboard';
              } else if (userRole === 'employer') {
                console.log('Redirecting employer to /employerDashboard');
                window.location.href = '/employerDashboard';
              } else {
                console.warn('No role found, redirecting to /user-profile');
                window.location.href = '/user-profile';
              }
            }, 500);
          },
        },
      }}
    >
      <AppContent />
      <div>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/about-us" element={<AboutPage />} />

          {/* Protected Routes */}
          <Route path="/user-profile" element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          } />
          <Route path="/job-details/:id" element={
            <ProtectedRoute>
              <JobDetails />
            </ProtectedRoute>
          } />

          {/* Employee Routes */}
          <Route path="/employeeDashboard" element={
            <ProtectedRoute>
              <EmployeeDashboard />
            </ProtectedRoute>
          } />
          <Route path="/employee-profile" element={
            <ProtectedRoute>
              <EmployeeProfile />
            </ProtectedRoute>
          } />
          <Route path="/employee-jobs" element={
            <ProtectedRoute>
              <EmployeeJobsPage />
            </ProtectedRoute>
          } />

          {/* Employer Routes */}
          <Route path="/employerDashboard" element={
            <ProtectedRoute>
              <EmployerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/employer-profile" element={
            <ProtectedRoute>
              <EmployerProfile />
            </ProtectedRoute>
          } />
          <Route path="/job" element={
            <ProtectedRoute>
              <Job />
            </ProtectedRoute>
          } />
          <Route path="/view-employees" element={
            <ProtectedRoute>
              <EmployerJobPortal />
            </ProtectedRoute>
          } />
          <Route path="/view-open-contracts" element={
            <ProtectedRoute>
              <OpenContracts />
            </ProtectedRoute>
          } />
          <Route path="/review-applications" element={
            <ProtectedRoute>
              <ReviewApplications />
            </ProtectedRoute>
          } />
          <Route path="/review-completed-contracts" element={
            <ProtectedRoute>
              <ReviewCompletedContracts />
            </ProtectedRoute>
          } />
          <Route path="/dispute" element={
            <ProtectedRoute>
              <Dispute />
            </ProtectedRoute>
          } />
          <Route path="/closed-contracts" element={
            <ProtectedRoute>
              <ClosedContracts />
            </ProtectedRoute>
          } />

          {/* 404 - Must be last */}
          <Route path="*" element={<h1>404 - Not Found</h1>} />
        </Routes>
      </div>
    </DynamicContextProvider>
  );
};

export default App;