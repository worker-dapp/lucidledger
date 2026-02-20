# Oracle Hardware & Verification Strategy

## Summary

This note covers two related topics: (1) the IoT and hardware landscape for work verification oracles, including cost considerations for developing country deployments, and (2) the quantitative oracle and per-unit payment model needed for piece-rate and volume-based work.

These are future capabilities (v0.3+) that build on the modular oracle interface established in v0.2.

---

## Part 1: IoT & Hardware for Oracle Verification

### Design Principle: Phone as Primary Device

In developing country contexts, the worker's smartphone is the most cost-effective verification device. Smartphone penetration in sub-Saharan Africa is ~50% and rising. The platform should minimize additional hardware requirements and leverage the phone wherever possible — NFC reader, camera, GPS, Bluetooth radio are all built in.

Additional hardware should be **per-site, not per-worker** whenever possible. One $10 beacon at a gate is far cheaper than buying 50 workers $20 wristbands.

### Per-Site Devices (shared infrastructure, most cost-effective)

| Device | Cost | Power | Use Case |
|---|---|---|---|
| NFC tag (sticker) | $0.10-0.50 | None (passive) | Mount at gate, workers tap phones to clock in/out |
| BLE beacon | $3-10 | Battery, 1-2yr life | Mount at worksite, workers' phones detect proximity |
| NFC/RFID card reader terminal | $30-80 | Mains or solar | Fixed kiosk at gate, workers tap cards |
| IoT platform scale | $50-200 | Mains | Weigh station for piece-rate agricultural/volume work |
| Environmental sensor (temp/humidity) | $5-15 | Battery or solar | Cold chain monitoring, outcome verification |
| Raspberry Pi / ESP32 gateway | $5-15 | Mains, solar, or battery | Bridge between IoT sensors and backend API |

### Per-Worker Devices (higher cost, use only when phones aren't viable)

| Device | Cost per worker | Power | Use Case |
|---|---|---|---|
| Passive NFC/RFID card | $0.50-2 | None | Tap at reader terminal for attendance |
| Bluetooth wristband | $15-40 | Charge daily/weekly | Proximity detection to site beacons |
| Smart watch | $20-100+ | Charge daily | GPS tracking, heart rate (safety), NFC |

### NFC: Tag at Gate vs. Cards Per Worker

Two approaches to NFC-based attendance, each suited to different workforces:

**Option A — NFC tag at the gate, workers scan with phones:**
- One $0.50 tag at the entrance
- Workers use their own phones running the Lucid Ledger app (or a lightweight PWA)
- Phone reads the tag and sends verification to the backend
- **Best when:** workforce has smartphones, tech-savvy, gig/urban workers, multiple sites (one tag per site is cheap)

**Option B — NFC cards per worker, reader at the gate:**
- One reader terminal at the entrance ($30-80)
- Each worker gets a passive NFC card ($0.50-2)
- Worker taps card, reader identifies them and sends verification
- **Best when:** workforce doesn't reliably have smartphones, high turnover (issue/revoke cards easily), phone batteries unreliable, employer wants tight access control (card + reader can integrate with turnstiles/door locks)

**Decision guide:**

| Scenario | Better option |
|---|---|
| Urban gig workers, office contractors (everyone has a phone) | Tag at gate + phones |
| Agricultural day laborers, construction crews (mixed phone access) | Cards + reader |
| High turnover, workers change frequently | Cards — easier to issue/revoke than app onboarding |
| Remote sites, phone batteries unreliable | Cards — passive, no battery, always work |
| Workers move between multiple sites | Phone-based — one tag per site is cheaper than readers everywhere |
| Employer needs physical access control (gates, turnstiles) | Card + reader — can integrate with door locks |
| Funder-audited projects requiring strong evidence | Card + reader — employer-controlled hardware, worker can't fake readings |

**Trust angle:** With phone-based scanning, the worker self-reports — *their* phone reads the tag and *their* app sends the data. With card + reader, the *employer's* device records the tap. For high-trust, funder-audited projects, employer-controlled hardware is stronger evidence. Many sites may use both — cards for clock-in/out, phones for other verifications (photos, QR scans).

### Bluetooth Wearables: When and Why

Bluetooth wristbands or tags are per-worker devices that detect proximity to site beacons. They make sense only when phones aren't sufficient:

- **Underground mining**: No GPS, no cell signal — a BLE wristband pinging site beacons is the only presence verification available.
- **Cold storage/freezer work**: Gloved hands can't operate phones. A wristband provides passive presence detection.
- **Continuous monitoring**: When you need proof of *duration* not just clock-in/clock-out. The wristband pings every 30 seconds, proving the worker stayed on-site for the full shift.
- **Safety compliance**: Some wristbands include fall detection or heart rate monitoring, doubling as safety devices.

**Problems in developing country contexts:**
- Cost: $15-40 per worker adds up fast for large workforces.
- Charging: Workers need to charge them daily/weekly. Unreliable power access in rural areas.
- Durability: Heat, dust, water exposure in agricultural and construction settings degrades electronics.
- Fraud: Workers can hand their wristband to someone else. Mitigated by combining with another oracle (e.g., wristband + manual supervisor check).
- Theft/loss: Higher-value devices create a theft target.

**Recommendation:** Default to phone-based or card-based verification. Reserve wearables for specific contexts where no alternative exists (underground, cold storage, continuous monitoring requirements).

### Environmental Sensors (Outcome Verification)

A less obvious IoT oracle: sensors that verify *outcomes* rather than *presence*.

- **Cold chain**: Temperature sensor in a storage facility verifies that conditions stayed within range during a worker's shift. If the worker is responsible for maintaining cold chain, the sensor confirms they did their job.
- **Air quality/ventilation**: In mining or factory settings, environmental conditions can verify that safety protocols were followed.
- **Irrigation/soil moisture**: For agricultural work, sensors can verify that irrigation tasks were completed (soil moisture within target range).

These don't verify the worker directly — they verify the *result* of the work. Cheap ($5-15 per sensor), passive, and the data has value beyond payment (compliance, quality assurance, funder reporting).

### Cost Summary for a Typical Agricultural Deployment

Example: 50-worker tea farm, piece-rate picking + attendance tracking.

**Phone-based (lowest cost):**
- 1x NFC tag at farm gate: $0.50
- 1x IoT scale at weigh station: $150
- 1x ESP32 gateway for scale: $10
- Total hardware: ~$160
- Per-worker cost: $0 (they use their phones)

**Card-based (no phone dependency):**
- 1x NFC reader at gate: $50
- 50x NFC cards: $50
- 1x IoT scale at weigh station: $150
- 1x ESP32 gateway: $10
- Total hardware: ~$260
- Per-worker cost: ~$1 (card only)

**Wearable-based (most expensive, rarely needed):**
- 50x Bluetooth wristbands: $1,000-2,000
- 2x BLE beacons: $10
- 1x IoT scale at weigh station: $150
- Total hardware: ~$1,160-2,160
- Per-worker cost: ~$20-40

---

## Part 2: Quantitative Oracles & Per-Unit Payment

## Problem

The v0.2 oracle interface (`IWorkOracle.isWorkVerified`) returns a boolean — suitable for attendance, clock-in/out, and manual approval, but insufficient for work measured in continuous quantities. A tea picker paid per kilogram, a garment worker paid per piece, or a harvest crew paid per bushel all need the oracle to report a *number*, not a yes/no.

Forcing quantitative work into a binary model means either:
- The employer manually calculates quantities off-chain and approves a lump sum (defeats the purpose of oracles)
- The oracle threshold is hardcoded (inflexible, can't handle partial completion or daily payouts)

## Proposed Interface Extension

```solidity
interface IWorkOracle {
    // Binary verification (v0.2, already implemented)
    function isWorkVerified(address workContract) external view returns (bool);

    // Quantitative verification (v0.3)
    function unitsCompleted(address workContract) external view returns (uint256);

    function oracleType() external pure returns (string memory);
}
```

- Binary oracles (manual, QR, NFC, GPS): return `true/false` from `isWorkVerified`, return `0` from `unitsCompleted`.
- Quantitative oracles (weight, image-count): return a unit count from `unitsCompleted`, derive `isWorkVerified` as `unitsCompleted > 0`.

## Payment Mode

WorkContract gains a payment mode configured at deployment:

- **FIXED** (current model): Full escrow released on binary completion. Attendance, shift work, milestone contracts.
- **PER_UNIT** (new): Escrow released incrementally as units are verified. Contract stores a per-unit rate. Each oracle update triggers proportional payment from escrow.

No separate contract type or factory needed — the factory passes `paymentMode` and `unitRate` as additional constructor parameters.

## Quantitative Oracle Implementations

### WeightOracle (IoT Scale)

An IoT-connected scale at a weigh station posts weight readings to the platform backend, which records them on-chain.

**Flow:**
1. Employer creates job: "Tea picking, $0.50/kg, escrow $500."
2. Contract deploys with `PER_UNIT` mode, WeightOracle attached, rate = $0.50/kg.
3. Worker picks tea, brings harvest to the weigh station.
4. IoT scale transmits weight reading to the backend API.
5. Backend validates the reading (bounds check, duplicate detection, device authentication) and calls `WeightOracle.recordWeight(contractAddress, 45 kg)`.
6. Contract calculates: 45 kg x $0.50 = $22.50 USDC, releases from escrow to worker.
7. Repeat daily/weekly. Employer tops up escrow as it depletes.

**Hardware considerations:**
- IoT scales with WiFi/cellular connectivity exist at commodity prices (e.g., industrial platform scales with RS-232/USB output connected to a Raspberry Pi or ESP32 gateway).
- The gateway device authenticates to the backend API with a device key, not a wallet — the backend handles the on-chain transaction.
- Tamper resistance: device keys are rotatable, weight readings include timestamps and device IDs for audit.

### ImageWeightOracle (Computer Vision Estimation)

Use image analysis to *estimate* weight or quantity from photographs — similar to calorie-estimation apps that analyze food photos. A worker or supervisor photographs the harvest, and a vision model predicts the weight.

**Flow:**
1. Worker photographs harvested produce (e.g., bins of tea leaves, crates of fruit).
2. Image is uploaded to the backend, which runs it through a vision model (could be a fine-tuned model or a third-party API).
3. Model returns estimated weight/count with a confidence score.
4. If confidence exceeds threshold, backend records the estimate on-chain via `ImageWeightOracle.recordEstimate(contractAddress, estimatedKg, confidenceScore)`.
5. Contract releases payment based on the estimate.

**Advantages over IoT scale:**
- No hardware investment — workers use their phone cameras.
- Works in remote locations without weigh station infrastructure.
- Lower barrier to entry for small employers.

**Tradeoffs:**
- Less precise than a physical scale — estimates have error margins.
- Confidence thresholds need tuning per crop/product type.
- Potential for gaming (photographing the same harvest twice, manipulating camera angle).

**Possible hybrid approach:** Use image estimation as the default, with IoT scale verification as a higher-trust option. Or use image estimation for daily tracking and reconcile against periodic physical weigh-ins.

### UnitCountOracle (Manufacturing / Assembly)

For discrete countable items — garments sewn, parts assembled, packages packed.

**Flow:**
1. Worker completes units and scans each item's barcode/QR code, or supervisor counts and enters total.
2. Backend records count on-chain.
3. Contract releases payment per unit.

This is simpler than weight — no estimation needed, just counting. Could integrate with existing inventory/barcode scanning systems.

## Oracle Logic Modes (AND / OR / Threshold)

### Current: AND-only (v0.2)

All attached oracles must return `true` for `checkOracles()` to pass. Simple, correct for combining different verification *types* (e.g., GPS presence AND manual approval).

### Future: OR and Threshold (v0.3+)

OR logic is needed when multiple oracles serve the **same verification purpose** as fallbacks. Example: workers issued NFC cards might forget them but can still scan a QR code with their phones. If both `NFCOracle` and `QRCodeOracle` are attached with AND logic, a forgotten card blocks payment even though the QR scan proves attendance.

**Recommended approach: multi-method single oracle, not OR logic on the contract.**

Rather than adding OR/threshold branching to `checkOracles()` (which adds contract complexity — storage for logic mode, branching per oracle), implement a single `ClockInOracle` that accepts multiple input methods:

```
ClockInOracle.verifyViaQR(contractAddress, qrData)   → marks verified
ClockInOracle.verifyViaNFC(contractAddress, nfcData)  → marks verified
ClockInOracle.isWorkVerified(contractAddress)          → returns true if ANY method succeeded
```

The contract still sees one oracle with AND logic. The OR behavior is internal to the oracle implementation. This keeps the on-chain contract simple and pushes method-level flexibility to the oracle layer where it belongs.

**When true OR/threshold IS needed:** combining fundamentally different oracle types where any one suffices (e.g., "GPS proof OR supervisor manual approval"). This requires a contract-level logic mode — a `LogicMode` enum (`AND`, `OR`, `THRESHOLD`) stored at deployment alongside an optional threshold count. Deferred to v0.3+ once real usage patterns clarify which combinations users actually want.

## Multi-Oracle Combinations

Quantitative oracles can coexist with binary oracles on the same contract. Binary oracles act as *gates*:

- **GPS + WeightOracle**: Worker must be at the farm (GPS passes) AND have verified weight to get paid. Prevents someone weighing produce at a different location.
- **QR clock-in + UnitCountOracle**: Worker must be clocked in during the shift AND have verified unit counts. Ensures presence during production.
- **Manual approval + ImageWeightOracle**: Supervisor spot-checks the image estimates and must approve before payment releases. Human oversight on AI-estimated quantities.

## Escrow & Top-Up Model

Per-unit contracts change the escrow dynamic:
- FIXED contracts: employer deposits full payment upfront, released all-at-once.
- PER_UNIT contracts: employer deposits an initial escrow that depletes as units are verified. When balance drops below a threshold, employer is notified to top up (#43).
- If escrow runs out, work can continue to be verified but payments queue until the employer adds funds. This protects workers from losing credit for completed work.

## Audit Trail Value

Every verified unit creates an immutable on-chain record: X kg verified, Y dollars released, timestamped, linked to device ID or image hash. This provides:
- **For workers**: Proof of exactly what was produced and what was paid. No more disputed quantities or skimmed payments.
- **For employers/funders**: Verifiable due diligence trail showing fair payment per unit of output.
- **For regulators/auditors**: Transparent, tamper-proof production and payment records.

## Dependencies

- Requires v0.2 oracle plumbing (IWorkOracle interface, factory registry) to be in place first.
- Top-up mechanism (#43) is essential for PER_UNIT contracts.
- Streaming wages (#44) pairs naturally — continuous unit verification maps to continuous payment.

## Open Questions

### Quantitative/Payment
- Unit precision: use `uint256` with a decimal multiplier (e.g., weight in grams not kg) to avoid rounding?
- Dispute model for quantity disagreements: what if employer disputes the weight reading? Current binary dispute resolution (disputed → mediator resolves) may need a quantity-aware variant.
- Oracle update frequency: real-time per weigh-in, or batched daily? Gas cost vs. UX tradeoff (though L2 costs are minimal).
- Image model hosting: self-hosted vs. third-party API? Latency, cost, and accuracy tradeoffs.
- Privacy: should individual weight readings be on-chain or only cumulative totals? On-chain granularity vs. worker privacy.

### Hardware/IoT
- Device provisioning: how does an employer set up an IoT scale or NFC reader? Need an admin flow for registering devices and associating them with job sites.
- Offline resilience: if the gateway loses connectivity, should it queue readings locally and batch-submit when back online? Critical for rural deployments.
- Device authentication: device keys, rotating credentials, tamper detection — how much security is appropriate for the hardware cost tier?
- Hybrid deployments: should the platform recommend hardware configurations per use case (e.g., "for a 50-worker farm, you need X"), or let employers figure it out?
- NFC card lifecycle: issuing, revoking, replacing lost cards. Does the backend need a card management system, or is it simple enough to handle via the admin dashboard?
- Solar power for gateways: in off-grid locations, ESP32/Pi gateways need solar panels + batteries. Add ~$20-30 to the gateway cost. Worth documenting as a recommended accessory.
