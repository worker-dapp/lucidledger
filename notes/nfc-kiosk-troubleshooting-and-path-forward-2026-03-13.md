# NFC Kiosk Troubleshooting & Path Forward
_2026-03-13_

## What Was Built

NFC clock-in/out was implemented as a parallel system alongside QR codes:

- **`NFCOracle.sol`** — singleton oracle contract mirroring QRCodeOracle, deployed to Base Sepolia at `0x8477FF14798Bc908aA29574DC3E7f2E3fA7A8734`
- **`nfc_badges` table** — stores badge UIDs scoped per employer, with nullable employee assignment (supports badge reassignment)
- **`nfcOracleController.js`** — badge registration, assignment, suspend, and NFC scan submission endpoints
- **`KioskPage.jsx`** — `NDEFReader` listener started automatically in a `useEffect` on page load, running in parallel with the QR camera loop
- **`KioskManagement.jsx`** — NFC Badges tab with tap-to-read (user-gesture triggered) + dropdown worker assignment

The `NDEFReader` reads the tag's hardware `serialNumber` (e.g. `04:ab:cd:ef:12:34:56`) and sends it to `/api/nfc-scans` as `badge_uid`. The same serialNumber is captured during badge registration in KioskManagement.

---

## Bugs Fixed Along the Way

- `026-nfc-oracle.sql` migration was missing from `server.js` startup list → `nfc_badges` table never created → 500 on badge registration
- `REGISTERED_ORACLE_TYPES` in `AwaitingDeploymentTab.jsx` was `["manual", "qr"]` — missing `"nfc"` → NFC oracle address silently stripped during contract deployment
- `EditTemplateModal.jsx` `ORACLE_OPTIONS` missing NFC → NFC jobs showed no oracle selected in edit view
- `getDeployedContracts(null, "active")` sent `employer_id=null` as literal string → backend returned 403 → worker dropdown in NFC Badges tab was empty

---

## Kiosk NFC Troubleshooting (Samsung Galaxy Tab Active3, Chrome 145)

**Symptoms**: Tapping the NFC tag on the kiosk page produces no response — no error, no confirmation, no debug output.

**What works**: The tap-to-read button in KioskManagement (employer portal) successfully reads the tag's UID using the same `NDEFReader` API. TagInfo (NFC reader app) also reads the tag fine.

**What doesn't work**: The `NDEFReader` listener on the kiosk page never fires a `reading` event when the tag is tapped.

**Things ruled out**:
- Chrome version (145 — current, Web NFC baked in, no flags available)
- NFC disabled (it's on, and works in other apps)
- NFC permission denied in Chrome (confirmed Allowed)
- TagInfo interfering (was closed/uninstalled)
- Samsung Pay intercepting (only one NFC toggle on this device)
- Wrong part of tablet (hardware NFC works via TagInfo)
- Tag type (NTAG blank NDEF-compatible tag confirmed via TagInfo — correct format)

**Most likely root cause**: Samsung One UI on the Tab Active3 may require a **user gesture** to successfully initiate `NDEFReader.scan()` — or more precisely, Samsung's NFC foreground dispatch only routes to Chrome when the scan was initiated by user interaction. The key evidence for this hypothesis: tap-to-read in KioskManagement (button click → user gesture) works, while the kiosk page auto-starts the reader in `useEffect` (no user gesture) and never receives events.

---

## Proposed Path Forward

### Option A — User-gesture triggered NFC scan (simplest fix)
Add a "Tap to scan NFC badge" button on the kiosk page. When tapped, start `NDEFReader.scan()`. After that, the worker taps their badge. The reader is started from a user gesture, matching how KioskManagement works.

**Downside**: Two-step process instead of just tap-to-clock. Less seamless than the current QR flow.

### Option B — Write URL to tag via KioskManagement (best UX, no separate app needed)
Since `NDEFReader` / `NDEFWriter` work in KioskManagement (user gesture), extend the badge registration flow to also **write a URL to the tag** using `NDEFWriter`. The URL encodes the badge UID: `https://yourapp.com/kiosk?nfc=<badge-uid>`.

When a worker taps the tag at the kiosk, Android's built-in NFC intent system opens Chrome with that URL — no Web NFC API needed at all. The kiosk page reads `?nfc=<badge-uid>` from the URL params and auto-submits the clock-in.

**Setup flow** (employer side):
1. Go to NFC Badges tab → Register Badge
2. Tap the physical tag → app reads UID AND writes the kiosk URL to the tag in one step
3. Assign to worker → done

**Worker flow**:
1. Tap tag → Android opens `yourapp.com/kiosk?nfc=<uid>` in Chrome
2. Kiosk page reads the param, uses stored kiosk token, submits clock-in automatically

**Advantages**:
- Works on all Android devices regardless of Web NFC foreground dispatch support
- No separate app (NFC Tools, etc.) needed — writing is done in the employer portal
- Employer experience is identical to current tap-to-read flow
- More reliable long-term

**Considerations**:
- Badge UID in the URL is visible (low risk — it's just an opaque ID, no PII)
- Android will open the kiosk URL in Chrome (may open a new tab if kiosk isn't the current tab)
- Requires kiosk token to already be saved in localStorage on the tablet

### Option A + B (belt and suspenders)
Keep the `useEffect` Web NFC listener for devices where it works, AND add URL param handling for devices where it doesn't. Both paths end up calling the same `submitNfcBadge()` function.

---

## Recommendation

**Option B** is the right long-term approach. It is more reliable across all Android devices, requires no UX compromise for workers, and the setup step (writing the URL to the tag) is handled automatically by the employer portal — not an external app. The NDEFWriter call can be added alongside the existing tap-to-read in KioskManagement.

Option A could be implemented quickly as an interim fix if needed, and would also confirm the user-gesture hypothesis.
