# QR Oracle Implementation Plan — Issue #54
**Branch:** `feature/qr-oracle`
**Milestone:** v0.2.0 — Demo Ready
**Last Updated:** 2026-03-10

---

## Overview

Enable worker clock-in/out using QR codes. Worker displays a short-lived dynamic QR on their phone (Job Tracker). Employer kiosk (Android Chrome) scans it, submits a presence event to the backend. Backend validates, records the event, and fires the oracle verification against the contract.

No Capacitor or React Native required. Web-native throughout.

---

## Architecture

```
Worker phone (browser)          Employer kiosk (Android Chrome)
──────────────────────          ──────────────────────────────
Job Tracker → "Clock In"        /kiosk page (camera open)
  POST /api/qr-tokens    ──▶    (QR displayed on worker screen)
  ← { token, expiresAt }        scan via jsQR + getUserMedia()
  Render QR (qrcode lib)   ──▶  POST /api/presence-events
  30s countdown timer           ← { worker name, initials, contract }
                                Display confirmation screen
                                  (initials avatar, name, green banner)
```

**Key design decisions:**
- Opaque random token (not JWT) for MVP — simpler, server-side validation
- Token TTL: 30 seconds, single-use (consumed on first scan)
- QR token table is separate from `oracle_verifications` — tokens are ephemeral credentials, verifications are permanent audit records
- GPS captured at kiosk scan time — audit evidence only in v0.2.0, no geofence validation
- Clock-in/out determined by last event type — alternating: first tap = clock-in, next = clock-out
- Kiosk requires registered device token (set at kiosk setup, stored in localStorage)
- No worker photo in v0.2.0 — initials avatar on confirmation screen (#94 deferred to v0.3.0)

---

## Prerequisites

```bash
cd client && npm install qrcode react-qrcode-logo    # QR rendering
cd client && npm install jsqr                         # QR scanning (camera)
```

Or lighter alternative: `qrcode` (server-side generation, return SVG/PNG to client) — avoids adding two client deps. Decision: use `qrcode` npm package server-side, return data URL. No client QR lib needed.

For scanning: `jsqr` is the lightest browser-native option. No wrapper needed.

---

## Phase 1: Database Migration (025)

**File:** `server/migrations/025-qr-oracle.sql`

```sql
-- Migration 025: QR oracle — tokens, presence events, kiosk devices

-- Short-lived QR tokens (ephemeral — consumed on scan)
CREATE TABLE IF NOT EXISTS qr_tokens (
  id                   BIGSERIAL PRIMARY KEY,
  token                VARCHAR(64) UNIQUE NOT NULL,
  deployed_contract_id BIGINT NOT NULL REFERENCES deployed_contracts(id) ON DELETE CASCADE,
  employee_id          BIGINT NOT NULL REFERENCES employee(id) ON DELETE CASCADE,
  expires_at           TIMESTAMPTZ NOT NULL,
  used_at              TIMESTAMPTZ NULL,        -- NULL = unused, set on first scan
  created_at           TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_qr_tokens_token ON qr_tokens(token);
CREATE INDEX IF NOT EXISTS idx_qr_tokens_contract ON qr_tokens(deployed_contract_id);

-- Presence events (permanent audit record)
CREATE TABLE IF NOT EXISTS presence_events (
  id                   BIGSERIAL PRIMARY KEY,
  deployed_contract_id BIGINT NOT NULL REFERENCES deployed_contracts(id) ON DELETE CASCADE,
  employee_id          BIGINT NOT NULL REFERENCES employee(id) ON DELETE CASCADE,
  kiosk_device_id      VARCHAR(64) NOT NULL,
  event_type           VARCHAR(20) NOT NULL CHECK (event_type IN ('clock_in', 'clock_out')),
  client_timestamp     TIMESTAMPTZ NOT NULL,    -- timestamp reported by kiosk
  server_timestamp     TIMESTAMPTZ DEFAULT NOW(), -- authoritative
  latitude             DECIMAL(10,8) NULL,
  longitude            DECIMAL(11,8) NULL,
  gps_accuracy_meters  DECIMAL(8,2) NULL,
  nonce                VARCHAR(64) NULL,         -- replay protection
  oracle_verification_id BIGINT NULL REFERENCES oracle_verifications(id),
  created_at           TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_presence_events_contract ON presence_events(deployed_contract_id);
CREATE INDEX IF NOT EXISTS idx_presence_events_employee ON presence_events(employee_id, server_timestamp DESC);

-- Registered kiosk devices (prevents rogue devices submitting events)
CREATE TABLE IF NOT EXISTS kiosk_devices (
  id          BIGSERIAL PRIMARY KEY,
  device_id   VARCHAR(64) UNIQUE NOT NULL,   -- UUID generated at kiosk setup
  device_token VARCHAR(64) UNIQUE NOT NULL,  -- bearer token for API auth
  employer_id BIGINT NOT NULL REFERENCES employer(id) ON DELETE CASCADE,
  site_name   VARCHAR(255),
  status      VARCHAR(20) DEFAULT 'active',  -- active | suspended
  registered_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_kiosk_devices_token ON kiosk_devices(device_token);
```

Register in `server/server.js` migrations array (after 024).

---

## Phase 2: Backend

### 2a. Models

**`server/models/QrToken.js`**
- Sequelize model for `qr_tokens`
- Associations: `belongsTo(DeployedContract)`, `belongsTo(Employee)`

**`server/models/PresenceEvent.js`**
- Sequelize model for `presence_events`
- Associations: `belongsTo(DeployedContract)`, `belongsTo(Employee)`, `belongsTo(OracleVerification)`

**`server/models/KioskDevice.js`**
- Sequelize model for `kiosk_devices`
- Associations: `belongsTo(Employer)`

Add associations in existing models:
- `DeployedContract.hasMany(PresenceEvent)`, `DeployedContract.hasMany(QrToken)`
- `Employee.hasMany(PresenceEvent)`

### 2b. Controller

**`server/controllers/qrOracleController.js`**

```javascript
// POST /api/qr-tokens
// Worker requests a token for a specific contract
// - Verifies worker owns the contract (employee_id match)
// - Verifies contract status is 'in_progress'
// - Generates crypto.randomBytes(32).toString('hex') token
// - Stores in qr_tokens with 30s expiry
// - Returns: { token, qrDataUrl, expiresAt }
//   (qrDataUrl is a base64 PNG generated server-side with `qrcode` npm package)
static async generateToken(req, res)

// POST /api/presence-events
// Kiosk submits a scan event
// Auth: kiosk device token (x-kiosk-token header) — NOT Privy JWT
// - Validates kiosk device token against kiosk_devices table
// - Looks up qr_tokens by token value
// - Checks: not expired, not already used
// - Atomically marks token as used (used_at = NOW())
// - Determines event_type: check last presence_event for this contract
//   (if last was clock_in → this is clock_out, else clock_in)
// - Creates presence_events record
// - Creates oracle_verifications record (oracle_type = 'qr', status = 'verified')
// - Calls logAction() for audit log
// - Returns: { success, eventType, worker: { firstName, lastName, initials }, contractTitle, serverTimestamp }
static async submitPresenceEvent(req, res)

// GET /api/presence-events?contract_id=X
// Employer/worker fetches presence event history for a contract
// Auth: Privy JWT (verifyToken)
// Returns array of presence events with timestamps and GPS
static async getPresenceEvents(req, res)

// POST /api/kiosk-devices/register
// Employer registers a new kiosk device
// Auth: Privy JWT (verifyToken) — must be approved employer
// Generates device_token, returns it once (not stored in retrievable form — hash it)
// Actually for MVP: store plaintext token (add hashing later)
static async registerKiosk(req, res)

// GET /api/kiosk-devices
// List employer's registered kiosks
static async getKiosks(req, res)
```

### 2c. Routes

**`server/routes/qrOracleRoutes.js`**

```javascript
POST   /api/qr-tokens                  → generateToken          (verifyToken — worker)
POST   /api/presence-events            → submitPresenceEvent    (kioskAuth middleware)
GET    /api/presence-events            → getPresenceEvents      (verifyToken)
POST   /api/kiosk-devices/register     → registerKiosk          (verifyToken + requireApprovedEmployer)
GET    /api/kiosk-devices              → getKiosks              (verifyToken)
```

**`kioskAuth` middleware** (new, in `authMiddleware.js`):
- Reads `x-kiosk-token` header
- Looks up in `kiosk_devices` where `device_token = ? AND status = 'active'`
- Attaches `req.kioskDevice` to request
- 401 if missing/invalid

Register in `server.js`:
```javascript
app.use('/api/qr-tokens', qrOracleRoutes);
app.use('/api/presence-events', qrOracleRoutes);
app.use('/api/kiosk-devices', qrOracleRoutes);
```

### 2d. npm dependency

```bash
cd server && npm install qrcode
```

---

## Phase 3: API Service (client)

Add to `client/src/services/api.js`:

```javascript
// Worker: generate QR token for a contract
async generateQrToken(contractId)           // POST /qr-tokens

// Worker: get presence event history
async getPresenceEvents(contractId)         // GET /presence-events?contract_id=X

// Employer: register a kiosk device
async registerKioskDevice(siteData)         // POST /kiosk-devices/register

// Employer: list kiosk devices
async getKioskDevices()                     // GET /kiosk-devices
```

Note: `submitPresenceEvent` is called directly from the kiosk with a raw fetch (not via apiService) because it uses `x-kiosk-token` auth instead of Privy JWT.

---

## Phase 4: Worker UI — "Clock In" QR Modal (Job Tracker)

**File:** `client/src/EmployeePages/JobTracker.jsx`

Add to the active contract detail panel (right side, below contract info):

**"Clock In / Clock Out" button** — shown only when:
- Contract status is `in_progress`
- `selected_oracles` includes `qr`

On click: opens `QrClockModal` component.

**`client/src/EmployeePages/QrClockModal.jsx`** (new component):
- On mount: calls `apiService.generateQrToken(contractId)`
- Displays QR code as `<img src={qrDataUrl} />` (data URL from server)
- Shows 30-second countdown timer (setInterval, updates every second)
- When timer hits 0: auto-refreshes (calls generateQrToken again)
- Shows instruction text: "Show this to your supervisor's kiosk to clock in"
- On success callback from parent: shows green "Clocked in at HH:MM" confirmation
- Close button

**State flow:**
```
idle → loading (generating token) → showing QR (countdown running)
  → [kiosk scans] → modal can be closed (or auto-refreshes for clock-out)
```

Timer note: the modal doesn't know when the kiosk scans. Worker just closes it after. The oracle verification will appear in their contract detail when they reload. Keep it simple.

---

## Phase 5: Kiosk UI

**File:** `client/src/pages/KioskPage.jsx` (new)
**Route:** `/kiosk` — public route (no Privy auth — uses kiosk device token instead)

### Setup Flow (first visit)

If no `kioskDeviceToken` in localStorage:
- Show setup screen: "Enter your kiosk device token"
- Input field + Submit
- On submit: store token in localStorage, transition to scan mode
- (Token is obtained from the employer's Workforce Dashboard — see Phase 6)

### Scan Mode (main UI)

Full-screen layout optimised for a fixed tablet:
- Large camera viewfinder (getUserMedia, rear camera preferred)
- Status text: "Ready to scan — hold worker's QR code up to camera"
- Uses `jsQR` to decode frames from a `<canvas>` element (requestAnimationFrame loop)

On successful decode:
1. Extract token string from QR
2. POST to `/api/presence-events` with:
   ```json
   {
     "token": "...",
     "kioskDeviceId": "<from localStorage>",
     "clientTimestamp": "<ISO string>",
     "nonce": "<crypto.randomUUID()>",
     "latitude": null,
     "longitude": null,
     "gpsAccuracy": null
   }
   ```
   (GPS: call `navigator.geolocation.getCurrentPosition()` before POST if available — don't block on it)
3. Show confirmation screen (2–3 seconds, then return to scan mode):
   - **Success:** large initials avatar (coloured circle), worker full name, event type ("Clocked In" / "Clocked Out"), timestamp, GPS coords if available. Green banner.
   - **Error (expired/used token):** red banner, "Token expired — ask worker to refresh their QR"
   - **Error (contract not active):** red banner, message from server

### Nav

Add `/kiosk` to App.jsx as a public route (outside ProtectedRoute, outside layout components — full-screen standalone).

Add "Kiosk" link to EmployerNavbar (opens in new tab).

---

## Phase 6: Employer — Kiosk Management UI

**Location:** New tab or section in Workforce Dashboard, or a simple card in Compliance Hub.

For MVP: a simple "Kiosk Devices" section in Workforce Dashboard:
- List registered kiosks (site name, device ID, status, registered date)
- "Register New Kiosk" button → modal:
  - Input: site name
  - On submit: calls `registerKioskDevice()`, displays the returned token **once** with copy button
  - Warning: "Save this token now — it will not be shown again"
- Deactivate button per kiosk

---

## Phase 7: Oracle Verification Integration

When a presence event is created, the backend also creates an `oracle_verifications` record:
```javascript
{
  deployed_contract_id: ...,
  oracle_type: 'qr',           // CHECK constraint — need to add 'qr' and 'nfc' to allowed values
  verification_status: 'verified',
  verified_at: now(),
  clock_in_time: (if clock_in),
  clock_out_time: (if clock_out),
  notes: `QR clock-in via kiosk ${kioskDevice.site_name} @ ${lat},${lng}`
}
```

**Important:** The `oracle_type` CHECK constraint in migration 008 only allows `'gps', 'image', 'weight', 'time_clock', 'manual'`. Need to add `'qr'` and `'nfc'` in migration 025.

```sql
-- In migration 025, also:
ALTER TABLE oracle_verifications
  DROP CONSTRAINT IF EXISTS oracle_verifications_oracle_type_check;
ALTER TABLE oracle_verifications
  ADD CONSTRAINT oracle_verifications_oracle_type_check
  CHECK (oracle_type IN ('gps', 'image', 'weight', 'time_clock', 'manual', 'qr', 'nfc'));
```

Employer's Workforce Dashboard "Latest Oracle Checks" section already reads from `oracle_verifications` — QR events will appear there automatically.

---

## Phase 8: Audit Log

Call `logAction()` in `submitPresenceEvent`:
- `actionType`: `'qr_clock_in'` or `'qr_clock_out'`
- `actorType`: `'employee'`
- `actorId`: employee.id
- `entityType`: `'deployed_contract'`
- `entityId`: deployed_contract_id
- `employerId`: contract.employer_id
- `newValue`: `{ eventType, timestamp, kiosk: site_name, gps: { lat, lng } }`

---

## File Checklist

### New files
- [ ] `server/migrations/025-qr-oracle.sql`
- [ ] `server/models/QrToken.js`
- [ ] `server/models/PresenceEvent.js`
- [ ] `server/models/KioskDevice.js`
- [ ] `server/controllers/qrOracleController.js`
- [ ] `server/routes/qrOracleRoutes.js`
- [ ] `client/src/pages/KioskPage.jsx`
- [ ] `client/src/EmployeePages/QrClockModal.jsx`

### Modified files
- [ ] `server/server.js` — register migrations + routes
- [ ] `server/middleware/authMiddleware.js` — add `kioskAuth` middleware
- [ ] `server/models/index.js` or associations — add new model associations
- [ ] `server/package.json` — add `qrcode` dep
- [ ] `client/src/App.jsx` — add `/kiosk` public route
- [ ] `client/src/EmployeePages/JobTracker.jsx` — add Clock In button + QrClockModal
- [ ] `client/src/components/EmployerNavbar.jsx` — add Kiosk link
- [ ] `client/src/EmployerPages/WorkforceDashboard.jsx` — add kiosk management section
- [ ] `client/src/services/api.js` — add QR oracle methods
- [ ] `client/package.json` — add `jsqr` dep

---

## Security Checklist

- [ ] Token is single-use — `used_at` set atomically on first `POST /presence-events`
- [ ] Token TTL enforced server-side (`expires_at < NOW()` check)
- [ ] Kiosk auth uses separate `x-kiosk-token` header (not Privy JWT)
- [ ] `POST /presence-events` does NOT require worker auth — only kiosk token
- [ ] Nonce deduplication — reject duplicate nonces within a time window
- [ ] Contract must be `in_progress` at both token generation and scan time
- [ ] Worker must be the employee on the contract (enforced at token generation)

---

## Testing Checklist

- [ ] Worker generates QR on Job Tracker → QR renders, countdown ticks
- [ ] Countdown hits 0 → auto-refresh generates new token
- [ ] Kiosk scans QR → confirmation screen shows name, clock-in time, GPS
- [ ] Second scan of same token → rejected ("token already used")
- [ ] Scan after 30s → rejected ("token expired")
- [ ] Clock-in followed by clock-out → event_type alternates correctly
- [ ] Oracle verification record created → visible in Workforce Dashboard "Latest Oracle Checks"
- [ ] Audit log entry created for each event
- [ ] Kiosk with invalid device token → 401
- [ ] Contract not in_progress → token generation rejected with clear error

---

## Out of Scope for v0.2.0

- Geofence validation (v0.3.0 — #99)
- Worker photo on confirmation screen (v0.3.0 — #94)
- Offline queue with IndexedDB sync (v0.3.0)
- On-chain batch anchoring of presence events (v0.3.0)
- Biometric gate before QR generation (future)
- iOS kiosk support (v0.4.0 — #103 Capacitor)
