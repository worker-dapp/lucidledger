import React, { useState, useEffect, createContext, useContext } from "react";
import { NavLink, Link, Outlet } from "react-router-dom";
import { LayoutGrid, Users, AlertTriangle, User, Menu, X, Monitor, Copy, Check, PlusCircle, Loader2, XCircle, CheckCircle } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import logo from "../assets/Android.png";
import LogoutButton from "./LogoutButton";
import BetaBanner from "./BetaBanner";
import SmartWalletInfo from "./SmartWalletInfo";
import EmployerApprovalBanner from "./EmployerApprovalBanner";
import apiService from "../services/api";

export const EmployerContext = createContext(null);
export const useEmployer = () => useContext(EmployerContext);

const navItems = [
  { to: "/contract-factory", label: "Recruitment Hub", icon: LayoutGrid },
  { to: "/workforce", label: "Workforce Dashboard", icon: Users },
  { to: "/compliance", label: "Compliance", icon: AlertTriangle },
  { to: "/employer-profile", label: "My Profile", icon: User },
];

const EmployerLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, smartWalletAddress } = useAuth();
  const [employerData, setEmployerData] = useState(null);

  // Kiosk management modal state
  const [showKioskModal, setShowKioskModal] = useState(false);
  const [kiosks, setKiosks] = useState([]);
  const [kioskLoading, setKioskLoading] = useState(false);
  const [kioskSiteName, setKioskSiteName] = useState("");
  const [registeringKiosk, setRegisteringKiosk] = useState(false);
  const [newKioskToken, setNewKioskToken] = useState(null);
  const [tokenCopied, setTokenCopied] = useState(false);
  const [kioskError, setKioskError] = useState("");

  const approvalStatus = employerData?.approval_status ?? null;
  const rejectionReason = employerData?.rejection_reason ?? null;

  const closeSidebar = () => setSidebarOpen(false);

  const openKioskModal = () => {
    setShowKioskModal(true);
    setNewKioskToken(null);
    setKioskError("");
    setKioskLoading(true);
    apiService.getKioskDevices()
      .then(res => setKiosks(res?.data || []))
      .catch(() => setKiosks([]))
      .finally(() => setKioskLoading(false));
  };

  const handleRegisterKiosk = async () => {
    setRegisteringKiosk(true);
    setKioskError("");
    try {
      const res = await apiService.registerKioskDevice(kioskSiteName.trim() || undefined);
      setNewKioskToken(res?.data?.rawToken || res?.data?.device_token || null);
      setKiosks(prev => [res?.data?.kiosk || res?.data, ...prev].filter(Boolean));
      setKioskSiteName("");
    } catch (err) {
      setKioskError(err.message || "Failed to register kiosk");
    } finally {
      setRegisteringKiosk(false);
    }
  };

  const handleSuspendKiosk = async (kioskId) => {
    try {
      await apiService.suspendKioskDevice(kioskId);
      setKiosks(prev => prev.map(k => k.id === kioskId ? { ...k, status: "suspended" } : k));
    } catch { /* silently fail */ }
  };

  const handleCopyToken = () => {
    if (!newKioskToken) return;
    navigator.clipboard.writeText(newKioskToken).then(() => {
      setTokenCopied(true);
      setTimeout(() => setTokenCopied(false), 2000);
    });
  };

  // Fetch employer data once — shared with all child pages via EmployerContext
  useEffect(() => {
    const fetchEmployer = async () => {
      try {
        let response = null;
        if (smartWalletAddress) {
          response = await apiService.getEmployerByWallet(smartWalletAddress);
        }
        if ((!response?.data) && user?.email?.address) {
          response = await apiService.getEmployerByEmail(user.email.address);
        }
        if (response?.data) {
          setEmployerData(response.data);
        }
      } catch (error) {
        console.error("Error fetching employer data:", error);
      }
    };

    if (smartWalletAddress || user?.email?.address) {
      fetchEmployer();
    }
  }, [smartWalletAddress, user?.email?.address]);

  return (
    <div className="min-h-screen bg-gray-50">
      <BetaBanner />
      <EmployerApprovalBanner approvalStatus={approvalStatus} rejectionReason={rejectionReason} />
      <header className="bg-[#0D3B66] shadow-md">
        <div className="max-w-7xl w-full mx-auto flex items-center justify-between px-4 sm:px-8 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="lg:hidden text-white hover:text-[#F4D35E] transition-all p-1"
              aria-label="Toggle navigation"
              onClick={() => setSidebarOpen((open) => !open)}
            >
              {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <Link
              to="/contract-factory"
              className="flex items-center gap-1 text-2xl sm:text-3xl font-bold tracking-wide"
            >
              <img
                src={logo}
                alt="Lucid Ledger Logo"
                className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
              />
              <span className="text-[#FFFFFF] hover:[#EE964B] transition-all">
                LUCID LEDGER
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {approvalStatus === 'approved' && <SmartWalletInfo />}
            <LogoutButton className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600 transition-all" />
          </div>
        </div>
      </header>

      <div className="flex">
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-60 bg-white border-r border-gray-200 shadow-sm transform transition-transform duration-200 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:static lg:translate-x-0`}
        >
          <div className="px-4 py-6 space-y-2">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2">
              Navigation
            </div>
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={closeSidebar}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[#EEF5FF] text-[#0D3B66]"
                      : "text-gray-700 hover:bg-gray-100"
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </NavLink>
            ))}

            {approvalStatus === 'approved' && (
              <button
                onClick={openKioskModal}
                className="mt-4 flex items-center gap-2 px-3 py-1.5 w-full rounded-lg text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <Monitor className="h-3.5 w-3.5" />
                Kiosk Devices
              </button>
            )}

            {user && (
              <div className="mt-2 px-3 py-2 rounded-lg bg-gray-50 text-xs text-gray-500">
                Signed in as{" "}
                <span className="font-semibold text-gray-700">
                  {user.first_name ||
                    user.email?.address ||
                    user.email ||
                    user.phone?.number ||
                    user.phone ||
                    "Employer"}
                </span>
              </div>
            )}
          </div>
        </aside>

        {sidebarOpen && (
          <button
            type="button"
            aria-label="Close navigation"
            className="fixed inset-0 z-30 bg-black/40 lg:hidden"
            onClick={closeSidebar}
          />
        )}

        <div className="flex-1 min-w-0">
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            <EmployerContext.Provider value={{ employerId: employerData?.id ?? null, approvalStatus, rejectionReason, employerData }}>
              {children ?? <Outlet />}
            </EmployerContext.Provider>
          </div>
        </div>
      </div>
      {/* Kiosk Management Modal */}
      {showKioskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Monitor className="h-5 w-5 text-[#0D3B66]" />
                <h3 className="text-lg font-semibold text-[#0D3B66]">Kiosk Devices</h3>
              </div>
              <button onClick={() => { setShowKioskModal(false); setNewKioskToken(null); }} className="text-gray-400 hover:text-gray-600">
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {/* Existing kiosks */}
            {kioskLoading ? (
              <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </div>
            ) : kiosks.length > 0 && (
              <div className="mb-5 border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full text-xs">
                  <thead className="bg-gray-50 text-gray-500">
                    <tr>
                      <th className="text-left font-medium px-4 py-2">Site</th>
                      <th className="text-left font-medium px-4 py-2">Device ID</th>
                      <th className="text-left font-medium px-4 py-2">Status</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {kiosks.map((kiosk) => (
                      <tr key={kiosk.id} className="border-t border-gray-100">
                        <td className="px-4 py-2 text-gray-700">{kiosk.site_name || <span className="text-gray-400">—</span>}</td>
                        <td className="px-4 py-2 font-mono text-gray-500">{kiosk.device_id?.slice(0, 12)}…</td>
                        <td className="px-4 py-2">
                          <span className={`px-1.5 py-0.5 rounded-full font-semibold ${kiosk.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                            {kiosk.status}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          {kiosk.status === "active" && (
                            <button onClick={() => handleSuspendKiosk(kiosk.id)} className="text-red-500 hover:text-red-700 font-medium">
                              Suspend
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Register new kiosk */}
            {!newKioskToken ? (
              <>
                <p className="text-sm font-medium text-gray-700 mb-2">Register a new kiosk</p>
                <p className="text-xs text-gray-500 mb-3">A one-time device token will be generated. Copy it to your kiosk setup screen — it cannot be retrieved again.</p>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={kioskSiteName}
                    onChange={(e) => setKioskSiteName(e.target.value)}
                    placeholder="Site name (e.g. Main Entrance)"
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D3B66]"
                  />
                  <button
                    onClick={handleRegisterKiosk}
                    disabled={registeringKiosk}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#0D3B66] text-white text-sm font-medium rounded-lg hover:bg-[#0a2f52] disabled:opacity-50"
                  >
                    {registeringKiosk ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                    Add
                  </button>
                </div>
                {kioskError && <p className="text-xs text-red-600">{kioskError}</p>}
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                  <p className="text-sm text-green-800 font-medium">Kiosk registered. Copy this token now — it won't be shown again.</p>
                </div>
                <p className="text-xs text-gray-500 mb-2">Paste it into the kiosk setup screen at <span className="font-mono bg-gray-100 px-1 py-0.5 rounded">/kiosk</span>.</p>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                  <span className="font-mono text-xs text-gray-700 break-all flex-1">{newKioskToken}</span>
                  <button onClick={handleCopyToken} className="shrink-0 text-gray-500 hover:text-gray-700" title="Copy token">
                    {tokenCopied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                <button
                  onClick={() => setNewKioskToken(null)}
                  className="text-sm text-[#0D3B66] hover:underline"
                >
                  Register another
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployerLayout;
