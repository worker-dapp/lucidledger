# Temporal Oracles and Privacy

Last updated: 2026-03-11

## Purpose

This note explains why LucidLedger may eventually want to represent verified work time as a duration, rather than only as basic clock-in and clock-out events, and outlines a privacy-preserving way to do that.

This is not a commitment to implement a new oracle model immediately. It is a design note to clarify the tradeoffs.

---

## What "Temporal" Means Here

In this context, a temporal oracle is an oracle that can attest not just that a worker checked in and checked out, but also a derived quantity of verified time.

Examples:

- 480 verified minutes worked
- 7.5 verified hours on site
- 6.25 verified hours within the worksite geofence
- 4 completed check-in windows out of 5 expected windows

This is different from a pure boolean oracle that only answers:

- "Did a valid attendance event happen?"
- "Has this contract's work been verified?"

---

## Why Duration Can Be Useful

Recording or deriving verified time can be useful for several reasons.

### 1. Better fit for time-based compensation

If payment is ever based on time worked rather than a fixed milestone, the contract or backend needs a quantity that represents payable time.

Clock-in and clock-out events are inputs. Verified duration is the payout-relevant output.

### 2. Better distinction between simple attendance and sustained presence

A worker who checks in once and checks out once is not necessarily equivalent to a worker who was verifiably present throughout the shift.

Duration lets the system distinguish:

- "Two valid scan events occurred"
- "7.2 verified hours were actually established"

### 3. Supports partial-credit and exception handling

A duration model makes it easier to represent:

- late arrival
- early departure
- missed periodic check-ins
- time spent outside a geofence
- paid breaks vs unpaid breaks
- minimum shift thresholds

Instead of reducing all of that to pass/fail, the system can compute payable verified time.

### 4. Better dispute framing

In a dispute, a derived duration can simplify the question.

Instead of reconstructing a shift from many raw events, the dispute can focus on:

- how many verified minutes should count
- what intervals were excluded and why

This is often more practical than treating every event as equally important.

### 5. Better payroll and reporting primitives

Period-based payroll workflows often want:

- verified hours this week
- verified minutes this pay cycle
- attendance compliance percentage

These are naturally expressed as derived time quantities, not just event lists.

---

## Where Duration Is Most Useful

Duration is especially useful for:

- continuous GPS presence
- periodic check-in systems
- maritime or journey-based work
- remote or field work where a single check-in/out pair is too coarse

It is less necessary for:

- simple QR or NFC attendance MVP flows
- employer-reviewed milestone contracts
- cases where the main value is audit evidence rather than calculated time

In other words: duration is most valuable when start/end timestamps alone are not enough to capture the real work pattern.

---

## Relationship to Existing Issue Ideas

This note is conceptually related to several existing issues, but not identical to any one of them.

- `#62` introduces the idea of non-boolean oracle outputs via a quantitative interface
- `#100` introduces continuous presence and track-point storage
- `#104` introduces app check-in with optional mid-shift check-ins
- `#102` separates scan method from GPS mode, making richer time logic easier to model

The key distinction is:

- those issues mostly define how presence signals are captured
- this note focuses on how verified time could be derived from those signals

---

## Privacy Concerns

Yes, temporal verification can raise privacy concerns.

The most important point is this:

- verified duration itself is relatively low sensitivity
- the raw telemetry needed to compute duration can be highly sensitive

### Lower-sensitivity data

Examples:

- total verified minutes
- shift start and shift end timestamps
- count of completed check-in intervals
- pass/fail geofence summaries

This kind of data is often enough for payment logic and reporting without exposing detailed movement history.

### Higher-sensitivity data

Examples:

- continuous GPS tracks
- detailed location coordinates over time
- precise movement patterns during the workday
- retention of raw traces long after payroll/dispute windows close

This can reveal behavior beyond what is needed to protect wages, including travel routes, break habits, and off-site movements.

That creates real privacy risk, especially for vulnerable workers.

---

## Design Principle: Duration Should Be a Derived Metric

The safest design is to treat verified duration as a derived metric, not as a justification to over-collect raw location data.

Recommended principle:

- collect the minimum raw evidence needed
- derive verified duration from that evidence
- retain raw evidence only as long as necessary
- store and expose summarized results by default

This aligns with LucidLedger's worker-protection framing better than building a high-surveillance telemetry system.

---

## Privacy-Preserving Design for LucidLedger

If LucidLedger adds temporal oracles, the design should favor the following pattern.

### 1. Separate source data from derived results

Raw data examples:

- clock-in event
- clock-out event
- periodic check-in event
- GPS track point

Derived data examples:

- verified_minutes
- excluded_minutes
- duration_method
- confidence or compliance flags

The default reporting surface should prefer derived data over raw telemetry.

### 2. Minimize raw collection by oracle mode

Different oracle modes need different levels of data.

#### QR / NFC scan mode

Usually enough:

- clock-in timestamp
- clock-out timestamp
- optional geofence pass/fail

Likely not necessary:

- continuous location history

#### App check-in mode

Usually enough:

- clock-in timestamp
- clock-out timestamp
- optional periodic check-in timestamps
- per-check-in geofence result

Likely sufficient for derived duration without full continuous movement traces.

#### Continuous GPS mode

Most privacy-sensitive. This mode should:

- sample no more frequently than needed
- derive verified duration server-side
- avoid exposing raw tracks by default in the UI
- retain detailed track points for a limited period only

### 3. Retain summaries longer than raw telemetry

Recommended retention model:

- keep derived shift summary longer
- keep raw detailed telemetry for a short dispute/review window
- delete or heavily reduce raw location detail after that window

Example:

- retain `verified_minutes`, `clock_in_time`, `clock_out_time`, and summary flags for normal reporting
- retain detailed `gps_track_points` only for dispute support, then purge or aggregate

The exact retention period should be a policy decision and may vary by jurisdiction.

### 4. Prefer interval summaries over full movement playback

Instead of storing or exposing every movement detail indefinitely, store interval-level results such as:

- 08:00-10:00 verified
- 10:00-10:20 out of zone
- 10:20-13:00 verified

This often preserves what matters for payment and disputes without turning the system into a route-history archive.

### 5. On-chain anchoring should use hashes or summaries, not raw traces

If detailed telemetry is ever anchored onchain, privacy risk becomes much higher because onchain data is effectively permanent.

Safer approach:

- anchor a hash of the shift evidence package
- anchor a hash of a GPS track bundle
- anchor summarized outputs such as verified minutes

Avoid:

- storing raw coordinates onchain
- storing full attendance traces onchain

Onchain permanence should be used for integrity, not for publishing sensitive worker telemetry.

### 6. Be explicit about purpose and mode selection

Employers and workers should understand the difference between:

- attendance confirmation
- geofence-at-scan
- periodic check-in
- continuous presence

These are different levels of verification and different levels of privacy impact.

The product should make those tradeoffs explicit at job configuration time.

### 7. Use worker-protective defaults

A worker-protective temporal design would default toward:

- lower-frequency collection where possible
- summary-first reporting
- limited raw-retention windows
- clear rationale for any continuous mode

This is especially important because the platform's mission is not neutral timekeeping alone; it is wage protection.

---

## A Practical Temporal Model

If LucidLedger introduces temporal oracles, a practical model could look like this:

### Per shift summary

Store:

- `clock_in_time`
- `clock_out_time`
- `verified_minutes`
- `excluded_minutes`
- `verification_method`
- `verification_summary`

Example `verification_summary`:

```json
{
  "mode": "app_checkin",
  "expected_checkins": 3,
  "completed_checkins": 3,
  "geofence_failures": 0,
  "confidence": "high"
}
```

### Optional raw evidence

Store separately and temporarily:

- event timestamps
- GPS snapshots
- track points
- device corroboration fields

This evidence supports disputes, but does not need to be the main long-term product surface.

---

## On-Chain Implications

If the oracle interface ever becomes quantitative, verified time can still fit cleanly into a numeric model.

Possible representation:

- `unitsCompleted(address workContract) -> uint256`

with units defined as:

- verified minutes
or
- verified seconds

That means the Solidity type is not the problem. The real design question is:

- what evidence is used to derive the duration
- how much of that evidence should be persisted
- what should be recorded onchain versus kept offchain

The privacy-preserving answer is usually:

- compute duration from offchain evidence
- keep only the minimum necessary summary onchain

---

## Bottom Line

Temporal verification can be genuinely useful because it:

- fits time-based payment better
- distinguishes attendance from sustained presence
- supports partial-credit and exception logic
- simplifies disputes
- improves payroll-style reporting

But it also raises privacy concerns when it depends on detailed telemetry, especially continuous GPS.

For LucidLedger, the right approach is:

- treat duration as a derived metric
- collect the minimum raw evidence needed
- default to summarized outputs
- limit retention of sensitive raw telemetry
- anchor hashes or summaries onchain rather than detailed traces

That would allow the platform to support richer time verification without drifting into unnecessary surveillance.
