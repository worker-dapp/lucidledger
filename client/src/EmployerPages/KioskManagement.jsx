import React, { useState, useEffect, useCallback } from "react";
import { Monitor, PlusCircle, Loader2, Copy, Check, ExternalLink, RefreshCw, CheckCircle } from "lucide-react";
import apiService from "../services/api";

// ---------------------------------------------------------------------------
// KioskManagement — dedicated employer page for registering and managing
// kiosk devices. Replaces the sidebar modal.
// ---------------------------------------------------------------------------
export default function KioskManagement() {
  const [kiosks, setKiosks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Register new kiosk
  const [siteName, setSiteName] = useState("");
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState("");

  // Token reveal (registration or regeneration)
  const [revealedToken, setRevealedToken] = useState(null); // { kioskId, token, siteName }
  const [tokenCopied, setTokenCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Per-kiosk action loading
  const [actionLoading, setActionLoading] = useState({}); // kioskId → bool

  const fetchKiosks = useCallback(() => {
    setLoading(true);
    apiService.getKioskDevices()
      .then(res => setKiosks(res?.data || []))
      .catch(() => setKiosks([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchKiosks(); }, [fetchKiosks]);

  const handleRegister = async () => {
    setRegistering(true);
    setRegisterError("");
    try {
      const res = await apiService.registerKioskDevice(siteName.trim() || undefined);
      const d = res?.data;
      const newKiosk = {
        id: d?.id,
        site_name: d?.siteName,
        device_id: d?.deviceId,
        status: "active",
        registered_at: d?.registeredAt,
        scan_count: 0,
        last_used_at: null
      };
      setKiosks(prev => [newKiosk, ...prev]);
      setRevealedToken({ kioskId: d?.id, token: d?.kioskToken, siteName: d?.siteName });
      setSiteName("");
    } catch (err) {
      setRegisterError(err.message || "Failed to register kiosk");
    } finally {
      setRegistering(false);
    }
  };

  const handleRegenerate = async (kiosk) => {
    setActionLoading(prev => ({ ...prev, [kiosk.id]: true }));
    try {
      const res = await apiService.regenerateKioskToken(kiosk.id);
      const d = res?.data;
      setKiosks(prev => prev.map(k => k.id === kiosk.id ? { ...k, status: "active" } : k));
      setRevealedToken({ kioskId: kiosk.id, token: d?.kioskToken, siteName: kiosk.site_name });
    } catch { /* silently fail */ }
    setActionLoading(prev => ({ ...prev, [kiosk.id]: false }));
  };

  const handleSuspend = async (kioskId) => {
    setActionLoading(prev => ({ ...prev, [kioskId]: true }));
    try {
      await apiService.suspendKioskDevice(kioskId);
      setKiosks(prev => prev.map(k => k.id === kioskId ? { ...k, status: "suspended" } : k));
      if (revealedToken?.kioskId === kioskId) setRevealedToken(null);
    } catch { /* silently fail */ }
    setActionLoading(prev => ({ ...prev, [kioskId]: false }));
  };

  const handleCopyToken = () => {
    if (!revealedToken?.token) return;
    navigator.clipboard.writeText(revealedToken.token).then(() => {
      setTokenCopied(true);
      setTimeout(() => setTokenCopied(false), 2000);
    });
  };

  const kioskSetupUrl = revealedToken?.token
    ? `${window.location.origin}/kiosk?token=${revealedToken.token}`
    : null;

  const formatDate = (ts) => {
    if (!ts) return "—";
    return new Date(ts).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Monitor className="h-6 w-6 text-[#0D3B66]" />
        <h1 className="text-2xl font-bold text-[#0D3B66]">Kiosk Devices</h1>
      </div>

      {/* Token reveal banner */}
      {revealedToken && (
        <div className="mb-6 border border-green-200 rounded-xl bg-green-50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
            <p className="text-sm font-semibold text-green-800">
              {revealedToken.siteName || "Kiosk"} is ready. Open the reader on the device, or copy the setup link to send to whoever is setting it up.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white border border-green-200 rounded-lg px-3 py-2 mb-3">
            <span className="font-mono text-xs text-gray-500 break-all flex-1">{kioskSetupUrl}</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(kioskSetupUrl).then(() => {
                  setLinkCopied(true);
                  setTimeout(() => setLinkCopied(false), 2000);
                });
              }}
              className="shrink-0 text-gray-500 hover:text-gray-700"
              title="Copy setup link"
            >
              {linkCopied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={kioskSetupUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0D3B66] text-white text-sm font-medium rounded-lg hover:bg-[#0a2f52] transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Open Kiosk Reader
            </a>
            <button
              onClick={() => setRevealedToken(null)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Register new kiosk */}
      <div className="border border-gray-200 rounded-xl p-5 mb-6 bg-white">
        <p className="text-sm font-semibold text-gray-800 mb-1">Register a new kiosk</p>
        <p className="text-xs text-gray-500 mb-3">
          A one-time device token will be generated. Open the kiosk setup link on the device — or copy the token and paste it at <span className="font-mono bg-gray-100 px-1 py-0.5 rounded">/kiosk</span>.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !registering && handleRegister()}
            placeholder="Site name (e.g. Main Entrance)"
            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D3B66]"
          />
          <button
            onClick={handleRegister}
            disabled={registering}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#0D3B66] text-white text-sm font-medium rounded-lg hover:bg-[#0a2f52] disabled:opacity-50 transition-colors"
          >
            {registering ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
            Add
          </button>
        </div>
        {registerError && <p className="text-xs text-red-600 mt-2">{registerError}</p>}
      </div>

      {/* Kiosk list */}
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400 p-6">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : kiosks.length === 0 ? (
          <p className="text-sm text-gray-400 text-center p-8">No kiosks registered yet.</p>
        ) : (
          <table className="min-w-full text-xs">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="text-left font-medium px-4 py-3">Site</th>
                <th className="text-left font-medium px-4 py-3">Device ID</th>
                <th className="text-left font-medium px-4 py-3">Status</th>
                <th className="text-left font-medium px-4 py-3">Last used</th>
                <th className="text-left font-medium px-4 py-3">Scans</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {kiosks.map((kiosk) => (
                <tr key={kiosk.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 text-gray-800 font-medium">
                    {kiosk.site_name || <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-500">
                    {String(kiosk.device_id).slice(0, 8)}…
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full font-semibold ${
                      kiosk.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}>
                      {kiosk.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(kiosk.last_used_at)}</td>
                  <td className="px-4 py-3 text-gray-500">{kiosk.scan_count ?? 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 justify-end">
                      {actionLoading[kiosk.id] ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />
                      ) : (
                        <>
                          <button
                            onClick={() => handleRegenerate(kiosk)}
                            className="flex items-center gap-1 text-[#0D3B66] hover:text-[#0a2f52] font-medium"
                            title="Generate a new token (invalidates old one)"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                            New token
                          </button>
                          {kiosk.status === "active" && (
                            <button
                              onClick={() => handleSuspend(kiosk.id)}
                              className="text-red-500 hover:text-red-700 font-medium"
                            >
                              Suspend
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
