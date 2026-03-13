# NFC Work Verification — Implementation Plan

## How It Differs from QR

The fundamental difference is physical vs. digital token:

- **QR**: Worker's phone generates a 30-second one-time token → kiosk camera reads it
- **NFC**: Worker carries a physical badge/card with a static UID → kiosk NFC reader reads it

This means NFC is **simpler on the worker side** (no phone needed, just tap the badge), but requires more setup upfront (badge registration).

---

## Can You Combine NFC and QR Kiosks?

**Yes, the same Android tablet can handle both.** The kiosk already uses the device token auth system — the same registered kiosk supports both modes simultaneously. The UI runs both listeners at once:

- Camera loop running in background (QR)
- Web NFC listener running in parallel (NFC)
- Whichever fires first triggers the clock event

Android tablets natively support both a camera and NFC hardware, so no additional peripherals are needed.

---

## Technology Choice for the Kiosk

**Web NFC API on Android Chrome** — no drivers, no USB readers, no additional hardware.

```javascript
const reader = new NDEFReader();
await reader.scan();
reader.onreading = e => { const uid = e.serialNumber; };
```

- Available on Android Chrome 89+ (standard on any modern Android tablet)
- Permission prompt shown once on first use — same pattern as camera permission for QR
- The tablet's built-in NFC chip reads the badge; no external reader needed
- iOS is not a concern since Android tablets are the chosen kiosk hardware

---

## Smart Contract

A dedicated **NFCOracle** smart contract will be deployed separately from the existing `QRCodeOracle`. This keeps the two verification methods cleanly separated on-chain, making the audit trail unambiguous and allowing independent oracle management (different oracle wallet keys, separate admin controls, independent upgrade paths).

The `NFCOracle` contract mirrors the `QRCodeOracle` interface:

```solidity
function recordScan(address workContract, bool clockIn) external onlyOracle;
function isWorkVerified(address workContract) external view returns (bool);
```

**Deployment**: Via the existing `/admin/deploy-factory` pattern — admin deploys `NFCOracle` and sets `NFC_ORACLE_ADDRESS` in the server environment. The backend service wallet (`NFC_ORACLE_PRIVATE_KEY`, or shared with QR if preferred) submits on-chain calls non-blocking, same as QR.

---

## Badge Data Model

Unlike QR tokens (ephemeral), NFC badges are **static and registered upfront**:

```sql
CREATE TABLE nfc_badges (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  badge_uid     VARCHAR(64) UNIQUE NOT NULL,  -- NFC tag UID (e.g. "04:A3:B2:12:34:56:78")
  employee_id   BIGINT NOT NULL REFERENCES employee(id),
  employer_id   BIGINT NOT NULL REFERENCES employer(id),
  label         VARCHAR(255),                 -- optional ("Badge #47", worker name)
  status        VARCHAR(20) DEFAULT 'active', -- 'active' | 'suspended' | 'lost'
  registered_at TIMESTAMPTZ DEFAULT NOW()
);
```

This is the only significant new DB table. Everything else (`presence_events`, `oracle_verifications`, `kiosk_devices`) is **already shared** with the QR flow. The `oracle_type='nfc'` value is already in the DB CHECK constraint.

---

## End-to-End Flow

### Setup (one-time, per employer)

1. Employer bulk-purchases cheap NFC NTAG213 stickers/cards (~$0.30–0.50 each)
2. In KioskManagement, employer opens the "NFC Badges" tab
3. Taps a blank badge on the Android tablet to auto-read its UID (or enters UID manually)
4. Assigns UID to a worker (search by name/email) and saves
5. Worker can now clock in at any NFC-enabled kiosk for that employer

### Clock-In (daily)

1. Worker taps NFC badge on the Android tablet kiosk
2. Kiosk reads badge UID via Web NFC API
3. Kiosk POSTs to `POST /api/nfc-scans`:
   ```json
   { "badge_uid": "04:A3:B2:...", "client_timestamp": "...", "nonce": "uuid", "latitude": ..., "longitude": ... }
   ```
   Plus `x-kiosk-token` header (same kiosk auth as QR)
4. Backend looks up `nfc_badges` by `badge_uid` → gets `employee_id` → runs the same atomic presence event transaction as QR
5. Backend calls `NFCOracle.recordScan(contractAddress, clockIn)` non-blocking (same pattern as QR)
6. Kiosk shows worker name + "Clocked In ✓" for 3 seconds

---

## What Needs to Be Built

### Backend

| Task | Details |
|------|---------|
| DB migration | `nfc_badges` table (see schema above) |
| `nfcOracleController.js` | `registerBadge`, `listBadges`, `suspendBadge`, `submitNfcScan` |
| `submitNfcScan` handler | Near-identical to `submitPresenceEvent` in `qrOracleController.js` — replace token lookup with badge UID lookup, same atomic transaction |
| `nfcOracleService.js` | Calls `NFCOracle.recordScan()` non-blocking, mirrors `qrOracleService.js` |
| Routes | `nfc-badges` (employer CRUD) and `nfc-scans` (kiosk POST) |
| Env var | `NFC_ORACLE_ADDRESS` for the deployed NFCOracle contract |

### Smart Contract

| Task | Details |
|------|---------|
| `NFCOracle.sol` | New contract mirroring `QRCodeOracle` interface — `recordScan(address, bool)`, `isWorkVerified(address)` |
| Deployment | Via admin panel (`/admin/deploy-factory` pattern) — deploy once to Base Sepolia, set `NFC_ORACLE_ADDRESS` |

### Frontend

| Task | Details |
|------|---------|
| `KioskPage.jsx` | Add Web NFC listener alongside existing camera loop — one `useEffect` starts both; whichever fires calls `handleScan(uid, source)` |
| `KioskManagement.jsx` | Add "NFC Badges" tab — list badges, register new badge (tap-to-read on Android or manual UID entry), suspend/reassign |
| `Oracles.jsx` | Add `"nfc"` to `AVAILABLE_ORACLES` array — already in the UI list, currently disabled |
| Worker side | No `QrClockModal` equivalent needed — the badge is physical, nothing to display on the worker's phone |

---

## Key Considerations

### Badge Security
Static UIDs can technically be cloned with a cheap phone app. For wage verification this is acceptable risk (equivalent to a swipe card at any job site). Dynamic NFC tokens via phone HCE (Host Card Emulation) would eliminate this but reintroduce the app dependency.

### Lost / Stolen Badges
The `status='lost'` field and suspend endpoint handle this. Employer suspends the badge immediately and issues a new one. Past clock events are unaffected.

### Multi-Employer
Badge UIDs are scoped to `employer_id`. The same physical badge can be registered to two different employers without conflict — a worker at two jobs uses the same badge for both.

### Badge Registration UX
The smoothest flow is tap-to-register on the Android tablet: employer opens KioskManagement, taps a blank badge, UID auto-fills, then they assign it to a worker. For bulk registration (50+ workers), a CSV import of UIDs would be a worthwhile follow-on feature.

### Android NFC Permission
Web NFC requires the user to grant NFC permission in Chrome (one-time prompt, same as camera). The kiosk setup flow should guide the employer through granting both camera and NFC permissions when first activating a device.

---

## Effort Estimate

| Component | Estimate |
|-----------|----------|
| `NFCOracle.sol` smart contract | ~half day |
| DB migration + backend controller/routes/service | ~1 day |
| `KioskPage.jsx` NFC listener | ~2–3 hours |
| `KioskManagement.jsx` badge registration UI | ~1 day |
| Enable NFC in `Oracles.jsx` + admin deploy flow | ~2–3 hours |
| End-to-end testing with real NFC hardware | ~half day |
| **Total** | **~3.5 days** |

The QR codebase is a clean template throughout — the NFC backend is essentially a fork of `qrOracleController.js` with the one-time token lookup replaced by a badge UID lookup, and `NFCOracle.sol` mirrors `QRCodeOracle.sol`.

---

## Reference Files

| File | Relevance |
|------|-----------|
| `server/controllers/qrOracleController.js` | Primary template for NFC controller |
| `server/services/qrOracleService.js` | Template for `nfcOracleService.js` |
| `server/models/QrToken.js` | Token model pattern (NFC uses badge UID instead) |
| `server/models/PresenceEvent.js` | Shared event log — no changes needed |
| `server/models/KioskDevice.js` | Shared kiosk auth — no changes needed |
| `server/migrations/025-qr-oracle.sql` | Schema reference — `oracle_type` CHECK already includes `'nfc'` |
| `client/src/pages/KioskPage.jsx` | Add Web NFC listener here |
| `client/src/EmployerPages/KioskManagement.jsx` | Add NFC Badges tab here |
| `client/src/Form/Oracles.jsx` | Add `"nfc"` to `AVAILABLE_ORACLES` |
| `contracts/QRCodeOracle.sol` | Template for `NFCOracle.sol` |
