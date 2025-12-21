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
import { useEffect, useState, useRef } from "react";
import UserProfile from "./pages/UserProfile";
import ClosedContracts from "./EmployerPages/ClosedContracts";
import apiService from "./services/api";

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
  const { user, isAuthenticated, isLoading, primaryWallet } = useDynamicContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [hasRedirected, setHasRedirected] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(false);
  
  // Track previous user ID to detect new logins
  const prevUserIdRef = useRef(user?.id);
  
  useEffect(() => {
    // Reset redirect flags only when user ID actually changes (new login)
    if (user?.id && user.id !== prevUserIdRef.current) {
      setHasRedirected(false);
      setCheckingProfile(false);
      prevUserIdRef.current = user.id;
      console.log('New user login detected, reset redirect flags:', user.id);
    }
  }, [user?.id]);

  useEffect(() => {
    // Wait for loading to complete and user to be available
    // Redirect authenticated users from landing page or any public page
    const isPublicPage = location.pathname === '/' || location.pathname === '/about-us';
    // If user exists, consider authenticated (user object is the source of truth)
    // isLoading can be undefined initially, so treat undefined as "not loading"
    const loadingComplete = isLoading !== true;
    const authenticated = user !== null && user !== undefined; // User object exists = authenticated
    const shouldCheck = loadingComplete && authenticated && user && isPublicPage && !hasRedirected && !checkingProfile;
    
    console.log('AppContent effect check:', {
      isLoading,
      isAuthenticated,
      hasUser: !!user,
      isPublicPage,
      hasRedirected,
      checkingProfile,
      loadingComplete,
      authenticated,
      shouldCheck
    });
    
    if (shouldCheck) {
      const userRole = 
        user?.metadata?.role || 
        localStorage.getItem('persistedUserRole') ||
        localStorage.getItem('userRole') ||
        localStorage.getItem('pendingRole');
      
      console.log('AppContent: User authenticated, role:', userRole, 'user:', user, 'primaryWallet:', primaryWallet?.address, 'location:', location.pathname);
      
      setHasRedirected(true);
      setCheckingProfile(true);
      
      // Check if user already has a profile in backend (works for both email and phone login)
      const checkProfileAndRedirect = async () => {
        try {
          // First check Dynamic Labs newUser flag - if new, skip DB check and redirect to profile
          const isNew = user.newUser === true;
          
          if (isNew) {
            console.log('New user detected by Dynamic Labs, redirecting to /user-profile (skipping DB check)');
            window.location.href = '/user-profile';
            return;
          }
          
          // User is not new according to Dynamic Labs - check database for existing profile
          let profileExists = false;
          let detectedRole = userRole;
          const walletAddress = primaryWallet?.address;
          const userEmail = user?.email;
          
          // Extract phone number from Dynamic Labs user object (similar to UserProfile.jsx)
          let phoneNumber = '';
          let phoneValue = user?.phone_number || user?.phone || '';
          
          // Check verifiedCredentials array for phone
          if (!phoneValue && user?.verifiedCredentials && Array.isArray(user.verifiedCredentials)) {
            const phoneCredential = user.verifiedCredentials.find(
              cred => 
                cred.type === 'phone' || 
                cred.credentialType === 'phone' || 
                cred.credential === 'phone' ||
                cred.credentialType === 'PHONE' ||
                (cred.address && /^\+?\d+$/.test(cred.address.replace(/\s/g, '')))
            );
            if (phoneCredential) {
              phoneValue = phoneCredential.value || phoneCredential.phone || phoneCredential.address || phoneCredential.id || '';
            } else {
              // Search through all credentials for phone-like values
              user.verifiedCredentials.forEach((c) => {
                Object.keys(c).forEach(key => {
                  const val = c[key];
                  if (val && typeof val === 'string' && /^\+?\d{10,}$/.test(val.replace(/\s/g, ''))) {
                    phoneValue = val;
                  }
                });
              });
            }
          }
          
          // Normalize phone number (remove non-digits, keep country code if present)
          if (phoneValue) {
            // If phone includes country code (starts with +), use as is
            // Otherwise, format it
            if (phoneValue.startsWith('+')) {
              phoneNumber = phoneValue.replace(/\s/g, '');
            } else {
              phoneNumber = phoneValue.replace(/\D/g, '');
            }
          }
          
          console.log('Existing user, checking profile in database with wallet:', walletAddress, 'email:', userEmail, 'phone:', phoneNumber);
          
          // Check profile by wallet address first (if available)
          if (walletAddress) {
            try {
              // Check employee profile
              const empResponse = await apiService.getEmployeeByWallet(walletAddress);
              if (empResponse?.data) {
                profileExists = true;
                detectedRole = 'employee';
                localStorage.setItem('persistedUserRole', 'employee');
                console.log('Found existing employee profile in backend by wallet');
              }
            } catch (empError) {
              // Not an employee, check employer
              try {
                const empResponse = await apiService.getEmployerByWallet(walletAddress);
                if (empResponse?.data) {
                  profileExists = true;
                  detectedRole = 'employer';
                  localStorage.setItem('persistedUserRole', 'employer');
                  console.log('Found existing employer profile in backend by wallet');
                }
              } catch (empError2) {
                // No profile found by wallet, will check by email/phone below
                console.log('No existing profile found in backend by wallet');
              }
            }
          }
          
          // If profile not found by wallet, check by email (if available)
          if (!profileExists && userEmail) {
            try {
              // Check employee profile by email
              const empResponse = await apiService.getEmployeeByEmail(userEmail);
              if (empResponse?.data) {
                profileExists = true;
                detectedRole = 'employee';
                localStorage.setItem('persistedUserRole', 'employee');
                console.log('Found existing employee profile in backend by email');
              }
            } catch (empError) {
              // Not an employee, check employer
              try {
                const empResponse = await apiService.getEmployerByEmail(userEmail);
                if (empResponse?.data) {
                  profileExists = true;
                  detectedRole = 'employer';
                  localStorage.setItem('persistedUserRole', 'employer');
                  console.log('Found existing employer profile in backend by email');
                }
              } catch (empError2) {
                // No profile found by email, will check by phone below
                console.log('No existing profile found in backend by email');
              }
            }
          }
          
          // If profile not found by wallet or email, check by phone number (if available)
          // Try multiple phone number formats since database might store it differently
          if (!profileExists && phoneNumber) {
            // Try different phone number formats
            const phoneFormats = [
              phoneNumber, // Original format (with or without +)
              phoneNumber.replace(/^\+/, ''), // Without leading +
              phoneNumber.replace(/\D/g, ''), // Digits only
            ];
            
            // Remove duplicates
            const uniqueFormats = [...new Set(phoneFormats)];
            
            for (const phoneFormat of uniqueFormats) {
              if (profileExists) break; // Stop if profile found
              
              try {
                // Check employee profile by phone
                const empResponse = await apiService.getEmployeeByPhone(phoneFormat);
                if (empResponse?.data) {
                  profileExists = true;
                  detectedRole = 'employee';
                  localStorage.setItem('persistedUserRole', 'employee');
                  console.log('Found existing employee profile in backend by phone:', phoneFormat);
                  break;
                }
              } catch (empError) {
                // Not an employee, check employer
                try {
                  const empResponse = await apiService.getEmployerByPhone(phoneFormat);
                  if (empResponse?.data) {
                    profileExists = true;
                    detectedRole = 'employer';
                    localStorage.setItem('persistedUserRole', 'employer');
                    console.log('Found existing employer profile in backend by phone:', phoneFormat);
                    break;
                  }
                } catch (empError2) {
                  // Continue to next format
                }
              }
            }
            
            if (!profileExists) {
              console.log('No existing profile found in backend by phone (tried formats:', uniqueFormats.join(', '), ')');
            }
          }
          
          if (!walletAddress && !userEmail && !phoneNumber) {
            console.log('No wallet address, email, or phone available, using role-based redirect');
          }
          
          // If profile exists, redirect to dashboard (same flow as email login)
          if (profileExists) {
            if (detectedRole === 'employee') {
              console.log('Profile exists, redirecting employee to /employeeDashboard');
              window.location.href = '/employeeDashboard';
            } else if (detectedRole === 'employer') {
              console.log('Profile exists, redirecting employer to /employerDashboard');
              window.location.href = '/employerDashboard';
            } else {
              console.log('Profile exists but no role, redirecting to /user-profile');
              window.location.href = '/user-profile';
            }
            return;
          }
          
          // No profile found in DB but user is not new - redirect based on role
          console.log('No profile found in DB, but user is not new. userRole:', userRole);
          
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
        } catch (error) {
          console.error('Error checking profile:', error);
          // On error, fall back to original logic (same as email login)
          const isNew = user.newUser === true;
          if (isNew) {
            console.log('Error occurred, redirecting new user to /user-profile');
            navigate('/user-profile', { replace: true });
          } else if (userRole === 'employee') {
            console.log('Error occurred, redirecting employee to /employeeDashboard');
            navigate('/employeeDashboard', { replace: true });
          } else if (userRole === 'employer') {
            console.log('Error occurred, redirecting employer to /employerDashboard');
            navigate('/employerDashboard', { replace: true });
          } else {
            console.log('Error occurred, redirecting to /user-profile');
            navigate('/user-profile', { replace: true });
          }
        } finally {
          setCheckingProfile(false);
        }
      };
      
      // Add a small delay to ensure user state is fully set, then check profile
      setTimeout(checkProfileAndRedirect, 300);
    }
  }, [isLoading, isAuthenticated, user, primaryWallet, location.pathname, navigate, hasRedirected, checkingProfile]);

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
            
            // Get role from multiple sources
            const userRole = 
              args?.user?.metadata?.role || 
              localStorage.getItem('persistedUserRole') ||
              localStorage.getItem('userRole') ||
              localStorage.getItem('pendingRole');
            
            console.log('User role detected:', userRole);
            
            // Trigger a small delay to let AppContent detect the auth state change
            // AppContent will handle the actual redirect with profile checking
            setTimeout(() => {
              // Force a re-render by updating a state that AppContent depends on
              // The AppContent useEffect will run again and detect the authenticated state
              console.log('onAuthSuccess: Waiting for AppContent to handle redirect...');
            }, 100);
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