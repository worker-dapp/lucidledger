import React, { useState, useEffect, useRef } from "react";
import { BrowserQRCodeReader } from "@zxing/browser";
import { Capacitor } from "@capacitor/core";
import { CapacitorNfc } from "@capgo/capacitor-nfc";

// Production API base URL — override via .env.local for local dev.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const SCAN_COOLDOWN_MS = 4000; // match server-side cooldown

// ---------------------------------------------------------------------------
// Kiosk page — Capacitor native app version.
//
// NFC is handled via @capgo/capacitor-nfc which uses Android's
// enableReaderMode() at the Activity level.  This bypasses both Samsung One
// UI's browser interception layer AND the OS URL-intent dispatch that was
// stealing our tags in the web version.  The NDEFReader Web NFC API is NOT used.
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

  // -------------------------------------------------------------------------
  // ZXing QR scanner — unchanged from web version
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
  // NFC path A — NDEF_DISCOVERED intent via MainActivity.java (primary path).
  //
  // Samsung routes URL-type NFC tags through Android's intent dispatch even
  // when enableReaderMode() is registered.  We register an NDEF_DISCOVERED
  // intent filter for https://lucidledger.co/kiosk in AndroidManifest.xml so
  // our app receives the intent instead of Chrome.  MainActivity extracts the
  // ?nfc= param and fires a 'kiosk-nfc' CustomEvent on window.
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (setupMode || !kioskToken) return;

    const handler = (e) => {
      const uid = e.detail?.uid;
      if (!uid) return;
      addDebug(`kiosk-nfc event: uid=${uid}`);
      const now = Date.now();
      if (processingRef.current || now - lastScanAt.current < SCAN_COOLDOWN_MS) return;
      lastScanAt.current = now;
      submitNfcBadge(uid, kioskToken);
    };

    window.addEventListener("kiosk-nfc", handler);
    return () => window.removeEventListener("kiosk-nfc", handler);
  }, [setupMode, kioskToken]); // eslint-disable-line react-hooks/exhaustive-deps

  // -------------------------------------------------------------------------
  // NFC path B — Capacitor enableReaderMode() (fallback for non-Samsung).
  //
  // event.tag.id is number[] (e.g. [0x04, 0xAB, 0xCD, ...]) — converted to
  // uppercase hex string without separators to match the format stored during
  // badge registration in KioskManagement (which strips ":" from serialNumber).
  //
  // Falls back to parsing the text record "nfc:<uid>" written during registration
  // as a secondary UID source, in case a device returns an empty id array.
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (setupMode || !kioskToken) return;
    if (!Capacitor.isNativePlatform()) {
      // Running in browser (dev/preview) — NFC unavailable, QR-only mode.
      setNfcStatus("unavailable");
      return;
    }

    let listenerHandle = null;

    (async () => {
      try {
        listenerHandle = await CapacitorNfc.addListener("nfcEvent", ({ tag }) => {
          addDebug(`nfcEvent fired! type=${tag?.type ?? "?"} id=${JSON.stringify(tag?.id)}`);
          const now = Date.now();
          if (processingRef.current || now - lastScanAt.current < SCAN_COOLDOWN_MS) return;

          // Primary: hardware UID from tag.id (number array → hex string)
          let uid = (tag.id || [])
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("")
            .toUpperCase();

          // Secondary: text record "nfc:<uid>" written during badge registration.
          // Payload format: [statusByte, ...langCode, ...textBytes]
          // where statusByte bits 5-0 = language code length.
          if (!uid && tag.ndefMessage) {
            for (const rec of tag.ndefMessage) {
              if (rec.tnf === 1 && rec.type?.length === 1 && rec.type[0] === 0x54 && rec.payload) {
                try {
                  const langLen = rec.payload[0] & 0x3f;
                  const text = new TextDecoder().decode(new Uint8Array(rec.payload.slice(1 + langLen)));
                  if (text.startsWith("nfc:")) { uid = text.slice(4); break; }
                } catch { /* ignore */ }
              }
            }
          }

          if (!uid) return;
          lastScanAt.current = now;
          submitNfcBadge(uid, kioskToken);
        });

        await CapacitorNfc.startScanning();
        setNfcStatus("listening");
        addDebug("startScanning() resolved OK");
      } catch (err) {
        console.error("[Kiosk] Capacitor NFC failed:", err);
        setNfcStatus("unavailable");
      }
    })();

    return () => {
      listenerHandle?.remove();
      CapacitorNfc.stopScanning().catch(() => {});
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
      const res = await fetch(`${API_BASE_URL}/presence-events`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-kiosk-token": kiosk },
        body: JSON.stringify({
          token,
          client_timestamp: new Date().toISOString(),
          nonce: crypto.randomUUID(),
          ...gps,
        }),
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
  // Submit NFC badge scan
  // -------------------------------------------------------------------------
  const submitNfcBadge = async (badgeUid, kiosk) => {
    if (processingRef.current) return;
    processingRef.current = true;
    setScanError(null);

    const gps = await captureGps();

    try {
      const res = await fetch(`${API_BASE_URL}/nfc-scans`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-kiosk-token": kiosk },
        body: JSON.stringify({
          badge_uid: badgeUid,
          client_timestamp: new Date().toISOString(),
          nonce: crypto.randomUUID(),
          ...gps,
        }),
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
    setSetupMode(false);
    setSetupError("");
  };

  const handleReset = () => {
    controlsRef.current?.stop();
    CapacitorNfc.stopScanning().catch(() => {});
    localStorage.removeItem("kioskToken");
    setKioskToken("");
    setTokenInput("");
    setSetupMode(true);
    setNfcStatus("idle");
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

        {/* Scan frame + status */}
        {!confirmation && !scanError && (
          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="w-64 h-64 border-4 border-white/70 rounded-2xl" />
            <p className="text-white/80 text-sm font-medium bg-black/40 px-4 py-2 rounded-full">
              Hold QR code to camera · or tap NFC badge
            </p>
            {nfcStatus === "listening" && (
              <span className="inline-flex items-center gap-2 bg-green-600/80 text-white text-xs font-medium px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
                NFC active
              </span>
            )}
            {nfcStatus === "unavailable" && (
              <span className="inline-flex items-center gap-2 bg-yellow-600/80 text-white text-xs font-medium px-3 py-1.5 rounded-full">
                QR only — NFC unavailable
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
