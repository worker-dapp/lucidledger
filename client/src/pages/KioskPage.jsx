import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import jsQR from "jsqr";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const SCAN_COOLDOWN_MS = 4000; // match server-side cooldown

// ---------------------------------------------------------------------------
// Kiosk page — full-screen, standalone (no app layout, no Privy auth).
// Auth is via x-kiosk-token stored in localStorage after setup.
// ---------------------------------------------------------------------------
export default function KioskPage() {
  const [searchParams] = useSearchParams();

  const [kioskToken, setKioskToken] = useState(() => localStorage.getItem("kioskToken") || "");
  const [setupMode, setSetupMode] = useState(!localStorage.getItem("kioskToken"));
  const [tokenInput, setTokenInput] = useState(() => searchParams.get("token") || "");
  const [setupError, setSetupError] = useState("");

  // Scan state
  const [scanning, setScanning] = useState(false);
  const [confirmation, setConfirmation] = useState(null); // { eventType, worker, timestamp, gps }
  const [scanError, setScanError] = useState(null);
  const [lastScanAt, setLastScanAt] = useState(0);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const processingRef = useRef(false); // prevent concurrent submissions

  // Auto-activate if token provided via ?token= query param
  useEffect(() => {
    const paramToken = searchParams.get("token");
    if (paramToken && !localStorage.getItem("kioskToken")) {
      localStorage.setItem("kioskToken", paramToken);
      setKioskToken(paramToken);
      setSetupMode(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // -------------------------------------------------------------------------
  // Camera setup / teardown
  // -------------------------------------------------------------------------
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setScanning(true);
      }
    } catch (err) {
      setScanError("Camera access denied. Please allow camera access and reload.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setScanning(false);
  }, []);

  useEffect(() => {
    if (!setupMode) startCamera();
    return () => stopCamera();
  }, [setupMode, startCamera, stopCamera]);

  // -------------------------------------------------------------------------
  // QR decode loop
  // -------------------------------------------------------------------------
  const submitToken = useCallback(async (token) => {
    if (processingRef.current) return;
    if (Date.now() - lastScanAt < SCAN_COOLDOWN_MS) return;
    processingRef.current = true;
    setScanError(null);

    // Capture GPS (non-blocking — don't await before submission)
    let gps = {};
    try {
      await new Promise((resolve) => {
        navigator.geolocation?.getCurrentPosition(
          (pos) => {
            gps = {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              gps_accuracy: pos.coords.accuracy
            };
            resolve();
          },
          () => resolve(), // fail silently
          { timeout: 2000, maximumAge: 30000 }
        );
      });
    } catch { /* ignore */ }

    try {
      const res = await fetch(`${API_BASE_URL}/presence-events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-kiosk-token": kioskToken
        },
        body: JSON.stringify({
          token,
          client_timestamp: new Date().toISOString(),
          nonce: crypto.randomUUID(),
          ...gps
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setConfirmation(data.data);
        setLastScanAt(Date.now());
        // Return to scan mode after 3 seconds
        setTimeout(() => setConfirmation(null), 3000);
      } else {
        setScanError(data.message || "Scan failed");
        setLastScanAt(Date.now()); // still apply cooldown on error
        setTimeout(() => setScanError(null), 3000);
      }
    } catch (err) {
      setScanError("Network error — please check connection");
      setTimeout(() => setScanError(null), 3000);
    } finally {
      processingRef.current = false;
    }
  }, [kioskToken, lastScanAt]);

  const scanFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "attemptBoth"
    });

    if (code?.data && !processingRef.current && Date.now() - lastScanAt >= SCAN_COOLDOWN_MS) {
      submitToken(code.data);
    }

    rafRef.current = requestAnimationFrame(scanFrame);
  }, [submitToken, lastScanAt]);

  useEffect(() => {
    if (scanning) {
      rafRef.current = requestAnimationFrame(scanFrame);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [scanning, scanFrame]);

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
    stopCamera();
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
        <button
          onClick={handleReset}
          className="text-xs text-white/50 hover:text-white/80 transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Camera + overlays */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {/* Live camera feed */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          muted
        />
        {/* Hidden canvas for frame decoding */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Scan frame overlay */}
        {!confirmation && !scanError && (
          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="w-64 h-64 border-4 border-white/70 rounded-2xl" />
            <p className="text-white/80 text-sm font-medium bg-black/40 px-4 py-2 rounded-full">
              Hold worker's QR code up to camera
            </p>
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
