# NFC Foreground Scan Investigation
_2026-03-14_

## Device
Samsung Galaxy Tab Active3, Android, Chrome 145 (latest)

## Goal
Worker taps NFC badge at kiosk tablet → clock-in/out recorded without closing the browser.

## What Works
- **Cold start (URL dispatch)**: Chrome is fully closed → worker taps badge → Android OS reads NDEF URL record from tag → opens Chrome at `/kiosk?nfc=<uid>` → KioskPage reads `?nfc=` param → submits scan → clock-in/out recorded. ✅
- **Badge registration**: Tap-to-read in KioskManagement reads UID and writes NDEF URL to tag. ✅
- **QR scanning**: Camera-based QR clock-in/out works in foreground. ✅

## What Doesn't Work
- **Foreground NFC (NDEFReader)**: Chrome is open on kiosk page → worker taps badge → nothing happens. ✅ NDEFReader reports as active (green `● NFC` indicator visible) but the `reading` event never fires, or fires silently with no visible effect.

---

## Architecture

### Cold Start Path (working)
1. NDEF URL written to tag during badge registration: `https://lucidledger.co/kiosk?nfc=<uid>`
2. Android OS intercepts NFC tap, reads URL, opens Chrome
3. KioskPage `useEffect` on `searchParams` detects `?nfc=<uid>` param
4. Calls `submitNfcBadge(uid, kioskToken)`
5. POST `/api/nfc-scans` → records clock-in/out

### Foreground Path (not working)
1. `NDEFReader.scan()` called on KioskPage mount (auto-start, no gesture required on this device)
2. `scan()` resolves without error → `nfcState = "active"` → green `● NFC` shown
3. Worker taps badge
4. Expected: `reading` event fires with `{ serialNumber, message }`
5. Actual: nothing fires, no debug output appears on screen

---

## Timeline of Attempts

### Attempt 1: Passive NDEFReader with user gesture trigger
**Approach**: Add `NDEFReader` listener that starts on first `click` or `touchstart` event.
**Problem**: On a kiosk, nobody taps the screen — workers just tap the badge. The gesture trigger never fires, so `NDEFReader.scan()` is never called.
**Result**: No NFC foreground scanning at all.

### Attempt 2: Auto-start NDEFReader on mount
**Approach**: Call `NDEFReader.scan()` immediately on component mount without waiting for a gesture. Fall back to a tap-to-activate prompt if `SecurityError` is thrown.
**Result**: `scan()` succeeds (no `SecurityError`, no gesture required on this device). Green `● NFC` indicator appears. But tapping the badge still does nothing — `reading` event does not fire.

### Attempt 3: NDEF URL record parsing fallback
**Hypothesis**: `serialNumber` might come back empty/null from Samsung Chrome, silently dropping the scan due to `if (!serialNumber) return`.
**Approach**: Parse UID from NDEF URL record as fallback: scan all records with regex `/[?&]nfc=([^&\s]+)/` regardless of `record.recordType`.
**Result**: Still no debug output when badge is tapped — `reading` event still not firing at all.

### Attempt 4: Debug panel
**Approach**: Added temporary on-screen debug panel that displays `serialNumber` and decoded NDEF record contents whenever the `reading` event fires.
**Result**: Panel never appears when badge is tapped with kiosk open. Confirms `reading` event is not being delivered to JavaScript at all.

---

## Key Diagnostic Facts

1. **`NDEFReader.scan()` succeeds** — no error thrown, `nfcState = "active"`, green indicator visible. Chrome has successfully registered for NFC foreground dispatch.

2. **`reading` event never fires** — the debug panel only appears when the event fires. Panel never appears during foreground testing. This rules out `serialNumber` being empty or URL parsing failing — the event simply doesn't reach JavaScript.

3. **No system chime on foreground tap** — when Chrome is closed, Android plays a chime/vibration on NFC tap. When the kiosk is open, tapping the badge produces no chime. This is consistent with Chrome intercepting the NFC event (expected for foreground dispatch) but also consistent with Samsung routing it elsewhere silently.

4. **Cold start still works** — confirms the tag is readable and the badge UID is correctly registered. The physical NFC hardware is functional.

5. **No `SecurityError`** — rules out Chrome requiring a user gesture on this device/version.

6. **Chrome version**: 145 on Samsung Galaxy Tab Active3 with One UI.

---

## Current Hypotheses

### Hypothesis A: Samsung One UI NFC foreground dispatch conflict
Samsung One UI has its own NFC handling layer that may intercept NFC events before Chrome's Web NFC implementation, even when `NDEFReader.scan()` is registered. The tag contains a URL record — Samsung may be routing URL-type tags through its own URL dispatch handler rather than forwarding them to Chrome's Web NFC API, regardless of foreground dispatch registration.

Evidence for: Samsung is known to have custom NFC handling; the no-chime behavior is ambiguous (could be Samsung swallowing the event rather than Chrome intercepting it).

Evidence against: `scan()` succeeds without error, which implies Chrome did register for foreground dispatch.

### Hypothesis B: NDEF URL record type blocks Web NFC delivery
Chrome's Web NFC foreground dispatch may handle URL-type NDEF records differently — potentially navigating to the URL rather than firing the `reading` event, even when `NDEFReader` is active. This would explain why the event never reaches JavaScript.

Evidence for: This would be consistent with Chrome's behavior for URL records in other contexts.
Evidence against: The Web NFC spec says all NDEF records should be delivered via `reading` event when `scan()` is active.

### Hypothesis C: Tag format incompatibility
The physical NFC tag format (NFC Forum Type, NDEF version) may not be fully supported by Chrome's Web NFC on this device, causing `scan()` to register but never deliver events for this specific tag type.

Evidence for: TagInfo app shows the tag is readable; some tag types have limited Web NFC support.
Evidence against: The tag was written by Chrome's own `NDEFWriter`, suggesting it should be readable by `NDEFReader`.

---

## Attempt 5: Text record test (in progress)

**Hypothesis being tested**: Chrome routes URL-type NDEF records to its own URL handler
rather than firing the `reading` event (Hypothesis B above).

**Approach**: Added a temporary `[TEST] Write text record to badge` button in
KioskManagement that rewrites the tag with a plain text record (`nfc:<uid>`) instead of
a URL record. KioskPage updated to extract UID from `nfc:<uid>` text records as well.

**Test procedure**:
1. KioskManagement → tap-to-read badge to capture UID
2. Tap `[TEST] Write text record to badge` — hold badge in place until confirmed
3. Open kiosk reader fresh
4. Tap badge with kiosk open
5. Check if green debug panel appears at bottom of screen

**Expected outcomes**:
- Debug panel appears → text records trigger `reading` event → URL record type is the
  problem → fix: write text record alongside URL record, or switch to text-only
- Debug panel does not appear → `reading` event doesn't fire for any record type →
  deeper Samsung issue, NDEFReader foreground dispatch fundamentally broken on this device

**Result**: FAILED — but very informative. Writing the text record failed because Android
showed a "Complete action using Samsung Internet / Chrome" intent chooser when the badge
was tapped. The URL record already on the tag caused Android to intercept the tap for URL
dispatch BEFORE Chrome's NDEFWriter could write. This confirms Hypothesis A: **Android
intercepts URL-type NFC tags at the OS level before Chrome's Web NFC API, even when
Chrome is in the foreground.** NDEFReader never fires because Android handles the tap first.

**Why tap-to-read works**: `NDEFReader.scan()` gives Chrome foreground dispatch priority
during the active scan session — this is the one window where Chrome wins over Android's
URL dispatch. Outside that window, Android intercepts first.

## Attempt 6: Write both URL and text records during tap-to-read (deployed)

**Approach**: During the tap-to-read in KioskManagement — while Chrome still has foreground
dispatch priority — write BOTH records in a single NDEF message:
- Record 1: URL record (`https://lucidledger.co/kiosk?nfc=<uid>`) — cold start URL dispatch
- Record 2: Text record (`nfc:<uid>`) — foreground NDEFReader trigger

KioskPage NDEFReader already handles `nfc:<uid>` text records (added in Attempt 5).

**Rationale**: The text record doesn't trigger Android's URL dispatch system, so the
NDEFReader `reading` event should fire for it. The URL record is preserved for cold start.

**Status**: Deployed, awaiting test results.

---

## Things Not Yet Tried (if text record test fails)

1. **Test with a blank/unformatted tag** (no NDEF records at all).

2. **Check Chrome's `chrome://flags`** for any NFC-related flags.

3. **Test on a different Android device** (non-Samsung) to determine if this is
   Samsung-specific.

4. **Check if `NDEFReader` permissions are explicitly granted** in Chrome site settings
   for the kiosk URL.

5. **Try `navigator.permissions.query({ name: 'nfc' })`** to check permission state
   programmatically.

---

## Code Location
- KioskPage (frontend): `client/src/pages/KioskPage.jsx`
- NFC scan controller (backend): `server/controllers/nfcOracleController.js`
- NFC oracle service (on-chain): `server/services/nfcOracleService.js`
- Badge management: `client/src/EmployerPages/KioskManagement.jsx`

## Related Notes
- `notes/nfc-kiosk-troubleshooting-and-path-forward-2026-03-13.md` — earlier architecture decisions
- `notes/local-tablet-testing-options-2026-03-14.md` — why local HTTPS testing is impractical
