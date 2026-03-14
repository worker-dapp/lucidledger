import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'co.lucidledger.kiosk',
  appName: 'Lucid Ledger Kiosk',
  webDir: 'dist',
  server: {
    // https scheme required for Web APIs (camera, geolocation) in WebView
    androidScheme: 'https',
  },
  android: {
    // Keep screen on while kiosk is active
    allowMixedContent: false,
  },
};

export default config;
