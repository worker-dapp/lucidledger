package co.lucidledger.kiosk;

import android.app.PendingIntent;
import android.content.Intent;
import android.nfc.NfcAdapter;
import android.util.Log;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final String TAG = "KioskNFC";
    private NfcAdapter nfcAdapter;

    @Override
    public void onResume() {
        super.onResume();
        enableForegroundDispatch();
        // Also handle any NFC intent that launched/resumed this activity
        handleNfcIntent(getIntent());
    }

    @Override
    public void onPause() {
        super.onPause();
        disableForegroundDispatch();
    }

    @Override
    public void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleNfcIntent(intent);
    }

    // -------------------------------------------------------------------------
    // enableForegroundDispatch registers this Activity to receive ALL NFC tags
    // while in the foreground — no NDEF filter, raw tag level.  This is the
    // same mechanism Chrome uses for NDEFReader.scan(), but without the
    // browser's "user gesture" restriction.
    // -------------------------------------------------------------------------
    private void enableForegroundDispatch() {
        if (nfcAdapter == null) {
            nfcAdapter = NfcAdapter.getDefaultAdapter(this);
        }
        if (nfcAdapter == null || !nfcAdapter.isEnabled()) return;

        Intent nfcIntent = new Intent(this, getClass())
                .addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this, 0, nfcIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_MUTABLE);

        // null filters = intercept ALL tag types
        nfcAdapter.enableForegroundDispatch(this, pendingIntent, null, null);
        Log.d(TAG, "NFC foreground dispatch enabled");
    }

    private void disableForegroundDispatch() {
        if (nfcAdapter != null) {
            try {
                nfcAdapter.disableForegroundDispatch(this);
            } catch (Exception e) {
                Log.w(TAG, "Error disabling foreground dispatch", e);
            }
        }
    }

    // -------------------------------------------------------------------------
    // When any NFC tag is tapped, extract the raw hardware UID from EXTRA_ID.
    // No NDEF parsing — just the chip serial number, which is what was stored
    // during badge registration in KioskManagement.
    // -------------------------------------------------------------------------
    private void handleNfcIntent(Intent intent) {
        if (intent == null) return;

        String action = intent.getAction();
        boolean isNfcAction = NfcAdapter.ACTION_TAG_DISCOVERED.equals(action)
                || NfcAdapter.ACTION_NDEF_DISCOVERED.equals(action)
                || NfcAdapter.ACTION_TECH_DISCOVERED.equals(action);
        if (!isNfcAction) return;

        byte[] idBytes = intent.getByteArrayExtra(NfcAdapter.EXTRA_ID);
        if (idBytes == null || idBytes.length == 0) {
            Log.w(TAG, "NFC intent received but EXTRA_ID is empty");
            return;
        }

        StringBuilder uid = new StringBuilder();
        for (byte b : idBytes) {
            uid.append(String.format("%02X", b));
        }
        Log.d(TAG, "NFC tag UID: " + uid);

        final String safeUid = uid.toString();

        // Fire a custom window event into the WebView.
        // Using post() ensures WebView is ready on the UI thread.
        getBridge().getWebView().post(() ->
            getBridge().getWebView().evaluateJavascript(
                "window.dispatchEvent(new CustomEvent('kiosk-nfc', { detail: { uid: '" + safeUid + "' } }))",
                null
            )
        );
    }
}
