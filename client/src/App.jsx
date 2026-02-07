import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { PrivyProvider } from "@privy-io/react-auth";
import { SmartWalletsProvider } from "@privy-io/react-auth/smart-wallets";
import { baseSepolia } from "viem/chains";
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
import MediatorResolution from "./pages/MediatorResolution";
import AdminMediators from "./pages/AdminMediators";
import AdminDashboard from "./pages/AdminDashboard";
import AdminDeployFactory from "./pages/AdminDeployFactory";
import AdminEmployers from "./pages/AdminEmployers";
import apiService from "./services/api";
import { setAuthTokenProvider } from "./services/authToken";
import { useAuth } from "./hooks/useAuth";

import ProtectedRoute from "./components/ProtectedRoute";

// Inner component to handle redirects based on auth state
const AppContent = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    getAccessToken,
    primaryWallet,
    smartWalletAddress,
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [hasRedirected, setHasRedirected] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  useEffect(() => {
    if (getAccessToken) {
      setAuthTokenProvider(() => getAccessToken());
    }
  }, [getAccessToken]);

  // Set wallet address for API requests (used for identity verification)
  useEffect(() => {
    if (smartWalletAddress) {
      apiService.setWalletAddress(smartWalletAddress);
    } else {
      apiService.setWalletAddress(null);
    }
  }, [smartWalletAddress]);

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

  // Mark initial load as complete after Privy finishes loading
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
    // isLoading can be undefined initially, so treat undefined as "not loading"
    const loadingComplete = isLoading !== true; // Handle both false AND undefined as "loading complete"
    // Don't run check until initial load is complete to prevent FOUC
    // Use user object as primary auth check - if user exists, they're authenticated
    const isUserAuthenticated = isAuthenticated === true || (user && isAuthenticated !== false);
    const shouldCheck = loadingComplete && initialLoadComplete && isUserAuthenticated && user && isPublicPage && !hasRedirected && !checkingProfile;

    if (shouldCheck) {
      // AIRBNB-STYLE ROLE TRACKING:
      // 1. Check pendingRole (set by landing page) - current session intent takes priority
      // 2. Check persistedUserRole (from previous session) - fallback to last active role
      // 3. Fall back to URL path if neither exists
      let intendedRole =
        localStorage.getItem('pendingRole') ||         // Set by landing page (current intent)
        localStorage.getItem('persistedUserRole');     // Last used role (persists across sessions)

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
          let foundProfileId = null; // Track found profile for wallet sync
          let foundProfileWallet = null;
          let hasOtherRole = false; // Track if user has both profiles
          const walletAddress = smartWalletAddress || primaryWallet?.address;
          const userEmail = user?.email?.address || user?.email || '';

          // Extract phone number from Privy user object
          let phoneNumber = '';
          let phoneValue = user?.phone?.number || user?.phone?.phoneNumber || user?.phoneNumber || '';

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
                  foundProfileId = response.data.id;
                  foundProfileWallet = response.data.wallet_address;
                }
              } else {
                const response = await apiService.getEmployeeByWallet(walletAddress);
                if (response?.data) {
                  profileExists = true;
                  foundProfileId = response.data.id;
                  foundProfileWallet = response.data.wallet_address;
                }
              }
            } catch (err) {
              // Ignore 404s (expected if profile doesn't exist)
            }
          }

          // Step 2: Check by email if wallet not found
          if (!profileExists && userEmail) {
            try {
              if (intendedRole === 'employer') {
                const response = await apiService.getEmployerByEmail(userEmail);
                if (response?.data) {
                  profileExists = true;
                  foundProfileId = response.data.id;
                  foundProfileWallet = response.data.wallet_address;
                }
              } else {
                const response = await apiService.getEmployeeByEmail(userEmail);
                if (response?.data) {
                  profileExists = true;
                  foundProfileId = response.data.id;
                  foundProfileWallet = response.data.wallet_address;
                }
              }
            } catch (err) {
              // Ignore 404s
            }
          }

          // Step 3: Check by phone if still not found
          if (!profileExists && phoneNumber) {
            try {
              if (intendedRole === 'employer') {
                const response = await apiService.getEmployerByPhone(phoneNumber);
                if (response?.data) {
                  profileExists = true;
                  foundProfileId = response.data.id;
                  foundProfileWallet = response.data.wallet_address;
                }
              } else {
                const response = await apiService.getEmployeeByPhone(phoneNumber);
                if (response?.data) {
                  profileExists = true;
                  foundProfileId = response.data.id;
                  foundProfileWallet = response.data.wallet_address;
                }
              }
            } catch (err) {
              // Ignore 404s
            }
          }

          // Step 3.5: Sync wallet address if profile found by email/phone but wallet differs
          // This handles users who created accounts before Privy wallet integration
          if (profileExists && foundProfileId && walletAddress && foundProfileWallet !== walletAddress) {
            try {
              if (intendedRole === 'employer') {
                await apiService.updateEmployer(foundProfileId, { wallet_address: walletAddress });
              } else {
                await apiService.updateEmployee(foundProfileId, { wallet_address: walletAddress });
              }
              console.log('Synced wallet address for profile:', foundProfileId);
            } catch (err) {
              console.error('Failed to sync wallet address:', err);
              // Continue anyway - profile exists, wallet sync failed but user can still proceed
            }
          }

          // Step 4: Check if user has the OTHER role (for role switcher UI)
          if (walletAddress) {
            try {
              if (intendedRole === 'employer') {
                const response = await apiService.getEmployeeByWallet(walletAddress);
                if (response?.data) {
                  hasOtherRole = true;
                }
              } else {
                const response = await apiService.getEmployerByWallet(walletAddress);
                if (response?.data) {
                  hasOtherRole = true;
                }
              }
            } catch (err) {
              // Ignore 404s
            }
          }

          // Persist roles to localStorage
          if (intendedRole) {
            localStorage.setItem('persistedUserRole', intendedRole);
          }
          localStorage.setItem('hasOtherRole', hasOtherRole ? 'true' : 'false');

          if (profileExists) {
            // User has a profile for intended role → redirect to dashboard
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
          // If profile checking failed with an error, we cannot trust
          // the user has a valid profile. Redirect to profile creation to be safe.
          navigate('/user-profile', { replace: true });
        } finally {
          setCheckingProfile(false);
        }
      };

      // Add a small delay to ensure user state is fully set, then check profile
      setTimeout(checkProfileAndRedirect, 300);
    }
  }, [isLoading, isAuthenticated, user, primaryWallet, smartWalletAddress, location.pathname, navigate, hasRedirected, checkingProfile, initialLoadComplete]);

  return null;
};

const App = () => {
  // Check if Privy app ID is configured
  const privyAppId = import.meta.env.VITE_PRIVY_APP_ID;

  if (!privyAppId) {
    console.error('VITE_PRIVY_APP_ID is not configured. Please set this environment variable.');
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Configuration Error</h2>
        <p>Privy App ID is not configured.</p>
        <p>Please contact the administrator.</p>
      </div>
    );
  }

  return (
    <PrivyProvider
      appId={privyAppId}
      config={{
        embeddedWallets: {
          createOnLogin: "users-without-wallets",
        },
        defaultChain: baseSepolia,
        supportedChains: [baseSepolia],
      }}
    >
      <SmartWalletsProvider>
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
              <ProtectedRoute requiredRole="employee">
                <JobTracker />
              </ProtectedRoute>
            } />
            <Route path="/support-center" element={
              <ProtectedRoute requiredRole="employee">
                <SupportCenter />
              </ProtectedRoute>
            } />
            <Route path="/employee-profile" element={
              <ProtectedRoute requiredRole="employee">
                <EmployeeProfile />
              </ProtectedRoute>
            } />

            {/* Employer Routes */}
            <Route path="/employerDashboard" element={<Navigate to="/contract-factory" replace />} />
            <Route path="/employer-profile" element={
              <ProtectedRoute requiredRole="employer">
                <EmployerProfile />
              </ProtectedRoute>
            } />
            {/* Redirect old job posting route to Recruitment Hub */}
            <Route path="/job" element={<Navigate to="/contract-factory" replace />} />
            <Route path="/contract-factory" element={
              <ProtectedRoute requiredRole="employer">
                <ContractFactory />
              </ProtectedRoute>
            } />
            <Route path="/workforce" element={
              <ProtectedRoute requiredRole="employer">
                <WorkforceDashboard />
              </ProtectedRoute>
            } />
            <Route path="/review-completed-contracts" element={
              <ProtectedRoute requiredRole="employer">
                <ReviewCompletedContracts />
              </ProtectedRoute>
            } />
            <Route path="/dispute" element={
              <ProtectedRoute requiredRole="employer">
                <Dispute />
              </ProtectedRoute>
            } />
            <Route path="/closed-contracts" element={
              <ProtectedRoute requiredRole="employer">
                <ClosedContracts />
              </ProtectedRoute>
            } />
            <Route path="/employer-support" element={
              <ProtectedRoute requiredRole="employer">
                <EmployerSupportCenter />
              </ProtectedRoute>
            } />

            {/* Mediator Route - Self-validates via DB-backed mediator list */}
            <Route path="/resolve-disputes" element={<MediatorResolution />} />

            {/* Admin Routes - Self-validate via ADMIN_EMAILS */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/employers" element={<AdminEmployers />} />
            <Route path="/admin/mediators" element={<AdminMediators />} />
            <Route path="/admin/deploy-factory" element={<AdminDeployFactory />} />

            {/* 404 - Must be last */}
            <Route path="*" element={<h1>404 - Not Found</h1>} />
          </Routes>
        </div>
      </SmartWalletsProvider>
    </PrivyProvider>
  );
};

export default App;
