import React, { useState, useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { BrowserQRCodeReader } from "@zxing/browser";

// Production API base URL — override via .env.local for local dev.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const SCAN_COOLDOWN_MS = 4000; // match server-side cooldown
const DEFAULT_KIOSK_MODE = "nfc";

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
  const [setupSubmitting, setSetupSubmitting] = useState(false);
  const [kioskMode, setKioskMode] = useState(() => localStorage.getItem("kioskMode") || DEFAULT_KIOSK_MODE);
  const [setupKioskMode, setSetupKioskMode] = useState(() => localStorage.getItem("kioskMode") || DEFAULT_KIOSK_MODE);

  const [confirmation, setConfirmation] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [nfcStatus, setNfcStatus] = useState("idle"); // idle | listening | unavailable
  const nfcUiActive = kioskMode === "nfc" && !setupMode && Capacitor.isNativePlatform();

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
    localStorage.removeItem("kioskMode");
    setKioskToken("");
    setSetupMode(true);
    setTokenInput(preserveTokenInput ? tokenInput : "");
    setKioskMode(DEFAULT_KIOSK_MODE);
    setSetupKioskMode(DEFAULT_KIOSK_MODE);
    setSetupError(setupMessage);
    setConfirmation(null);
    setScanError(null);
    setNfcStatus("idle");
  };

  const handleApiFailure = (res, data, fallbackMessage) => {
    const message = data?.message || fallbackMessage;

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
    let res;
    try {
      res = await fetch(`${API_BASE_URL}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-kiosk-token": kiosk },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      const detail = `${error?.name || "Error"}: ${error?.message || "request failed"}`;
      setScanError(`Network error — ${detail}`);
      setTimeout(() => setScanError(null), 5000);
      return null;
    }

    let data = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    return { res, data };
  };

  useEffect(() => {
    if (setupMode || kioskMode !== "qr" || !videoRef.current) return;

    const reader = new BrowserQRCodeReader();

    reader.decodeFromConstraints(
      {
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      },
      videoRef.current,
      (result, _error, controls) => {
        controlsRef.current = controls;
        if (!result) return;

        const token = result.getText();
        const now = Date.now();
        if (processingRef.current || now - lastScanAt.current < SCAN_COOLDOWN_MS) return;

        lastScanAt.current = now;
        submitToken(token, kioskToken);
      }
    ).catch((err) => {
      if (err?.name !== "AbortError") {
        setScanError("Camera access denied. Please allow camera access and try again.");
      }
    });

    return () => {
      try {
        controlsRef.current?.stop();
      } catch {
        // ignore camera teardown issues
      }
      controlsRef.current = null;
    };
  }, [setupMode, kioskMode, kioskToken]); // eslint-disable-line react-hooks/exhaustive-deps

  // -------------------------------------------------------------------------
  // Native NFC bridge — MainActivity dispatches kiosk-nfc / kiosk-nfc-status
  // CustomEvents into the WebView from Android reader mode.
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (setupMode || !kioskToken || kioskMode !== "nfc") {
      setNfcStatus("idle");
      return;
    }
    if (!Capacitor.isNativePlatform()) {
      setNfcStatus("unavailable");
      return;
    }

    setNfcStatus("listening");

    const handler = (e) => {
      const uid = e.detail?.uid;
      if (!uid) return;
      const now = Date.now();
      if (processingRef.current || now - lastScanAt.current < SCAN_COOLDOWN_MS) return;
      lastScanAt.current = now;
      submitNfcBadge(uid, kioskToken);
    };

    const statusHandler = (e) => {
      const status = e.detail?.status || "idle";
      setNfcStatus(status);
    };

    window.addEventListener("kiosk-nfc", handler);
    window.addEventListener("kiosk-nfc-status", statusHandler);

    setNfcStatus("idle");

    return () => {
      window.removeEventListener("kiosk-nfc", handler);
      window.removeEventListener("kiosk-nfc-status", statusHandler);
    };
  }, [setupMode, kioskMode, kioskToken]); // eslint-disable-line react-hooks/exhaustive-deps

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
  const validateKioskToken = async (token) => {
    const result = await postKioskJson("/nfc-scans", token, {
      badge_uid: "__kiosk_token_validation__",
      client_timestamp: new Date().toISOString(),
      nonce: crypto.randomUUID(),
    });

    if (!result) {
      return {
        valid: false,
        message: "Could not reach server to validate kiosk token",
      };
    }

    const { res, data } = result;

    if (res.status === 401) {
      return {
        valid: false,
        message: data?.message || "Invalid or inactive kiosk token",
      };
    }

    // Any non-401 response proves the kiosk token passed kioskAuth.
    return { valid: true };
  };

  const normalizeKioskTokenInput = (value) => {
    const trimmed = value.trim();
    if (!trimmed) return "";

    try {
      const url = new URL(trimmed);
      const urlToken = url.searchParams.get("token");
      if (urlToken) {
        return urlToken.trim();
      }
    } catch {
      // Not a URL; treat as raw token
    }

    return trimmed;
  };

  const handleSetup = async () => {
    const t = normalizeKioskTokenInput(tokenInput);
    if (!t) { setSetupError("Token cannot be empty"); return; }
    if (setupSubmitting) return;

    setSetupSubmitting(true);
    setSetupError("");

    try {
      const validation = await validateKioskToken(t);
      if (!validation.valid) {
        setSetupError(validation.message);
        return;
      }

      localStorage.setItem("kioskToken", t);
      localStorage.setItem("kioskMode", setupKioskMode);
      setKioskToken(t);
      setTokenInput(t);
      setKioskMode(setupKioskMode);
      setSetupMode(false);
      setSetupError("");
      setConfirmation(null);
      setScanError(null);
      processingRef.current = false;
      lastScanAt.current = 0;
    } finally {
      setSetupSubmitting(false);
    }
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
            <p className="text-xs text-gray-400 mt-1">
              You can paste either the raw token or the full kiosk setup link.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Default Scan Mode</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSetupKioskMode("nfc")}
                className={`rounded-xl border px-3 py-3 text-sm font-semibold transition-colors ${
                  setupKioskMode === "nfc"
                    ? "border-[#0D3B66] bg-[#0D3B66] text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                }`}
              >
                NFC
              </button>
              <button
                type="button"
                onClick={() => setSetupKioskMode("qr")}
                className={`rounded-xl border px-3 py-3 text-sm font-semibold transition-colors ${
                  setupKioskMode === "qr"
                    ? "border-[#0D3B66] bg-[#0D3B66] text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                }`}
              >
                QR
              </button>
            </div>
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
            disabled={setupSubmitting}
            className="w-full py-3 rounded-xl bg-[#0D3B66] text-white font-semibold text-sm hover:bg-[#0a2f52] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {setupSubmitting ? "Validating…" : "Activate Kiosk"}
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
          <span className="text-white font-bold text-lg tracking-wide">Lucid Ledger Kiosk</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/80 border border-white/20 rounded-full px-3 py-1">
            Mode: {kioskMode === "nfc" ? "NFC" : "QR"}
          </span>
          <button onClick={handleReset} className="text-xs text-white/50 hover:text-white/80 transition-colors">
            Reset
          </button>
        </div>
      </div>

      {/* Scan surface */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {kioskMode === "qr" && (
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            playsInline
            muted
          />
        )}

        {kioskMode === "nfc" && (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.18),_transparent_35%),linear-gradient(180deg,_#0b1220,_#111827)]" />
        )}

        {/* Scan frame + status */}
        {!confirmation && !scanError && (
          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className={`rounded-2xl border-4 border-white/70 ${kioskMode === "nfc" ? "w-72 h-72 flex items-center justify-center bg-white/5" : "w-64 h-64 bg-black/20 backdrop-blur-sm"}`}>
              {kioskMode === "nfc" && (
                <span className="text-white text-lg font-semibold tracking-wide">Tap NFC Badge</span>
              )}
              {kioskMode === "qr" && (
                <div className="w-full h-full border border-dashed border-white/50 rounded-xl" />
              )}
            </div>
            <p className="text-white/80 text-sm font-medium bg-black/40 px-4 py-2 rounded-full">
              {kioskMode === "nfc" ? "NFC mode" : "QR mode"}
            </p>
            {kioskMode === "nfc" && nfcUiActive && (
              <span className="inline-flex items-center gap-2 bg-green-600/80 text-white text-xs font-medium px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
                NFC active
              </span>
            )}
            {kioskMode === "nfc" && !nfcUiActive && nfcStatus === "unavailable" && (
              <span className="inline-flex items-center gap-2 bg-yellow-600/80 text-white text-xs font-medium px-3 py-1.5 rounded-full">
                NFC unavailable
              </span>
            )}
            {kioskMode === "qr" && (
              <span className="inline-flex items-center gap-2 bg-sky-600/80 text-white text-xs font-medium px-3 py-1.5 rounded-full">
                Camera scanner active
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
