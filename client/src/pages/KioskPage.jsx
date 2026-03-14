import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { BrowserQRCodeReader } from "@zxing/browser";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const SCAN_COOLDOWN_MS = 4000; // match server-side cooldown

function isStandalonePwa() {
  return window.matchMedia("(display-mode: standalone)").matches
    || window.navigator.standalone === true;
}

// ---------------------------------------------------------------------------
// Kiosk page — full-screen, standalone (no app layout, no Privy auth).
// Auth is via x-kiosk-token stored in localStorage after setup.
// Uses ZXing BrowserQRCodeReader for robust cross-device QR scanning.
//
// NFC strategy:
//   Standalone PWA  → NDEFReader.scan() for foreground reads (bypasses
//                     Samsung One UI's browser-level NFC interception).
//   Regular Chrome  → Android URL dispatch (cold-start / new-tab) as fallback.
// ---------------------------------------------------------------------------
export default function KioskPage() {
  const [searchParams] = useSearchParams();

  const [kioskToken, setKioskToken] = useState(() => localStorage.getItem("kioskToken") || "");
  const [setupMode, setSetupMode] = useState(!localStorage.getItem("kioskToken"));
  const [tokenInput, setTokenInput] = useState(() => searchParams.get("token") || "");
  const [setupError, setSetupError] = useState("");

  const [confirmation, setConfirmation] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [nfcStatus, setNfcStatus] = useState("idle"); // idle | listening | unavailable
  const [isPwa, setIsPwa] = useState(isStandalonePwa);

  const videoRef = useRef(null);
  const controlsRef = useRef(null); // ZXing scanner controls
  const nfcReaderRef = useRef(null);
  const lastScanAt = useRef(0);
  const processingRef = useRef(false);

  // Auto-activate if token provided via ?token= query param
  useEffect(() => {
    const paramToken = searchParams.get("token");
    if (paramToken) {
      localStorage.setItem("kioskToken", paramToken);
      setKioskToken(paramToken);
      setSetupMode(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // PWA: inject manifest + register service worker so the kiosk page can
  // be installed to the home screen as a standalone app.  This is kiosk-only
  // — the manifest is NOT in index.html, so the main app (Privy auth,
  // employer dashboard, etc.) is completely unaffected.
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "manifest";
    link.href = "/manifest.json";
    document.head.appendChild(link);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/kiosk-sw.js").catch(() => {});
    }

    return () => { document.head.removeChild(link); };
  }, []);

  // -------------------------------------------------------------------------
  // ZXing scanner setup / teardown
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (setupMode || !videoRef.current) return;

    const reader = new BrowserQRCodeReader();

    reader.decodeFromConstraints(
      { video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } } },
      videoRef.current,
      (result, error, controls) => {
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
        setScanError("Camera access denied. Please allow camera access and reload.");
      }
    });

    return () => {
      controlsRef.current?.stop();
    };
  }, [setupMode, kioskToken]); // eslint-disable-line react-hooks/exhaustive-deps

  // -------------------------------------------------------------------------
  // NFC path A — NDEFReader in standalone PWA mode.
  //
  // Samsung One UI intercepts NFC events before Chrome can deliver them,
  // but a standalone PWA runs as its own Android activity (WebAPK), which
  // may bypass the browser-specific interception layer.  We only activate
  // NDEFReader when we detect standalone display mode.
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (setupMode || !kioskToken || !isStandalonePwa()) return;
    if (!("NDEFReader" in window)) { setNfcStatus("unavailable"); return; }

    setIsPwa(true);
    const abortController = new AbortController();
    let reader;

    (async () => {
      try {
        reader = new NDEFReader();
        nfcReaderRef.current = reader;

        reader.addEventListener("reading", ({ serialNumber, message }) => {
          const now = Date.now();
          if (processingRef.current || now - lastScanAt.current < SCAN_COOLDOWN_MS) return;

          // Prefer the text record with nfc:<uid> prefix; fall back to serialNumber.
          let uid = serialNumber?.replace(/:/g, "").toUpperCase();
          if (message?.records) {
            for (const rec of message.records) {
              if (rec.recordType === "text") {
                try {
                  const text = new TextDecoder().decode(rec.data);
                  if (text.startsWith("nfc:")) { uid = text.slice(4); break; }
                } catch { /* ignore */ }
              }
            }
          }

          if (!uid) return;
          lastScanAt.current = now;
          submitNfcBadge(uid, kioskToken);
        }, { signal: abortController.signal });

        reader.addEventListener("readingerror", () => {
          console.warn("[Kiosk] NFC read error");
        }, { signal: abortController.signal });

        await reader.scan({ signal: abortController.signal });
        setNfcStatus("listening");
      } catch (err) {
        console.error("[Kiosk] NDEFReader failed:", err);
        setNfcStatus("unavailable");
      }
    })();

    return () => {
      abortController.abort();
      nfcReaderRef.current = null;
    };
  }, [setupMode, kioskToken]); // eslint-disable-line react-hooks/exhaustive-deps

  // -------------------------------------------------------------------------
  // NFC path B — Android URL dispatch (regular Chrome fallback).
  //
  // When running in a normal Chrome tab, NDEFReader doesn't work on Samsung
  // One UI.  Instead, Android's NDEF URL dispatch opens /kiosk?nfc=<uid>.
  // BroadcastChannel coordinates between tabs if Android opens a new one.
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (setupMode || !kioskToken) return;

    let channel = null;
    try { channel = new BroadcastChannel("lucidledger-kiosk-nfc"); } catch { /* unsupported */ }

    if (channel) {
      channel.onmessage = (e) => {
        if (e.data?.type === "nfc-scan" && e.data.uid) {
          const now = Date.now();
          if (processingRef.current || now - lastScanAt.current < SCAN_COOLDOWN_MS) return;
          lastScanAt.current = now;
          submitNfcBadge(e.data.uid, kioskToken);
        }
      };
    }

    const nfcUid = searchParams.get("nfc");
    if (nfcUid) {
      window.history.replaceState({}, "", window.location.pathname);
      if (channel) channel.postMessage({ type: "nfc-scan", uid: nfcUid });
      submitNfcBadge(nfcUid, kioskToken);
    }

    return () => { channel?.close(); };
  }, [setupMode, kioskToken, searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // -------------------------------------------------------------------------
  // Submit scan to backend
  // -------------------------------------------------------------------------
  const submitToken = async (token, kiosk) => {
    if (processingRef.current) return;
    processingRef.current = true;
    setScanError(null);

    // Capture GPS (non-blocking)
    let gps = {};
    try {
      await new Promise((resolve) => {
        navigator.geolocation?.getCurrentPosition(
          (pos) => {
            gps = { latitude: pos.coords.latitude, longitude: pos.coords.longitude, gps_accuracy: pos.coords.accuracy };
            resolve();
          },
          () => resolve(),
          { timeout: 2000, maximumAge: 30000 }
        );
      });
    } catch { /* ignore */ }

    try {
      const res = await fetch(`${API_BASE_URL}/presence-events`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-kiosk-token": kiosk },
        body: JSON.stringify({ token, client_timestamp: new Date().toISOString(), nonce: crypto.randomUUID(), ...gps })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setConfirmation(data.data);
        setTimeout(() => setConfirmation(null), 3000);
      } else {
        setScanError(data.message || "Scan failed");
        setTimeout(() => setScanError(null), 3000);
      }
    } catch {
      setScanError("Network error — please check connection");
      setTimeout(() => setScanError(null), 3000);
    } finally {
      processingRef.current = false;
    }
  };

  // -------------------------------------------------------------------------
  // Submit NFC badge scan to backend
  // -------------------------------------------------------------------------
  const submitNfcBadge = async (badgeUid, kiosk) => {
    if (processingRef.current) return;
    processingRef.current = true;
    setScanError(null);

    // Capture GPS (non-blocking)
    let gps = {};
    try {
      await new Promise((resolve) => {
        navigator.geolocation?.getCurrentPosition(
          (pos) => {
            gps = { latitude: pos.coords.latitude, longitude: pos.coords.longitude, gps_accuracy: pos.coords.accuracy };
            resolve();
          },
          () => resolve(),
          { timeout: 2000, maximumAge: 30000 }
        );
      });
    } catch { /* ignore */ }

    try {
      const res = await fetch(`${API_BASE_URL}/nfc-scans`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-kiosk-token": kiosk },
        body: JSON.stringify({ badge_uid: badgeUid, client_timestamp: new Date().toISOString(), nonce: crypto.randomUUID(), ...gps })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setConfirmation(data.data);
        setTimeout(() => setConfirmation(null), 3000);
      } else {
        setScanError(data.message || "Scan failed");
        setTimeout(() => setScanError(null), 3000);
      }
    } catch {
      setScanError("Network error — please check connection");
      setTimeout(() => setScanError(null), 3000);
    } finally {
      processingRef.current = false;
    }
  };

  // -------------------------------------------------------------------------
  // Setup flow
  // -------------------------------------------------------------------------
  const handleSetup = () => {
    const t = tokenInput.trim();
    if (!t) { setSetupError("Token cannot be empty"); return; }
    localStorage.setItem("kioskToken", t);
    setKioskToken(t);
    setSetupMode(false);
    setSetupError("");
  };

  const handleReset = () => {
    controlsRef.current?.stop();
    localStorage.removeItem("kioskToken");
    setKioskToken("");
    setTokenInput("");
    setSetupMode(true);
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
        <span className="text-white font-bold text-lg tracking-wide">Lucid Ledger Kiosk</span>
        <button onClick={handleReset} className="text-xs text-white/50 hover:text-white/80 transition-colors">
          Reset
        </button>
      </div>

      {/* Camera + overlays */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          muted
        />

        {/* Scan frame overlay */}
        {!confirmation && !scanError && (
          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="w-64 h-64 border-4 border-white/70 rounded-2xl" />
            <p className="text-white/80 text-sm font-medium bg-black/40 px-4 py-2 rounded-full">
              Hold QR code to camera · or tap NFC badge
            </p>
            {/* NFC status indicator (PWA mode) */}
            {isPwa && nfcStatus === "listening" && (
              <span className="inline-flex items-center gap-2 bg-green-600/80 text-white text-xs font-medium px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
                NFC active (PWA)
              </span>
            )}
            {isPwa && nfcStatus === "unavailable" && (
              <span className="inline-flex items-center gap-2 bg-red-600/80 text-white text-xs font-medium px-3 py-1.5 rounded-full">
                NFC unavailable
              </span>
            )}
            {!isPwa && (
              <span className="inline-flex items-center gap-2 bg-blue-600/70 text-white text-xs font-medium px-3 py-1.5 rounded-full">
                Install as app for best NFC support
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
