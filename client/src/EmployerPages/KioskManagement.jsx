import React, { useState, useEffect, useCallback, useRef } from "react";
import { Monitor, PlusCircle, Loader2, Copy, Check, ExternalLink, RefreshCw, CheckCircle, CreditCard, Wifi, UserCheck, UserX, AlertTriangle } from "lucide-react";
import apiService from "../services/api";

// Web NFC feature detection (Android Chrome 89+)
const NFC_SUPPORTED = typeof window !== "undefined" && "NDEFReader" in window;

// ---------------------------------------------------------------------------
// KioskManagement — tabbed page: Kiosk Devices | NFC Badges
// ---------------------------------------------------------------------------
export default function KioskManagement() {
  const [activeTab, setActiveTab] = useState("kiosks");

  return (
    <div className="max-w-3xl mx-auto">
      {/* Tab bar */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("kiosks")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "kiosks"
              ? "border-[#0D3B66] text-[#0D3B66]"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Monitor className="h-4 w-4" />
          Kiosk Devices
        </button>
        <button
          onClick={() => setActiveTab("nfc")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "nfc"
              ? "border-[#0D3B66] text-[#0D3B66]"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <CreditCard className="h-4 w-4" />
          NFC Badges
        </button>
      </div>

      {activeTab === "kiosks" ? <KioskTab /> : <NfcBadgeTab />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Kiosk Devices tab (unchanged from original implementation)
// ---------------------------------------------------------------------------
function KioskTab() {
  const [kiosks, setKiosks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [siteName, setSiteName] = useState("");
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState("");

  const [revealedToken, setRevealedToken] = useState(null);
  const [tokenCopied, setTokenCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const [actionLoading, setActionLoading] = useState({});

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
    <>
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
    </>
  );
}

// ---------------------------------------------------------------------------
// NFC Badges tab
// ---------------------------------------------------------------------------
function NfcBadgeTab() {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registerError, setRegisterError] = useState("");
  const [actionLoading, setActionLoading] = useState({});

  // Registration form state
  const [uidInput, setUidInput] = useState("");
  const [labelInput, setLabelInput] = useState("");
  const [registerEmployeeId, setRegisterEmployeeId] = useState("");
  const [registering, setRegistering] = useState(false);

  // NFC tap-to-read state
  const [nfcReading, setNfcReading] = useState(false);
  const [nfcWriteStatus, setNfcWriteStatus] = useState(""); // "writing" | "done" | "error"
  const [writingBadgeId, setWritingBadgeId] = useState(null); // badge id being written
  const nfcAbortRef = useRef(null);

  // Assign modal state (for reassigning existing badges)
  const [assignBadge, setAssignBadge] = useState(null);
  const [assignEmployeeId, setAssignEmployeeId] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState("");

  // Workers with active contracts under this employer
  const [workers, setWorkers] = useState([]);
  const [workersLoading, setWorkersLoading] = useState(false);

  const fetchWorkers = useCallback(async () => {
    setWorkersLoading(true);
    try {
      const res = await apiService.getDeployedContracts(null, "active");
      const contracts = res?.data || [];
      const seen = new Set();
      const unique = [];
      for (const c of contracts) {
        if (c.employee_id && !seen.has(c.employee_id)) {
          seen.add(c.employee_id);
          unique.push({
            id: c.employee_id,
            name: c.employee
              ? `${c.employee.first_name || ""} ${c.employee.last_name || ""}`.trim() || c.employee.email
              : `Employee #${c.employee_id}`
          });
        }
      }
      setWorkers(unique);
    } catch {
      setWorkers([]);
    } finally {
      setWorkersLoading(false);
    }
  }, []);

  const fetchBadges = useCallback(() => {
    setLoading(true);
    apiService.getNfcBadges()
      .then(res => setBadges(res?.data || []))
      .catch(() => setBadges([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchBadges();
    fetchWorkers();
  }, [fetchBadges, fetchWorkers]);

  // -------------------------------------------------------------------------
  // Tap-to-read: activate NFC reader for one-shot badge UID capture
  // -------------------------------------------------------------------------
  const handleTapToRead = async () => {
    if (!NFC_SUPPORTED) return;
    setNfcReading(true);
    setNfcWriteStatus("");
    setRegisterError("");

    const abortController = new AbortController();
    nfcAbortRef.current = abortController;

    try {
      const reader = new window.NDEFReader();
      await reader.scan({ signal: abortController.signal });
      reader.addEventListener("reading", async ({ serialNumber }) => {
        if (!serialNumber) return;
        abortController.abort(); // stop scanning — we have what we need
        setUidInput(serialNumber);

        // Write kiosk URL to the tag while it is still in range.
        // This enables Android URL dispatch — when a worker taps the badge
        // at the kiosk, Android opens the kiosk page with ?nfc=<uid>
        // instead of relying on Web NFC passive listening.
        setNfcWriteStatus("writing");
        try {
          const kioskUrl = `${window.location.origin}/kiosk?nfc=${serialNumber}`;
          const writer = new window.NDEFReader();
          const writeAbort = new AbortController();
          const writeTimeout = setTimeout(() => writeAbort.abort(), 4000);
          await writer.write(
            { records: [{ recordType: "url", data: kioskUrl }] },
            { signal: writeAbort.signal }
          );
          clearTimeout(writeTimeout);
          setNfcWriteStatus("done");
        } catch (writeErr) {
          if (writeErr?.name !== "AbortError") {
            console.warn("[NFC] Write failed:", writeErr.message);
          }
          setNfcWriteStatus("error");
        } finally {
          setNfcReading(false);
        }
      }, { signal: abortController.signal });
    } catch (err) {
      if (err?.name !== "AbortError") {
        setRegisterError("NFC read failed — try entering the UID manually");
      }
      setNfcReading(false);
    }
  };

  const cancelTapToRead = () => {
    nfcAbortRef.current?.abort();
    setNfcReading(false);
  };

  // -------------------------------------------------------------------------
  // Register badge (+ optional immediate assignment)
  // -------------------------------------------------------------------------
  const handleRegister = async () => {
    const uid = uidInput.trim();
    if (!uid) { setRegisterError("Badge UID is required"); return; }
    setRegistering(true);
    setRegisterError("");
    try {
      const employeeId = registerEmployeeId ? parseInt(registerEmployeeId, 10) : null;
      const res = await apiService.registerNfcBadge(uid, employeeId, labelInput.trim() || null);
      setBadges(prev => [res.data, ...prev]);
      setUidInput("");
      setLabelInput("");
      setRegisterEmployeeId("");
    } catch (err) {
      setRegisterError(err.message || "Failed to register badge");
    } finally {
      setRegistering(false);
    }
  };

  // -------------------------------------------------------------------------
  // Write kiosk URL to an already-registered badge
  // -------------------------------------------------------------------------
  const handleWriteUrl = async (badge) => {
    if (!NFC_SUPPORTED) return;
    setWritingBadgeId(badge.id);
    try {
      const kioskUrl = `${window.location.origin}/kiosk?nfc=${badge.badge_uid}`;
      const writer = new window.NDEFReader();
      const writeAbort = new AbortController();
      const writeTimeout = setTimeout(() => writeAbort.abort(), 4000);
      await writer.write(
        { records: [{ recordType: "url", data: kioskUrl }] },
        { signal: writeAbort.signal }
      );
      clearTimeout(writeTimeout);
    } catch (err) {
      if (err?.name !== "AbortError") {
        console.warn("[NFC] Write failed:", err.message);
      }
    } finally {
      setWritingBadgeId(null);
    }
  };

  // -------------------------------------------------------------------------
  // Open reassign modal for an existing badge
  // -------------------------------------------------------------------------
  const openAssignModal = (badge) => {
    setAssignBadge(badge);
    setAssignEmployeeId(badge.employee_id ? String(badge.employee_id) : "");
    setAssignError("");
  };

  // -------------------------------------------------------------------------
  // Assign badge to employee
  // -------------------------------------------------------------------------
  const handleAssignSubmit = async () => {
    setAssignLoading(true);
    setAssignError("");
    try {
      const employeeId = assignEmployeeId.trim() ? parseInt(assignEmployeeId.trim(), 10) : null;
      const res = await apiService.assignNfcBadge(assignBadge.id, employeeId);
      setBadges(prev => prev.map(b => b.id === assignBadge.id ? res.data : b));
      setAssignBadge(null);
      setAssignEmployeeId("");
    } catch (err) {
      setAssignError(err.message || "Failed to assign badge");
    } finally {
      setAssignLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // Suspend badge
  // -------------------------------------------------------------------------
  const handleSuspend = async (badge, status = "suspended") => {
    setActionLoading(prev => ({ ...prev, [badge.id]: true }));
    try {
      await apiService.suspendNfcBadge(badge.id, status);
      setBadges(prev => prev.map(b => b.id === badge.id ? { ...b, status } : b));
    } catch { /* silently fail */ }
    setActionLoading(prev => ({ ...prev, [badge.id]: false }));
  };

  const formatDate = (ts) => {
    if (!ts) return "—";
    return new Date(ts).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const employeeName = (badge) => {
    const e = badge.employee;
    if (!e) return null;
    return `${e.first_name || ""} ${e.last_name || ""}`.trim() || e.email;
  };

  return (
    <>
      {/* Register new badge */}
      <div className="border border-gray-200 rounded-xl p-5 mb-6 bg-white">
        <p className="text-sm font-semibold text-gray-800 mb-1">Register a new NFC badge</p>
        <p className="text-xs text-gray-500 mb-3">
          {NFC_SUPPORTED
            ? "Tap a badge on this device to auto-read its UID, or enter it manually."
            : "Enter the badge UID manually (tap-to-read requires Android Chrome)."}
        </p>

        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={uidInput}
              onChange={(e) => setUidInput(e.target.value)}
              placeholder="Badge UID (e.g. 04:A3:B2:12:34:56:78)"
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0D3B66]"
            />
            {NFC_SUPPORTED && (
              nfcReading ? (
                <button
                  onClick={cancelTapToRead}
                  className="flex items-center gap-1.5 px-3 py-2 border border-amber-300 bg-amber-50 text-amber-700 text-sm font-medium rounded-lg"
                >
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cancel
                </button>
              ) : (
                <button
                  onClick={handleTapToRead}
                  className="flex items-center gap-1.5 px-3 py-2 border border-[#0D3B66] text-[#0D3B66] text-sm font-medium rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <Wifi className="h-4 w-4" />
                  Tap Badge
                </button>
              )
            )}
          </div>

          {nfcReading && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              {nfcWriteStatus === "writing"
                ? "Writing kiosk URL to badge — keep badge in place…"
                : "Hold an NFC badge to the back of this device…"}
            </p>
          )}
          {!nfcReading && nfcWriteStatus === "done" && (
            <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              Badge ready — kiosk URL written successfully.
            </p>
          )}
          {!nfcReading && nfcWriteStatus === "error" && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              UID captured but URL write failed — hold the badge closer and tap again, or write manually using NFC Tools.
            </p>
          )}

          {/* Worker assignment — inline with registration */}
          {workersLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-400 py-1">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading workers…
            </div>
          ) : (
            <select
              value={registerEmployeeId}
              onChange={(e) => setRegisterEmployeeId(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D3B66] bg-white"
            >
              <option value="">— Assign to worker (optional) —</option>
              {workers.map(w => (
                <option key={w.id} value={String(w.id)}>{w.name}</option>
              ))}
            </select>
          )}

          <input
            type="text"
            value={labelInput}
            onChange={(e) => setLabelInput(e.target.value)}
            placeholder="Label (optional — e.g. Badge #47)"
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D3B66]"
          />

          <button
            onClick={handleRegister}
            disabled={registering || !uidInput.trim()}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[#0D3B66] text-white text-sm font-medium rounded-lg hover:bg-[#0a2f52] disabled:opacity-50 transition-colors"
          >
            {registering ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
            Register Badge
          </button>

          {registerError && <p className="text-xs text-red-600">{registerError}</p>}
        </div>
      </div>

      {/* Badge list */}
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400 p-6">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : badges.length === 0 ? (
          <p className="text-sm text-gray-400 text-center p-8">No NFC badges registered yet.</p>
        ) : (
          <table className="min-w-full text-xs">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="text-left font-medium px-4 py-3">Badge UID</th>
                <th className="text-left font-medium px-4 py-3">Label</th>
                <th className="text-left font-medium px-4 py-3">Assigned to</th>
                <th className="text-left font-medium px-4 py-3">Status</th>
                <th className="text-left font-medium px-4 py-3">Registered</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {badges.map((badge) => (
                <tr key={badge.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-mono text-gray-600">{badge.badge_uid}</td>
                  <td className="px-4 py-3 text-gray-500">{badge.label || <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-3 text-gray-700 font-medium">
                    {employeeName(badge) || <span className="text-gray-400 italic">Unassigned</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full font-semibold ${
                      badge.status === "active"
                        ? "bg-green-100 text-green-700"
                        : badge.status === "lost"
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-500"
                    }`}>
                      {badge.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(badge.registered_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 justify-end">
                      {actionLoading[badge.id] ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />
                      ) : (
                        <>
                          {badge.status === "active" && NFC_SUPPORTED && (
                            writingBadgeId === badge.id ? (
                              <span className="flex items-center gap-1 text-amber-600 text-xs">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Hold badge…
                              </span>
                            ) : (
                              <button
                                onClick={() => handleWriteUrl(badge)}
                                className="flex items-center gap-1 text-gray-500 hover:text-[#0D3B66] font-medium"
                                title="Write kiosk URL to this badge"
                              >
                                <Wifi className="h-3.5 w-3.5" />
                                Write URL
                              </button>
                            )
                          )}
                          {badge.status === "active" && (
                            <button
                              onClick={() => openAssignModal(badge)}
                              className="flex items-center gap-1 text-[#0D3B66] hover:text-[#0a2f52] font-medium"
                              title={badge.employee_id ? "Reassign or unassign" : "Assign to employee"}
                            >
                              <UserCheck className="h-3.5 w-3.5" />
                              {badge.employee_id ? "Reassign" : "Assign"}
                            </button>
                          )}
                          {badge.status === "active" && (
                            <button
                              onClick={() => handleSuspend(badge, "suspended")}
                              className="flex items-center gap-1 text-amber-600 hover:text-amber-800 font-medium"
                            >
                              <UserX className="h-3.5 w-3.5" />
                              Suspend
                            </button>
                          )}
                          {badge.status === "active" && (
                            <button
                              onClick={() => handleSuspend(badge, "lost")}
                              className="flex items-center gap-1 text-red-500 hover:text-red-700 font-medium"
                              title="Mark as lost or stolen"
                            >
                              <AlertTriangle className="h-3.5 w-3.5" />
                              Lost
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

      {/* Assign modal */}
      {assignBadge && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4">
            <div>
              <h3 className="text-lg font-bold text-[#0D3B66]">Assign Badge</h3>
              <p className="text-xs text-gray-500 mt-1 font-mono">{assignBadge.badge_uid}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Assign to worker</label>
              <select
                value={assignEmployeeId}
                onChange={(e) => setAssignEmployeeId(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D3B66] bg-white"
                autoFocus
              >
                <option value="">— Unassign (badge returned) —</option>
                {workers.map(w => (
                  <option key={w.id} value={String(w.id)}>{w.name}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400">Select a worker, or choose "Unassign" if the badge has been returned.</p>
            </div>
            {assignError && <p className="text-xs text-red-600">{assignError}</p>}
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setAssignBadge(null); setAssignEmployeeId(""); setAssignError(""); }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignSubmit}
                disabled={assignLoading}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#0D3B66] text-white text-sm font-medium rounded-xl hover:bg-[#0a2f52] disabled:opacity-50 transition-colors"
              >
                {assignLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
                {assignEmployeeId.trim() ? "Assign" : "Unassign"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
