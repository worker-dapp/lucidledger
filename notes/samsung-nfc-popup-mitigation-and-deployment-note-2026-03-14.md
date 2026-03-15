# Samsung NFC Popup Mitigation And Deployment Note

Date: 2026-03-14

## Summary

The Capacitor kiosk app can now read NFC badges reliably in native Android reader mode, but Samsung tablets were showing a separate system popup over the kiosk during scans. The popup was materially reduced by:

- moving the kiosk into an NFC-only mode instead of running QR and NFC simultaneously
- using native `NfcAdapter.enableReaderMode()` in `MainActivity`
- removing NFC intent-based handling and relying on reader mode only
- adding a native same-UID lockout window to suppress repeated reads
- disabling the Android `Tags` app on the test tablet:
  - package: `com.android.apps.tag`

The popup appears to have been caused by the system tag handler waking up in parallel with the kiosk app.

## What We Disabled

On the test Samsung tablet, the following package was disabled with `adb`:

```bash
/Users/ejt/Library/Android/sdk/platform-tools/adb shell pm disable-user --user 0 com.android.apps.tag
```

To re-enable it later:

```bash
/Users/ejt/Library/Android/sdk/platform-tools/adb shell pm enable com.android.apps.tag
```

Observed result after disabling `com.android.apps.tag`:

- the intrusive popup behavior dropped substantially
- kiosk NFC scans became much more reliable
- the app continued to receive native NFC callbacks

This strongly suggests the popup was coming from the Android `Tags` app rather than from the kiosk app itself.

## Kiosk App Changes In This Investigation

The kiosk app was moved toward a cleaner native reader-mode implementation:

- custom native NFC handling in `kiosk-app/android/app/src/main/java/co/lucidledger/kiosk/MainActivity.java`
- `enableReaderMode()` with:
  - `FLAG_READER_NFC_A`
  - `FLAG_READER_NFC_B`
  - `FLAG_READER_NFC_F`
  - `FLAG_READER_NFC_V`
  - `FLAG_READER_SKIP_NDEF_CHECK`
  - `FLAG_READER_NO_PLATFORM_SOUNDS`
- NFC reader enabled in `onResume()`
- NFC reader disabled in `onPause()`
- NFC intent-based diagnostics later removed so the kiosk is reader-mode-only
- same-UID lockout raised to 30 seconds in the native layer
- kiosk UI forced into NFC-only mode for testing

Important conclusion: running QR scanning and NFC scanning simultaneously in the same kiosk flow appears to be a bad fit on Samsung. NFC only became reliable after the camera/QR path was removed from the active kiosk screen.

## Comparison With TagInfo

`TagInfo` was an important control test.

What it showed:

- the tablet can read the badge in software without the kiosk app being fundamentally blocked
- repeated scans still happen when the tag remains near the antenna
- the popup did **not** behave the same way under `TagInfo` as it did under the kiosk app

Implications:

- the popup is not an unavoidable property of the hardware alone
- the current kiosk implementation was not yet matching the interaction pattern of a dedicated native NFC reader app
- a software-only solution may still be possible, because `TagInfo` proves a foreground app can interact with the tag more cleanly

At the same time, the test tablet clearly has a competing system tag handler (`com.android.apps.tag`), and disabling that handler materially improved kiosk behavior.

## Software-Only Solution Versus Controlled Hardware

There are two realistic deployment paths.

### 1. Software-first approach

Goal: ship the app so it works without requiring device-level provisioning changes.

Pros:

- easier distribution story
- less operational burden on clients
- closer to an ordinary app install model

Cons:

- Samsung behavior may still vary by model / OS build
- there may not be a universal code-only suppression for system tag handlers
- more native Android work is likely required to match dedicated reader apps such as `TagInfo`

Most likely software-first next step:

- keep Capacitor for most UI
- move scan-critical behavior closer to a dedicated native NFC reader implementation
- potentially use a dedicated native scanning activity or component inside the app

### 2. Controlled-device / hardware-oriented approach

Goal: treat kiosk tablets as managed hardware and configure them during provisioning.

Pros:

- more predictable results
- realistic for demo hardware and customer-managed kiosk fleets
- aligns with normal kiosk deployment practice

Cons:

- requires provisioning documentation or MDM/Knox support
- less convenient for unmanaged BYOD-style installs

Most realistic controlled-device mitigation:

- disable `com.android.apps.tag` during Samsung kiosk provisioning
- document Samsung-specific NFC setup steps for supported hardware

## Current Best Interpretation

As of this session:

- native NFC reading in the kiosk app is working
- repeated scans are mostly a tag-left-on-antenna problem and are being managed with native lockout
- the separate popup appears to have been caused by the Android `Tags` app
- disabling `com.android.apps.tag` made the Samsung demo device behave much more like a kiosk reader

So the most honest deployment position is:

- for demos and managed kiosk deployments, disabling the system `Tags` app is a practical fix
- for broader distribution, we should continue investigating whether a cleaner native implementation can reproduce `TagInfo`-like behavior without device provisioning changes

## Suggested Next Steps

1. Confirm end-to-end scan success now that popup interference is reduced.
2. Debug the remaining network/API error path separately from NFC.
3. Decide whether the product should officially support:
   - managed Samsung kiosk provisioning
   - or a stronger software-only native NFC implementation
4. If software-only remains a priority, consider a dedicated native NFC scanning component rather than relying on the current Capacitor activity alone.
