import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { DynamicContextProvider, useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { SdkViewSectionType, SdkViewType } from "@dynamic-labs/sdk-api";
import LandingPage from "./pages/LandingPage";
import EmployerLandingPage from "./pages/EmployerLandingPage";
import AboutPage from "./pages/NewAbout";
import WorkforceDashboard from "./EmployerPages/WorkforceDashboard";
import Dispute from "./EmployerPages/Dispute";
import JobDetails from "./pages/JobDetails";
import EmployerProfile from "./EmployerPages/EmployerProfile";
import EmployeeProfile from "./EmployeePages/EmployeeProfile";
import ReviewCompletedContracts from "./EmployerPages/ReviewCompletedContracts";
import ContractFactory from "./EmployerPages/ContractFactory";
import EmployeeJobsPage from "./EmployeePages/EmployeeJobsPage";
import JobTracker from "./EmployeePages/JobTracker";
import SupportCenter from "./EmployeePages/SupportCenter";
import { useEffect, useState, useRef } from "react";
import UserProfile from "./pages/UserProfile";
import ClosedContracts from "./EmployerPages/ClosedContracts";
import EmployerSupportCenter from "./EmployerPages/EmployerSupportCenter";
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
  const { user, isAuthenticated, isLoading, primaryWallet, handleLogOut } = useDynamicContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [hasRedirected, setHasRedirected] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Track previous user ID to detect new logins AND logouts
  const prevUserIdRef = useRef(user?.id);
  
  useEffect(() => {
    // Reset redirect flags when user ID changes (new login) OR when user logs out
    if (user?.id && user.id !== prevUserIdRef.current) {
      // New login or different user
      setHasRedirected(false);
      setCheckingProfile(false);
      prevUserIdRef.current = user.id;
    } else if (!user && prevUserIdRef.current) {
      // User logged out - reset flags so next login triggers profile check
      setHasRedirected(false);
      setCheckingProfile(false);
      prevUserIdRef.current = null;
    }
  }, [user?.id, user]);

  // Mark initial load as complete after Dynamic Labs finishes loading
  // Handle isLoading being undefined (not just false) as "loading complete"
  useEffect(() => {
    if (isLoading !== true && !initialLoadComplete) {
      setInitialLoadComplete(true);
    }
  }, [isLoading, initialLoadComplete]);

  // Track previous pathname to detect actual navigation
  const prevPathnameRef = useRef(location.pathname);

  // Reset hasRedirected when:
  // 1. User navigates TO a public page FROM a non-public page
  // 2. User switches between employee landing (/) and employer landing (/employers)
  // This prevents infinite loops while still allowing re-check when returning to public pages or switching roles
  useEffect(() => {
    const isPublicPage = location.pathname === '/' || location.pathname === '/about-us' || location.pathname === '/employers';
    const wasPublicPage = prevPathnameRef.current === '/' || prevPathnameRef.current === '/about-us' || prevPathnameRef.current === '/employers';
    
    // Detect role-switch: navigating between employee (/) and employer (/employers) landing pages
    const isEmployeeLanding = location.pathname === '/';
    const isEmployerLanding = location.pathname === '/employers';
    const wasEmployeeLanding = prevPathnameRef.current === '/';
    const wasEmployerLanding = prevPathnameRef.current === '/employers';
    const switchedRoles = (isEmployeeLanding && wasEmployerLanding) || (isEmployerLanding && wasEmployeeLanding);
    
    // Reset if we navigated TO a public page FROM a non-public page, OR if we switched between role landing pages
    if (hasRedirected && (isPublicPage && !wasPublicPage || switchedRoles)) {
      setHasRedirected(false);
      setCheckingProfile(false); // Also reset checkingProfile when switching contexts
    }
    
    prevPathnameRef.current = location.pathname;
  }, [location.pathname, hasRedirected]);

  useEffect(() => {
    // Wait for loading to complete and user to be available
    // Redirect authenticated users from landing page or any public page
    const isPublicPage = location.pathname === '/' || location.pathname === '/about-us' || location.pathname === '/employers';
    // CRITICAL: Use isAuthenticated flag from Dynamic Labs, not just user object presence
    // isLoading can be undefined initially, so treat undefined as "not loading"
    const loadingComplete = isLoading !== true; // Handle both false AND undefined as "loading complete"
    // Don't run check until initial load is complete to prevent FOUC
    // Use user object as primary auth check - if user exists, they're authenticated
    // isAuthenticated from Dynamic Labs can lag behind user object availability
    const isUserAuthenticated = isAuthenticated === true || (user && isAuthenticated !== false);
    const shouldCheck = loadingComplete && initialLoadComplete && isUserAuthenticated && user && isPublicPage && !hasRedirected && !checkingProfile;

    if (shouldCheck) {
      // AIRBNB-STYLE ROLE TRACKING:
      // 1. Check persistedUserRole (from previous session) - user's last active role
      // 2. Check pendingRole (set by landing page when clicking login)
      // 3. Fall back to URL path if neither exists
      let intendedRole =
        localStorage.getItem('persistedUserRole') || // Last used role (persists across sessions)
        localStorage.getItem('pendingRole') ||       // Set by landing page before auth
        user?.metadata?.role;                        // Set by Dynamic Labs handler

      // If still no role, infer from URL as fallback
      if (!intendedRole) {
        if (location.pathname === '/employers') {
          intendedRole = 'employer';
          localStorage.setItem('pendingRole', 'employer');
        } else {
          intendedRole = 'employee';
          localStorage.setItem('pendingRole', 'employee');
        }
      }

      setHasRedirected(true);
      setCheckingProfile(true);

      // Check if user already has a profile in backend (works for both email and phone login)
      const checkProfileAndRedirect = async () => {
        try {
          // AIRBNB-STYLE DUAL-ROLE LOGIC:
          // 1. Check if profile exists for intended role
          // 2. Also check if user has the OTHER role (for role switcher UI)
          // 3. Persist intended role to localStorage
          // 4. Redirect to appropriate dashboard

          let profileExists = false;
          let hasOtherRole = false; // Track if user has both profiles
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

          // Step 1: Check by wallet address (if available)
          // Check ONLY the intended role's table - dual roles are supported
          if (walletAddress && !profileExists) {
            try {
              if (intendedRole === 'employer') {
                const response = await apiService.getEmployerByWallet(walletAddress);
                if (response?.data) {
                  profileExists = true;
                }
              } else {
                const response = await apiService.getEmployeeByWallet(walletAddress);
                if (response?.data) {
                  profileExists = true;
                }
              }
            } catch (error) {
              // 404 is expected for new users - will check by email/phone below
            }
          }
          
          // Step 2: Check by email (if available)
          if (!profileExists && userEmail) {
            try {
              if (intendedRole === 'employer') {
                const response = await apiService.getEmployerByEmail(userEmail);
                if (response?.data) {
                  profileExists = true;
                }
              } else {
                const response = await apiService.getEmployeeByEmail(userEmail);
                if (response?.data) {
                  profileExists = true;
                }
              }
            } catch (error) {
              // 404 is expected - will check by phone below
            }
          }
          
          // Step 3: Check by phone number (if available)
          // Try multiple formats since database might store phone differently
          if (!profileExists && phoneNumber) {
            const phoneDigits = phoneNumber.replace(/\D/g, '');
            const phoneWithPlus = phoneValue.startsWith('+') ? phoneValue.replace(/\s/g, '') : `+${phoneDigits}`;
            const phoneFormats = [...new Set([phoneDigits, phoneWithPlus].filter(f => f))];

            for (const phoneFormat of phoneFormats) {
              if (profileExists) break;

              try {
                if (intendedRole === 'employer') {
                  const response = await apiService.getEmployerByPhone(phoneFormat);
                  if (response?.data) {
                    profileExists = true;
                    break;
                  }
                } else {
                  const response = await apiService.getEmployeeByPhone(phoneFormat);
                  if (response?.data) {
                    profileExists = true;
                    break;
                  }
                }
              } catch (error) {
                // Continue to next format
              }
            }
          }

          // Check if user has the OTHER role (for role switcher functionality)
          // This allows us to show "Switch to Employer/Employee" in navbar
          const otherRole = intendedRole === 'employer' ? 'employee' : 'employer';
          try {
            if (otherRole === 'employer' && walletAddress) {
              const response = await apiService.getEmployerByWallet(walletAddress);
              if (response?.data) hasOtherRole = true;
            } else if (otherRole === 'employee' && walletAddress) {
              const response = await apiService.getEmployeeByWallet(walletAddress);
              if (response?.data) hasOtherRole = true;
            }
          } catch (error) {
            // No other role - that's fine
          }

          // REDIRECT LOGIC: Based on profile existence and intended role
          if (profileExists) {
            // Profile exists for intended role → redirect to dashboard
            // Persist role for future sessions and clear pending role
            localStorage.setItem('persistedUserRole', intendedRole);
            localStorage.removeItem('pendingRole');

            if (intendedRole === 'employer') {
              navigate('/contract-factory', { replace: true });
            } else {
              // Employee - check for pending action first
              const pendingAction = localStorage.getItem('pendingAction');
              if (pendingAction) {
                try {
                  const { type, jobId, timestamp } = JSON.parse(pendingAction);
                  if (Date.now() - timestamp < 10 * 60 * 1000) {
                    navigate(`/job-search?action=${type}&jobId=${jobId}`, { replace: true });
                    return;
                  }
                  localStorage.removeItem('pendingAction');
                } catch (e) {
                  console.error('Error parsing pending action:', e);
                  localStorage.removeItem('pendingAction');
                }
              }
              // Employee stays on landing page (/) - navbar will update to show authenticated state
              // Mark as redirected to prevent infinite loop (even though we're staying)
              setHasRedirected(true);
            }
          } else {
            // No profile exists for intended role → redirect to onboarding
            // Keep pendingRole for onboarding page to know which profile to create
            navigate('/user-profile', { replace: true });
          }
        } catch (error) {
          console.error('Error during profile check:', error);
          // CRITICAL FIX: If profile checking failed with an error, we cannot trust
          // the user has a valid profile. The database is the source of truth.
          // Always redirect to profile creation to be safe, unless we confirmed a profile exists.
          // The individual API calls (wallet/email/phone) already handle 404s gracefully,
          // so if we reach this catch block, it's a real error (network, server, etc.)
          navigate('/user-profile', { replace: true });
        } finally {
          setCheckingProfile(false);
        }
      };
      
      // Add a small delay to ensure user state is fully set, then check profile
      setTimeout(checkProfileAndRedirect, 300);
    }
  }, [isLoading, isAuthenticated, user, primaryWallet, location.pathname, navigate, hasRedirected, checkingProfile, initialLoadComplete]);

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
          onAuthSuccess: () => {
            // Trigger a small delay to let AppContent detect the auth state change
            // AppContent will handle the actual redirect with profile checking
            setTimeout(() => {
              // Force a re-render by updating a state that AppContent depends on
              // The AppContent useEffect will run again and detect the authenticated state
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
          <Route path="/employers" element={<EmployerLandingPage />} />
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
          <Route path="/job-search" element={<EmployeeJobsPage />} />
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
          <Route path="/employerDashboard" element={<Navigate to="/contract-factory" replace />} />
          <Route path="/employer-profile" element={
            <ProtectedRoute>
              <EmployerProfile />
            </ProtectedRoute>
          } />
          {/* Redirect old job posting route to Recruitment Hub */}
          <Route path="/job" element={<Navigate to="/contract-factory" replace />} />
          <Route path="/contract-factory" element={
            <ProtectedRoute>
              <ContractFactory />
            </ProtectedRoute>
          } />
          <Route path="/workforce" element={
            <ProtectedRoute>
              <WorkforceDashboard />
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
          <Route path="/employer-support" element={
            <ProtectedRoute>
              <EmployerSupportCenter />
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
