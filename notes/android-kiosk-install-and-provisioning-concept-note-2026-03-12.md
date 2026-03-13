# Android Kiosk Install And Provisioning Concept Note

Date: 2026-03-12

## Context

Current kiosk setup works in mobile Chrome:

- Employer registers a kiosk device in Lucid Ledger
- App generates a kiosk setup URL of the form `/kiosk?token=...`
- Opening that URL on the Android device stores the kiosk token in browser `localStorage`
- After that, the device can launch `/kiosk` directly without needing the original link again unless browser data is cleared or the token is regenerated

For the pilot, the practical workaround is:

1. Open the setup link on the Android device in Chrome
2. Complete initial setup once
3. Use Chrome's `Add to Home screen` or `Install app` option
4. Launch the kiosk from the Android home screen afterward

This is usable for now, but the provisioning and install story is still weak.

## Why Not Build A Note-Only Prompt Now

A visible note on the kiosk page saying "add this to your home screen" would have limited value by itself.

Reasons:

- It would not reliably trigger a true install flow on its own
- Browser install behavior is platform- and PWA-dependent
- Without proper PWA support, the best it can do is explain manual Chrome steps
- That adds UI clutter without materially reducing setup friction

Conclusion:

- Defer UI work here until there is a real install/provisioning feature to attach it to

## Product Problem To Solve Later

Field managers may operate the Android kiosk device without access to the employer's Lucid Ledger account.

That means kiosk setup should eventually behave like device provisioning, not like finding an old email or stored link.

The desired outcome:

- Employer admin authorizes a kiosk once
- Field manager provisions the device without dashboard access
- Device stores a durable kiosk credential locally
- Device launches from home screen or installed app entry point
- Re-provisioning only happens when the token is rotated, the device is replaced, or local app/browser data is lost

## Deferred Options

### Option 1: QR-Based Kiosk Provisioning

Employer dashboard shows a one-time provisioning QR code for a kiosk.

Flow:

1. Employer registers or regenerates a kiosk token
2. Dashboard renders a QR code encoding `/kiosk?token=...`
3. Manager opens the kiosk app or web shell on Android
4. Device scans the provisioning QR
5. Kiosk token is stored locally and kiosk mode starts

Pros:

- Better than emailing links
- Works well for in-person device setup
- Minimal backend change

Cons:

- Still depends on a browser/web shell unless a packaged app exists
- Token transport still needs security review if QR remains reusable for long periods

### Option 2: One-Time Enrollment Code

Instead of distributing the full token/link, the employer dashboard shows a short enrollment code.

Flow:

1. Employer creates kiosk
2. Dashboard displays short code with short TTL
3. Manager enters code in app
4. App exchanges code for kiosk token over API

Pros:

- Easier to type than a long URL
- Better operationally for remote setup by phone call or text

Cons:

- Requires extra backend enrollment endpoint and code lifecycle management

### Option 3: Proper PWA Install Flow

Turn the kiosk surface into a true PWA install target.

Possible work:

- add manifest
- add service worker
- verify installability criteria
- handle Android Chrome install prompt when available
- define offline/cache expectations

Pros:

- More app-like launcher behavior
- Cleaner home-screen experience

Cons:

- Install prompts are browser-controlled and not guaranteed
- This solves install UX more than provisioning UX

### Option 4: Packaged Android App / Capacitor Shell

Wrap the kiosk in a lightweight Android app or Capacitor project.

Pros:

- Better control over startup, permissions, storage, and scanner UX
- Cleaner field deployment path

Cons:

- Higher implementation and maintenance cost
- Not necessary for current pilot

## Recommended Sequence

After the pilot, the most pragmatic order is:

1. Add QR-based provisioning to remove email/link dependency
2. Improve kiosk re-enrollment and token rotation UX in employer dashboard
3. Evaluate PWA installability for kiosk-only surface
4. Revisit packaged Android app only if browser/PWA constraints become operationally limiting

## Current Operational Guidance

Until this work is prioritized:

- Use the generated kiosk setup link once on the Android device
- Add the kiosk to the device home screen from Chrome after setup
- Avoid regenerating kiosk tokens unless necessary
- If the device loses browser data, re-open the setup link and repeat provisioning

## Trigger To Revisit

This should move up the backlog when any of the following becomes common:

- repeated support requests about "where is the kiosk link?"
- managers lacking employer account access during setup
- frequent kiosk token resets or device swaps
- desire to distribute Lucid Ledger as an actual Android app
