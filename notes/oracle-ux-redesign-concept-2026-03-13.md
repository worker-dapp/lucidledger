# Oracle UX Redesign — Concept Note
*2026-03-13*

## The Problem

The current oracle selection UI in the job creation wizard (`client/src/Form/Oracles.jsx`) is inside-out. It asks the employer to select a **tool** (QR oracle, NFC oracle, GPS oracle) rather than defining a **verification goal** (attendance, output, location). This is developer thinking, not employer thinking.

## The Insight

Employers don't start with "I want a QR oracle." They start with "I need to prove my workers showed up." The oracle is an implementation detail — the employer should only need to think about *what* they want to verify, then select *how* from a set of available tools within that category.

## Proposed Structure

**Verification categories (employer-facing):**
- **Attendance** — Was the worker present? (tools: QR, NFC, Bluetooth, Biometric)
- **Output** — How much did they produce? (tools: Scale, CV Weight, CV Volume, Unit Scan / Piece Rate)
- **Location** — Were they at the right site? (tools: GPS/Geofence)
- **Quality** — Was the work done correctly? (tools: Image/CV, Supervisor sign-off)
- **Manual** — Human supervisor verification (standalone)

## Oracle Inventory (current + planned)

| Oracle | Category | Status |
|--------|----------|--------|
| Manual | — | Live |
| QR Clock-In | Attendance | Live |
| NFC Badge | Attendance | Live (v0.0.2) |
| Bluetooth Beacon | Attendance | Planned |
| GPS / Geofence | Location | Planned |
| Scale / Weight | Output | Planned |
| CV Weight | Output | Planned |
| CV Volume | Output | Planned |
| Unit Scan (piece rate + provenance) | Output | Planned |

Biometric (fingerprint) held pending client request due to privacy/regulatory complexity.

## The Provenance Angle

The Unit Scan oracle is potentially the most strategically interesting. When a worker scans a product/batch tag as part of piece-rate work, the on-chain record becomes both a wage verification event and a supply chain provenance data point. Existing platforms (TextileGenesis, Retraced, GS1) can tell you *where* something was made but cannot cryptographically prove the workers were paid fairly. That is Lucid Ledger's wedge into the provenance market.

The provenance record intentionally does NOT expose individual worker identity — it attests that a verified worker under contract was paid per unit, without naming them. This is a stronger privacy posture and a stronger compliance credential for brands.

## What to Build in v0.0.3

1. Redesign the oracle selection step in `JobCreationWizard` around verification *categories* rather than oracle *tools*
2. Within each category, show available tools (including coming-soon options)
3. Wire up the Unit Scan / provenance oracle concept as a proper spec
4. Consider integration points with GS1 / TextileGenesis / Retraced

## Reference Files

- `client/src/Form/Oracles.jsx` — current oracle selection UI
- `client/src/EmployerPages/ContractFactory/JobCreationWizard.jsx` — wizard container
- `server/models/OracleVerification.js` — oracle_type CHECK constraint (extend for new types)
- `server/migrations/025-qr-oracle.sql` — existing oracle_type values
