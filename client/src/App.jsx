import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { PrivyProvider } from "@privy-io/react-auth";
import { SmartWalletsProvider } from "@privy-io/react-auth/smart-wallets";
import { baseSepolia } from "viem/chains";
import LandingPage from "./pages/LandingPage";
import EmployerLandingPage from "./pages/EmployerLandingPage";
import AboutPage from "./pages/NewAbout";
import WorkforceDashboard from "./EmployerPages/WorkforceDashboard";
import ComplianceHub from "./EmployerPages/ComplianceHub";
import EmployerProfile from "./EmployerPages/EmployerProfile";
import EmployeeProfile from "./EmployeePages/EmployeeProfile";
import ContractFactory from "./EmployerPages/ContractFactory";
import EmployeeJobsPage from "./EmployeePages/EmployeeJobsPage";
import JobTracker from "./EmployeePages/JobTracker";
import SupportCenter from "./EmployeePages/SupportCenter";
import { useEffect, useState, useRef, useCallback } from "react";
import UserProfile from "./pages/UserProfile";
import EmployerSupportCenter from "./EmployerPages/EmployerSupportCenter";
import MediatorResolution from "./pages/MediatorResolution";
import KioskPage from "./pages/KioskPage";
import KioskManagement from "./EmployerPages/KioskManagement";
import AdminMediators from "./pages/AdminMediators";
import AdminDashboard from "./pages/AdminDashboard";
import AdminDeployFactory from "./pages/AdminDeployFactory";
import AdminEmployers from "./pages/AdminEmployers";
import apiService from "./services/api";
import { setAuthTokenProvider } from "./services/authToken";
import { useAuth } from "./hooks/useAuth";
import { useIdleTimeout } from "./hooks/useIdleTimeout";
import IdleTimeoutWarning from "./components/IdleTimeoutWarning";

import ProtectedRoute from "./components/ProtectedRoute";
import EmployeeLayout from "./components/EmployeeLayout";
import EmployerLayout from "./components/EmployerLayout";

// Inner component to handle redirects based on auth state
const AppContent = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    getAccessToken,
    primaryWallet,
    smartWalletAddress,
    logout,
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [hasRedirected, setHasRedirected] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleModalContext, setRoleModalContext] = useState({ intendedRole: 'employee', otherRoleExists: false });

  // Track live auth state so the profile-check timeout can abort on logout
  const isAuthenticatedRef = useRef(isAuthenticated);

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

  // Keep isAuthenticatedRef in sync so setTimeout callbacks can read live auth state
  useEffect(() => { isAuthenticatedRef.current = isAuthenticated; }, [isAuthenticated]);

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
    // Also require smartWalletAddress to be initialized before checking — it is the primary
    // DB identity key. Without it the wallet lookup is skipped entirely, profileExists stays
    // false, and existing users get incorrectly routed to onboarding. smartWalletAddress is
    // already in the dep array so the effect re-fires automatically when it becomes available.
    const shouldCheck = loadingComplete && initialLoadComplete && isUserAuthenticated && user && isPublicPage && !hasRedirected && !checkingProfile && !!smartWalletAddress;

    if (shouldCheck) {
      // AIRBNB-STYLE ROLE TRACKING:
      // 1. Check pendingRole (set by landing page) - current session intent takes priority
      // 2. Check persistedUserRole (from previous session) - fallback to last active role
      // 3. Fall back to URL path if neither exists
      let intendedRole =
        localStorage.getItem('pendingRole') ||         // Set by landing page (current intent)
        localStorage.getItem('persistedUserRole');     // Last used role (persists across sessions)

      // If still no role, infer from URL as fallback.
      // Do NOT write to localStorage here — an inferred role is not an explicit
      // user choice, so hasPendingRole must stay false to allow the
      // "found you on the other side" redirect to work correctly.
      let urlInferredRole = false;
      if (!intendedRole) {
        urlInferredRole = true;
        intendedRole = location.pathname === '/employers' ? 'employer' : 'employee';
      }

      setHasRedirected(true);
      setCheckingProfile(true);

      // Check if user already has a profile in backend (works for both email and phone login)
      const checkProfileAndRedirect = async () => {
        // Abort if user logged out before the check could run
        if (isAuthenticatedRef.current === false) {
          setCheckingProfile(false);
          return;
        }
        try {
          // ADMIN SHORT-CIRCUIT:
          // Admins don't have employee/employer profiles, so skip the lookup
          // and send them directly to the admin dashboard.
          const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || '')
            .split(',')
            .map((e) => e.trim())
            .filter(Boolean);
          const userEmail = user?.email?.address;
          if (userEmail && adminEmails.includes(userEmail)) {
            navigate('/admin', { replace: true });
            return;
          }

          // DUAL-ROLE LOGIC — single API call returns both role statuses in parallel:
          // 1. Check if profile exists for intended role
          // 2. If not found, check other role — only redirect there if no explicit pendingRole
          // 3. If pendingRole is set and no profile for that role, send to onboarding (dual-role creation)
          // 4. Persist intended role to localStorage and redirect

          let profileExists = false;
          let hasOtherRole = false;
          const walletAddress = smartWalletAddress || primaryWallet?.address;
          const hasPendingRole = !!localStorage.getItem('pendingRole');

          const statusResponse = await apiService.getProfileStatus(walletAddress);
          const { employee, employer } = statusResponse?.data ?? {};

          const intendedIsEmployer = intendedRole === 'employer';
          const intendedProfile = intendedIsEmployer ? employer : employee;
          const otherProfile = intendedIsEmployer ? employee : employer;

          let otherRoleExists = !!otherProfile;

          if (intendedProfile) {
            profileExists = true;
          } else if (otherProfile && !hasPendingRole) {
            // Returning user landed on the wrong side — redirect to where their profile lives
            intendedRole = intendedIsEmployer ? 'employee' : 'employer';
            profileExists = true;
          }

          if (profileExists && otherProfile) {
            hasOtherRole = true;
          }
          if (otherRoleExists && !profileExists) {
            hasOtherRole = true;
          }

          // Persist roles to localStorage
          if (intendedRole) {
            localStorage.setItem('persistedUserRole', intendedRole);
          }
          localStorage.setItem('hasOtherRole', hasOtherRole ? 'true' : 'false');

          if (profileExists) {
            // User has a profile → redirect to dashboard for their role
            localStorage.removeItem('loginIntent');
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
            // No profile exists for the intended role
            const loginIntent = localStorage.getItem('loginIntent');
            localStorage.removeItem('loginIntent');
            if (loginIntent === 'login') {
              // User tried to log in but has no profile — show a modal instead of
              // silently routing them to onboarding
              setRoleModalContext({ intendedRole, otherRoleExists });
              setShowRoleModal(true);
            } else {
              // Sign up flow (or no intent set) → proceed to onboarding
              // Keep pendingRole for onboarding page to know which profile to create
              // Mediators/admins who land here by mistake can use the Exit button
              // to log out and follow the correct link from the landing page
              navigate('/user-profile', { replace: true });
            }
          }
        } catch (error) {
          console.error('Error during profile check:', error);
          // A network or server error during the check does NOT mean the user has no profile.
          // Routing to /user-profile here would send established users back to onboarding
          // every time there's a transient API failure. Reset flags so they can retry.
          setHasRedirected(false);
        } finally {
          setCheckingProfile(false);
        }
      };

      // smartWalletAddress is now guaranteed non-null before this block runs,
      // so no artificial delay is needed. Run immediately.
      checkProfileAndRedirect();
    }
  }, [isLoading, isAuthenticated, user, primaryWallet, smartWalletAddress, location.pathname, navigate, hasRedirected, checkingProfile, initialLoadComplete]);

  // Idle timeout — auto-logout after 15 min of inactivity (13 min idle + 2 min warning)
  const handleIdleTimeout = useCallback(async () => {
    await logout();
    navigate('/');
  }, [logout, navigate]);

  const { showWarning, stayLoggedIn } = useIdleTimeout({
    enabled: false, // Temporarily disabled for demo
    onTimeout: handleIdleTimeout,
  });

  const handleRoleModalSignUp = (role) => {
    setShowRoleModal(false);
    localStorage.setItem('pendingRole', role);
    localStorage.setItem('userRole', role);
    setHasRedirected(false);
    navigate('/user-profile', { replace: true });
  };

  const handleRoleModalGoOtherSide = () => {
    setShowRoleModal(false);
    setHasRedirected(false);
    const otherRole = roleModalContext.intendedRole === 'employer' ? 'employee' : 'employer';
    localStorage.setItem('pendingRole', otherRole);
    localStorage.setItem('userRole', otherRole);
    navigate(otherRole === 'employer' ? '/employers' : '/', { replace: true });
  };

  const handleRoleModalCancel = async () => {
    setShowRoleModal(false);
    await logout();
    navigate('/', { replace: true });
  };

  if (!showWarning && !showRoleModal) return null;

  return (
    <>
      {showWarning && (
        <IdleTimeoutWarning
          onStayLoggedIn={stayLoggedIn}
          onLogOut={handleIdleTimeout}
        />
      )}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-8 text-center">
            <div className="text-4xl mb-3">🔍</div>
            <h2 className="text-2xl font-bold text-[#0D3B66] mb-2">No account found!</h2>
            <p className="text-gray-500 mb-6">
              It looks like you don't have an account yet.
            </p>

            <button
              onClick={() => handleRoleModalSignUp(roleModalContext.intendedRole)}
              className="w-full px-4 py-3 bg-[#EE964B] text-white rounded-lg font-bold text-lg hover:bg-[#d97b33] transition-colors mb-4"
            >
              Sign Up
            </button>

            <button
              onClick={handleRoleModalGoOtherSide}
              className="w-full px-4 py-2 text-sm text-[#0D3B66] hover:underline transition-colors"
            >
              Log in as {roleModalContext.intendedRole === 'employee' ? 'Employer' : 'Worker'} →
            </button>

            <button
              onClick={handleRoleModalCancel}
              className="w-full px-4 py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors mt-1"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
};

const App = () => {
  // Kiosk page is fully standalone — no Privy, no auth, works over HTTP
  if (window.location.pathname === '/kiosk') {
    return <KioskPage />;
  }

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

            {/* Employee Routes */}
            <Route element={<EmployeeLayout />}>
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
            </Route>

            {/* Employer Routes */}
            <Route path="/employerDashboard" element={<Navigate to="/contract-factory" replace />} />
            {/* Redirect old job posting route to Recruitment Hub */}
            <Route path="/job" element={<Navigate to="/contract-factory" replace />} />
            <Route element={<EmployerLayout />}>
              <Route path="/employer-profile" element={
                <ProtectedRoute requiredRole="employer">
                  <EmployerProfile />
                </ProtectedRoute>
              } />
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
              <Route path="/compliance" element={
                <ProtectedRoute requiredRole="employer">
                  <ComplianceHub />
                </ProtectedRoute>
              } />
              <Route path="/employer-support" element={
                <ProtectedRoute requiredRole="employer">
                  <EmployerSupportCenter />
                </ProtectedRoute>
              } />
              <Route path="/kiosks" element={
                <ProtectedRoute requiredRole="employer">
                  <KioskManagement />
                </ProtectedRoute>
              } />
            </Route>

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
