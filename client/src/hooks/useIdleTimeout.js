import { useEffect, useRef, useState, useCallback } from "react";

const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];

/**
 * Tracks user activity and triggers a warning + timeout callback after idle periods.
 *
 * @param {Object} options
 * @param {boolean} options.enabled - Only track when true (e.g. isAuthenticated)
 * @param {number}  options.idleMs  - ms of inactivity before showing warning (default 13 min)
 * @param {number}  options.warnMs  - ms after warning before auto-logout  (default 2 min)
 * @param {Function} options.onTimeout - Called when the full idle+warn period expires
 * @returns {{ showWarning: boolean, stayLoggedIn: () => void }}
 */
export const useIdleTimeout = ({
  enabled = true,
  idleMs = 13 * 60 * 1000,
  warnMs = 2 * 60 * 1000,
  onTimeout,
}) => {
  const [showWarning, setShowWarning] = useState(false);
  const showWarningRef = useRef(false);
  const idleTimerRef = useRef(null);
  const warnTimerRef = useRef(null);

  const clearTimers = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (warnTimerRef.current) clearTimeout(warnTimerRef.current);
  }, []);

  const startWarnTimer = useCallback(() => {
    warnTimerRef.current = setTimeout(() => {
      showWarningRef.current = false;
      setShowWarning(false);
      onTimeout?.();
    }, warnMs);
  }, [warnMs, onTimeout]);

  const startIdleTimer = useCallback(() => {
    clearTimers();
    idleTimerRef.current = setTimeout(() => {
      showWarningRef.current = true;
      setShowWarning(true);
      startWarnTimer();
    }, idleMs);
  }, [idleMs, clearTimers, startWarnTimer]);

  const stayLoggedIn = useCallback(() => {
    showWarningRef.current = false;
    setShowWarning(false);
    clearTimers();
    startIdleTimer();
  }, [clearTimers, startIdleTimer]);

  useEffect(() => {
    if (!enabled) {
      clearTimers();
      showWarningRef.current = false;
      setShowWarning(false);
      return;
    }

    const handleActivity = () => {
      // Once the warning is showing, only the "Stay Logged In" button resets timers
      if (showWarningRef.current) return;
      startIdleTimer();
    };

    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, handleActivity, { passive: true }));
    startIdleTimer();

    return () => {
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, handleActivity));
      clearTimers();
    };
  }, [enabled, startIdleTimer, clearTimers]);

  return { showWarning, stayLoggedIn };
};

export default useIdleTimeout;
