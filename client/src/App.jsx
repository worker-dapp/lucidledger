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
import JobTracker from "./EmployeePages/JobTracker";
import SupportCenter from "./EmployeePages/SupportCenter";
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
          // Note: We check the database first even if newUser flag is set,
          // because Dynamic Labs might incorrectly mark returning users as new
          // (e.g., if they logged in with a different method than before)
          const isNew = user.newUser === true;
          
          if (isNew) {
            console.log('newUser flag is true, but checking database anyway to be safe');
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
          
          // Normalize phone number - database stores phone_number without country code
          // Country code is stored separately in country_code field
          if (phoneValue) {
            // Extract just the phone number digits (without country code)
            // Database stores phone_number as just the number, not with country code
            if (phoneValue.startsWith('+')) {
              // Remove country code - keep only the number part
              const match = phoneValue.match(/^\+\d{1,3}(.+)$/);
              if (match) {
                phoneNumber = match[1].replace(/\D/g, ''); // Just the number part
              } else {
                phoneNumber = phoneValue.replace(/\D/g, '');
              }
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
          // Database might store phone_number in different formats:
          // 1. Just digits (e.g., "1234567890")
          // 2. With country code (e.g., "+11234567890" or "11234567890")
          if (!profileExists && phoneNumber) {
            // Try multiple formats to handle different storage patterns
            const phoneDigits = phoneNumber.replace(/\D/g, ''); // All digits
            const phoneWithPlus = phoneValue.startsWith('+') ? phoneValue.replace(/\s/g, '') : `+${phoneDigits}`;
            const phoneWithoutPlus = phoneDigits;
            
            // Try formats: digits only, with +, original format
            const phoneFormats = [
              phoneWithoutPlus, // Most common: just digits
              phoneWithPlus,    // With country code and +
              phoneDigits       // Same as phoneWithoutPlus but explicit
            ];
            
            // Remove duplicates
            const uniqueFormats = [...new Set(phoneFormats.filter(f => f))];
            
            console.log('Trying phone number formats:', uniqueFormats);
            
            for (const phoneFormat of uniqueFormats) {
              if (profileExists) break;
              
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
              console.log('Profile exists, redirecting employee to /employee-dashboard');
              window.location.href = '/employee-dashboard';
            } else if (detectedRole === 'employer') {
              console.log('Profile exists, redirecting employer to /employerDashboard');
              window.location.href = '/employerDashboard';
            } else {
              console.log('Profile exists but no role, redirecting to /user-profile');
              window.location.href = '/user-profile';
            }
            return;
          }
          
          // No profile found in DB - redirect to profile creation
          // CRITICAL: Database is the source of truth, not Dynamic Labs' newUser flag or localStorage
          // If no profile exists in database, user MUST complete onboarding regardless of:
          // - Dynamic Labs newUser flag (may be false if they logged in before with dev bypass)
          // - localStorage cached role (may exist from previous session)
          // Without a DB profile, dashboards will break (no employee_id/employer_id for API calls)
          console.log('No profile found in DB. newUser flag:', isNew, 'userRole:', userRole);
          console.log('Redirecting to /user-profile to create profile (DB is source of truth)');
          window.location.href = '/user-profile';
        } catch (error) {
          console.error('Error checking profile:', error);
          // On error, fall back to original logic (same as email login)
          const isNew = user.newUser === true;
          if (isNew) {
            console.log('Error occurred, redirecting new user to /user-profile');
            navigate('/user-profile', { replace: true });
          } else if (userRole === 'employee') {
            console.log('Error occurred, redirecting employee to /employee-dashboard');
            navigate('/employee-dashboard', { replace: true });
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

          {/* Employee Routes - New Routes */}
          <Route path="/employee-dashboard" element={
            <ProtectedRoute>
              <EmployeeDashboard />
            </ProtectedRoute>
          } />
          <Route path="/job-search" element={
            <ProtectedRoute>
              <EmployeeJobsPage />
            </ProtectedRoute>
          } />
          <Route path="/job-tracker" element={
            <ProtectedRoute>
              <JobTracker />
            </ProtectedRoute>
          } />
          <Route path="/support-center" element={
            <ProtectedRoute>
              <SupportCenter />
            </ProtectedRoute>
          } />
          <Route path="/employee-profile" element={
            <ProtectedRoute>
              <EmployeeProfile />
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