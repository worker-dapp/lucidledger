// Minimal service worker required for PWA installability.
// No caching strategy — the kiosk always needs live data from the API.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
