import React, { useState, useEffect, useRef, useCallback } from "react";
import { X, RefreshCw, Clock } from "lucide-react";
import apiService from "../services/api";

const TOKEN_TTL_SECONDS = 30;

export default function QrClockModal({ contract, onClose }) {
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(TOKEN_TTL_SECONDS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);
  const refreshTimerRef = useRef(null);

  const fetchToken = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.generateQrToken(contract.deployed_contract_id || contract.id);
      setQrDataUrl(res.data.qrDataUrl);
      setExpiresAt(new Date(res.data.expiresAt));
      setSecondsLeft(TOKEN_TTL_SECONDS);
    } catch (err) {
      setError(err.message || "Failed to generate QR code");
    } finally {
      setLoading(false);
    }
  }, [contract]);

  // Initial load
  useEffect(() => {
    fetchToken();
    return () => {
      clearInterval(timerRef.current);
      clearTimeout(refreshTimerRef.current);
    };
  }, [fetchToken]);

  // Countdown timer — auto-refresh when it hits 0
  useEffect(() => {
    if (!expiresAt) return;
    clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      const left = Math.max(0, Math.round((expiresAt - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0) {
        clearInterval(timerRef.current);
        fetchToken();
      }
    }, 500);

    return () => clearInterval(timerRef.current);
  }, [expiresAt, fetchToken]);

  const timerColor =
    secondsLeft > 15 ? "text-green-600" : secondsLeft > 7 ? "text-amber-500" : "text-red-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-[#0D3B66]">Clock In / Out</h2>
            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[220px]">{contract.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col items-center px-5 py-6 gap-4">
          {loading && (
            <div className="flex flex-col items-center gap-3 py-8">
              <RefreshCw className="h-8 w-8 text-[#0D3B66] animate-spin" />
              <p className="text-sm text-gray-500">Generating QR code…</p>
            </div>
          )}

          {error && !loading && (
            <div className="w-full bg-red-50 border border-red-200 rounded-xl p-4 text-center">
              <p className="text-sm text-red-700 mb-3">{error}</p>
              <button
                onClick={fetchToken}
                className="text-sm font-medium text-red-600 hover:text-red-800 underline"
              >
                Try again
              </button>
            </div>
          )}

          {qrDataUrl && !loading && !error && (
            <>
              {/* QR code */}
              <div className="p-3 border-2 border-[#0D3B66]/10 rounded-2xl bg-white shadow-sm">
                <img
                  src={qrDataUrl}
                  alt="QR code for clock-in/out"
                  className="w-56 h-56 block"
                  draggable={false}
                />
              </div>

              {/* Countdown */}
              <div className="flex items-center gap-2">
                <Clock className={`h-4 w-4 ${timerColor}`} />
                <span className={`text-sm font-mono font-semibold ${timerColor}`}>
                  {secondsLeft}s
                </span>
                <span className="text-xs text-gray-400">— refreshes automatically</span>
              </div>

              {/* Manual refresh */}
              <button
                onClick={fetchToken}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#0D3B66] transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh now
              </button>
            </>
          )}
        </div>

        {/* Footer instruction */}
        <div className="px-5 pb-5">
          <p className="text-xs text-center text-gray-400 leading-relaxed">
            Show this QR code to your supervisor's kiosk to record your clock‑in or clock‑out.
          </p>
        </div>
      </div>
    </div>
  );
}
