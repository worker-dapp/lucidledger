package co.lucidledger.kiosk;

import android.nfc.NfcAdapter;
import android.nfc.Tag;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import com.getcapacitor.BridgeActivity;
import java.util.Arrays;

public class MainActivity extends BridgeActivity implements NfcAdapter.ReaderCallback {

    private static final String TAG = "KioskNFC";
    private static final long NFC_LOCKOUT_MS = 3000L;

    private NfcAdapter nfcAdapter;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private String lastUid = null;
    private long lastUidAt = 0L;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        nfcAdapter = NfcAdapter.getDefaultAdapter(this);
    }

    @Override
    public void onResume() {
        super.onResume();
        enableReaderMode();
        dispatchKioskNfcStatus(nfcAdapter != null && nfcAdapter.isEnabled() ? "listening" : "unavailable");
    }

    @Override
    public void onPause() {
        super.onPause();
        disableReaderMode();
    }

    private void enableReaderMode() {
        if (nfcAdapter == null || !nfcAdapter.isEnabled()) {
            Log.w(TAG, "NFC unavailable or disabled");
            return;
        }

        Bundle options = new Bundle();
        int flags = NfcAdapter.FLAG_READER_NFC_A
                | NfcAdapter.FLAG_READER_NFC_B
                | NfcAdapter.FLAG_READER_NFC_F
                | NfcAdapter.FLAG_READER_NFC_V
                | NfcAdapter.FLAG_READER_SKIP_NDEF_CHECK
                | NfcAdapter.FLAG_READER_NO_PLATFORM_SOUNDS;

        nfcAdapter.enableReaderMode(this, this, flags, options);
        Log.d(TAG, "NFC reader mode enabled");
    }

    private void disableReaderMode() {
        if (nfcAdapter == null) return;
        try {
            nfcAdapter.disableReaderMode(this);
            Log.d(TAG, "NFC reader mode disabled");
        } catch (Exception e) {
            Log.w(TAG, "Error disabling reader mode", e);
        }
    }

    @Override
    public void onTagDiscovered(Tag tag) {
        if (tag == null) return;

        byte[] idBytes = tag.getId();
        if (idBytes == null || idBytes.length == 0) {
            Log.w(TAG, "Tag discovered but tag.getId() is empty");
            return;
        }

        StringBuilder uidBuilder = new StringBuilder();
        for (byte b : idBytes) {
            uidBuilder.append(String.format("%02X", b));
        }
        String uid = uidBuilder.toString();

        long now = System.currentTimeMillis();
        synchronized (this) {
            if (uid.equals(lastUid) && (now - lastUidAt) < NFC_LOCKOUT_MS) {
                Log.d(TAG, "Ignoring duplicate NFC tag within lockout window: " + uid);
                return;
            }
            lastUid = uid;
            lastUidAt = now;
        }

        Log.d(TAG, "NFC tag discovered uid=" + uid + " techs=" + Arrays.toString(tag.getTechList()));
        dispatchKioskNfcEvent(uid);
    }

    private void dispatchKioskNfcStatus(String status) {
        dispatchJavascriptEvent(
                "window.dispatchEvent(new CustomEvent('kiosk-nfc-status', { detail: { status: '" + escapeJs(status) + "' } }))"
        );
    }

    private void dispatchKioskNfcEvent(String uid) {
        dispatchJavascriptEvent(
                "window.dispatchEvent(new CustomEvent('kiosk-nfc', { detail: { uid: '" + escapeJs(uid) + "' } }))"
        );
    }

    private void dispatchJavascriptEvent(String script) {
        mainHandler.post(() -> {
            if (getBridge() == null || getBridge().getWebView() == null) {
                Log.w(TAG, "Bridge/WebView not ready; dropping NFC event");
                return;
            }
            getBridge().getWebView().evaluateJavascript(script, null);
        });
    }

    private String escapeJs(String value) {
        return value
                .replace("\\", "\\\\")
                .replace("'", "\\'");
    }
}
