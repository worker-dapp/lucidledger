# Fix: Idle Timeout Warning Shows But Never Logs Out

**STATUS: RESOLVED** — Fixed in `fix/bugs-and-quick-wins` branch. Used Option C (ref for callback) + async await. Two root causes: (1) `onTimeout` wasn't awaited so logout didn't complete before unmount, (2) `onTimeout` in useCallback deps caused StrictMode to restart timers via effect re-runs.

## Bug
After 13 minutes of inactivity, the idle timeout warning appears correctly. However, when the 2-minute warning countdown expires, the user is never actually logged out.

## Root Cause

In `client/src/hooks/useIdleTimeout.js` lines 32-35, when the warn timer fires:

```javascript
warnTimerRef.current = setTimeout(() => {
  showWarningRef.current = false;
  setShowWarning(false);   // triggers re-render → component returns null
  onTimeout?.();           // logout may not execute if component unmounts
}, warnMs);
```

`setShowWarning(false)` causes a re-render. In `App.jsx` line 291, the component that owns this hook returns `null` when `showWarning` is false:

```javascript
if (!showWarning) return null;
```

This can cause the component (and its hooks/timers) to unmount before `onTimeout()` (which calls `logout()` + `navigate('/')`) has a chance to complete.

## Key Files
- `client/src/hooks/useIdleTimeout.js` — timer logic (lines 31-36)
- `client/src/App.jsx` — idle timeout usage (lines 281-298)
- `client/src/components/IdleTimeoutWarning.jsx` — warning UI

## Fix Options

### Option A: Call onTimeout before setting state (simplest)
In `useIdleTimeout.js`, swap the order so logout fires before the re-render:

```javascript
warnTimerRef.current = setTimeout(() => {
  onTimeout?.();           // logout first
  showWarningRef.current = false;
  setShowWarning(false);   // then dismiss warning
}, warnMs);
```

### Option B: Don't conditionally return null
In `App.jsx`, always render the component but let `IdleTimeoutWarning` handle its own visibility. This prevents unmounting:

```javascript
return (
  <IdleTimeoutWarning
    show={showWarning}
    onStayLoggedIn={stayLoggedIn}
    onLogOut={handleIdleTimeout}
  />
);
```

### Option C: Use a ref for the callback
Store `onTimeout` in a ref so the timer always has the latest reference and doesn't depend on the component lifecycle:

```javascript
const onTimeoutRef = useRef(onTimeout);
onTimeoutRef.current = onTimeout;

// In timer:
onTimeoutRef.current?.();
```

## Recommendation
Option A is the quickest fix. Option B is more robust long-term.

## Priority
Medium — affects security (users should be logged out after inactivity) but the warning itself works correctly.
