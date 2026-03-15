import React, { useState, useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";

// Production API base URL — override via .env.local for local dev.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const SCAN_COOLDOWN_MS = 4000; // match server-side cooldown
const KIOSK_INPUT_MODE = "nfc";
const DIAGNOSTIC_BUILD_ID = "nfc-reader-only-v4";

// ---------------------------------------------------------------------------
// Kiosk page — Capacitor native app version.
//
// NFC is handled by the custom Android MainActivity using native
// NfcAdapter.enableReaderMode(). The native layer emits CustomEvents into the
// WebView, and React consumes those events as a normal kiosk input source.
//
// QR scanning is unchanged from the web version (ZXing BrowserQRCodeReader).
//
// Auth: x-kiosk-token stored in localStorage (persisted by Android WebView).
// ---------------------------------------------------------------------------
export default function KioskPage() {
  const [kioskToken, setKioskToken] = useState(() => localStorage.getItem("kioskToken") || "");
  const [setupMode, setSetupMode] = useState(!localStorage.getItem("kioskToken"));
  const [tokenInput, setTokenInput] = useState("");
  const [setupError, setSetupError] = useState("");

  const [confirmation, setConfirmation] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [nfcStatus, setNfcStatus] = useState("idle"); // idle | listening | unavailable
  const [debugLog, setDebugLog] = useState([]);

  const addDebug = (msg) => {
    const ts = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setDebugLog((prev) => [`${ts} ${msg}`, ...prev].slice(0, 12));
  };

  const videoRef = useRef(null);
  const controlsRef = useRef(null);
  const lastScanAt = useRef(0);
  const processingRef = useRef(false);

  const clearSession = ({ setupMessage = "", preserveTokenInput = false } = {}) => {
    try {
      controlsRef.current?.stop();
    } catch {
      // ignore camera teardown issues during reset
    }
    controlsRef.current = null;
    processingRef.current = false;
    lastScanAt.current = 0;

    localStorage.removeItem("kioskToken");
    setKioskToken("");
    setSetupMode(true);
    setTokenInput(preserveTokenInput ? tokenInput : "");
    setSetupError(setupMessage);
    setConfirmation(null);
    setScanError(null);
    setNfcStatus("idle");
    setDebugLog(setupMessage ? [`${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })} ${setupMessage}`] : []);
  };

  const handleApiFailure = (res, data, fallbackMessage) => {
    const message = data?.message || fallbackMessage;
    const code = data?.code ? ` (${data.code})` : "";
    addDebug(`api failure: ${res?.status || "unknown"} ${message}${code}`);

    if (res?.status === 401) {
      clearSession({
        setupMessage: "Kiosk token missing or invalid. Enter a valid device token.",
        preserveTokenInput: false,
      });
      return;
    }

    setScanError(message);
    setTimeout(() => setScanError(null), 3000);
  };

  const postKioskJson = async (path, kiosk, payload) => {
    const url = `${API_BASE_URL}${path}`;
    addDebug(`POST ${url}`);

    let res;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-kiosk-token": kiosk },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      const detail = `${error?.name || "Error"}: ${error?.message || "request failed"}`;
      addDebug(`fetch error: ${detail}`);
      setScanError(`Network error — ${detail}`);
      setTimeout(() => setScanError(null), 5000);
      return null;
    }

    let data = null;
    try {
      data = await res.json();
    } catch (error) {
      addDebug(`response parse failed: ${error?.message || "invalid JSON"}`);
      data = null;
    }

    addDebug(`response ${res.status}${data?.code ? ` ${data.code}` : ""}`);
    return { res, data };
  };

  // -------------------------------------------------------------------------
  // Native NFC bridge — MainActivity dispatches kiosk-nfc / kiosk-nfc-status
  // CustomEvents into the WebView from Android reader mode.
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (setupMode || !kioskToken) return;
    if (!Capacitor.isNativePlatform()) {
      setNfcStatus("unavailable");
      return;
    }

    const handler = (e) => {
      const uid = e.detail?.uid;
      if (!uid) return;
      addDebug(`kiosk-nfc event: uid=${uid}`);
      const now = Date.now();
      if (processingRef.current || now - lastScanAt.current < SCAN_COOLDOWN_MS) return;
      lastScanAt.current = now;
      submitNfcBadge(uid, kioskToken);
    };

    const statusHandler = (e) => {
      const status = e.detail?.status || "idle";
      setNfcStatus(status);
      addDebug(`nfc status: ${status}`);
    };

    window.addEventListener("kiosk-nfc", handler);
    window.addEventListener("kiosk-nfc-status", statusHandler);

    setNfcStatus("idle");
    addDebug("waiting for native NFC reader");

    return () => {
      window.removeEventListener("kiosk-nfc", handler);
      window.removeEventListener("kiosk-nfc-status", statusHandler);
    };
  }, [setupMode, kioskToken]); // eslint-disable-line react-hooks/exhaustive-deps

  // -------------------------------------------------------------------------
  // Submit QR token scan
  // -------------------------------------------------------------------------
  const submitToken = async (token, kiosk) => {
    if (processingRef.current) return;
    processingRef.current = true;
    setScanError(null);

    const gps = await captureGps();

    try {
      const result = await postKioskJson("/presence-events", kiosk, {
        token,
        client_timestamp: new Date().toISOString(),
        nonce: crypto.randomUUID(),
        ...gps,
      });
      if (!result) return;
      const { res, data } = result;

      if (res.ok && data.success) {
        setConfirmation(data.data);
        setTimeout(() => setConfirmation(null), 3000);
      } else {
        handleApiFailure(res, data, "Scan failed");
      }
    } finally {
      processingRef.current = false;
    }
  };

  // -------------------------------------------------------------------------
  // Submit NFC badge scan
  // -------------------------------------------------------------------------
  const submitNfcBadge = async (badgeUid, kiosk) => {
    if (processingRef.current) return;
    processingRef.current = true;
    setScanError(null);

    const gps = await captureGps();

    try {
      const result = await postKioskJson("/nfc-scans", kiosk, {
        badge_uid: badgeUid,
        client_timestamp: new Date().toISOString(),
        nonce: crypto.randomUUID(),
        ...gps,
      });
      if (!result) return;
      const { res, data } = result;

      if (res.ok && data.success) {
        setConfirmation(data.data);
        setTimeout(() => setConfirmation(null), 3000);
      } else {
        handleApiFailure(res, data, "Scan failed");
      }
    } finally {
      processingRef.current = false;
    }
  };

  // -------------------------------------------------------------------------
  // GPS helper (non-blocking, 2 s timeout)
  // -------------------------------------------------------------------------
  const captureGps = () =>
    new Promise((resolve) => {
      navigator.geolocation?.getCurrentPosition(
        (pos) =>
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            gps_accuracy: pos.coords.accuracy,
          }),
        () => resolve({}),
        { timeout: 2000, maximumAge: 30000 }
      );
      // Resolve empty if geolocation not available
      if (!navigator.geolocation) resolve({});
    });

  // -------------------------------------------------------------------------
  // Setup flow
  // -------------------------------------------------------------------------
  const handleSetup = () => {
    const t = tokenInput.trim();
    if (!t) { setSetupError("Token cannot be empty"); return; }
    localStorage.setItem("kioskToken", t);
    setKioskToken(t);
    setTokenInput(t);
    setSetupMode(false);
    setSetupError("");
    setConfirmation(null);
    setScanError(null);
    setDebugLog([]);
    processingRef.current = false;
    lastScanAt.current = 0;
  };

  const handleReset = () => {
    clearSession();

    // A hard reload is the most reliable way to reset camera + WebView state
    // inside the Capacitor shell after an active scan session.
    window.setTimeout(() => {
      window.location.reload();
    }, 50);
  };

  // -------------------------------------------------------------------------
  // Render helpers
  // -------------------------------------------------------------------------
  const InitialsAvatar = ({ initials }) => (
    <div className="w-24 h-24 rounded-full bg-[#0D3B66] flex items-center justify-center">
      <span className="text-4xl font-bold text-white">{initials || "?"}</span>
    </div>
  );

  const formatTime = (ts) => {
    if (!ts) return "";
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  // -------------------------------------------------------------------------
  // Setup screen
  // -------------------------------------------------------------------------
  if (setupMode) {
    return (
      <div className="min-h-screen bg-[#0D3B66] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 flex flex-col gap-5">
          <div>
            <h1 className="text-2xl font-bold text-[#0D3B66]">Kiosk Setup</h1>
            <p className="text-sm text-gray-500 mt-1">
              Enter the kiosk device token provided by your employer's Lucid Ledger account.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Device Token</label>
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSetup()}
              placeholder="Paste token here…"
              className="w-full border border-gray-200 rounded-xl p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0D3B66]"
              autoFocus
            />
            {setupError && <p className="text-xs text-red-600">{setupError}</p>}
          </div>
          <button
            onClick={handleSetup}
            className="w-full py-3 rounded-xl bg-[#0D3B66] text-white font-semibold text-sm hover:bg-[#0a2f52] transition-colors"
          >
            Activate Kiosk
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Main kiosk screen
  // -------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-[#0D3B66]">
        <div className="flex flex-col">
          <span className="text-white font-bold text-lg tracking-wide">Lucid Ledger Kiosk TEST nfc-reader-only-v4</span>
          <span className="text-[11px] text-white/70 font-mono tracking-wide">
            Build {DIAGNOSTIC_BUILD_ID}
          </span>
          <span className="text-[10px] text-white/50 font-mono tracking-wide">
            API {API_BASE_URL}
          </span>
        </div>
        <button onClick={handleReset} className="text-xs text-white/50 hover:text-white/80 transition-colors">
          Reset
        </button>
      </div>

      {/* Scan surface */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {KIOSK_INPUT_MODE === "qr" && (
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            playsInline
            muted
          />
        )}

        {KIOSK_INPUT_MODE === "nfc" && (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.18),_transparent_35%),linear-gradient(180deg,_#0b1220,_#111827)]" />
        )}

        {/* Scan frame + status */}
        {!confirmation && !scanError && (
          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className={`rounded-2xl border-4 border-white/70 ${KIOSK_INPUT_MODE === "nfc" ? "w-72 h-72 flex items-center justify-center bg-white/5" : "w-64 h-64"}`}>
              {KIOSK_INPUT_MODE === "nfc" && (
                <span className="text-white text-lg font-semibold tracking-wide">Tap NFC Badge</span>
              )}
            </div>
            <p className="text-white/80 text-sm font-medium bg-black/40 px-4 py-2 rounded-full">
              {KIOSK_INPUT_MODE === "nfc" ? "NFC-only diagnostic mode" : "QR-only diagnostic mode"}
            </p>
            {nfcStatus === "listening" && (
              <span className="inline-flex items-center gap-2 bg-green-600/80 text-white text-xs font-medium px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
                NFC active
              </span>
            )}
            {nfcStatus === "unavailable" && (
              <span className="inline-flex items-center gap-2 bg-yellow-600/80 text-white text-xs font-medium px-3 py-1.5 rounded-full">
                NFC unavailable
              </span>
            )}
          </div>
        )}

        {/* Success confirmation */}
        {confirmation && (
          <div className="relative z-10 flex flex-col items-center gap-4 bg-black/70 rounded-2xl p-8 min-w-[280px]">
            <InitialsAvatar initials={confirmation.worker?.initials} />
            <div className="text-center">
              <p className="text-white text-2xl font-bold">
                {confirmation.worker?.firstName} {confirmation.worker?.lastName}
              </p>
              <p className={`text-lg font-semibold mt-1 ${confirmation.eventType === "clock_in" ? "text-green-400" : "text-amber-400"}`}>
                {confirmation.eventType === "clock_in" ? "Clocked In" : "Clocked Out"}
              </p>
              <p className="text-white/60 text-sm mt-1">{formatTime(confirmation.serverTimestamp)}</p>
              {confirmation.gps && (
                <p className="text-white/40 text-xs mt-1">
                  📍 {confirmation.gps.latitude?.toFixed(4)}, {confirmation.gps.longitude?.toFixed(4)}
                </p>
              )}
            </div>
            <div className={`w-full py-2 rounded-xl text-center font-bold text-lg ${confirmation.eventType === "clock_in" ? "bg-green-500 text-white" : "bg-amber-500 text-white"}`}>
              ✓ Recorded
            </div>
          </div>
        )}

        {/* DEBUG PANEL — remove before release */}
        {debugLog.length > 0 && (
          <div className="absolute bottom-4 left-2 right-2 z-20 bg-black/80 text-green-400 text-xs font-mono p-2 rounded-xl max-h-40 overflow-hidden">
            {debugLog.map((line, i) => <div key={i}>{line}</div>)}
          </div>
        )}

        {/* Error banner */}
        {scanError && !confirmation && (
          <div className="relative z-10 bg-red-600/90 text-white px-6 py-4 rounded-xl text-center max-w-xs">
            <p className="font-semibold">Scan Failed</p>
            <p className="text-sm mt-1 text-red-100">{scanError}</p>
          </div>
        )}
      </div>
    </div>
  );
}
