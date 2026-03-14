// Service worker for the Kiosk PWA.
// Network-first strategy: always fetch live data, no offline caching.
// The fetch handler is required for Chrome to treat this as a full PWA
// (installable with standalone display mode).

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
