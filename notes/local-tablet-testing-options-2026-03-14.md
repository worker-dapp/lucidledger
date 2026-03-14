# Local Tablet Testing: Options Considered and Why They Don't Work
_2026-03-14_

## Background

We need to test kiosk features (QR scanning, NFC badge taps) on a physical Android tablet
(Samsung Galaxy Tab Active3). These features require:

1. **HTTPS page origin** — `getUserMedia` (camera, for QR) and `NDEFReader` (foreground NFC)
   are both blocked by Chrome on Android unless the page is served over HTTPS or from
   `localhost`. HTTP on a local IP does not qualify.
2. **No mixed content** — an HTTPS page cannot make `fetch()` calls to an HTTP backend.
   If the frontend is HTTPS, the backend API must also be HTTPS.
3. **Privy allowed origins** — Privy's auth modal only fires on origins listed in the Privy
   dashboard. Any new URL (local IP, tunnel, etc.) must be added there first.

The production deploy works fine (nginx + valid SSL cert), but the CI/CD pipeline takes
~10 minutes. The goal was to find a faster local iteration loop for tablet testing.

---

## Options Considered

### Option 1: Local IP (HTTP)
**Approach:** Run `npm run dev -- --host`, access via `http://192.168.x.x:5173` on tablet.

**Why it doesn't work:**
- `getUserMedia` (camera/QR) blocked on HTTP in Android Chrome — requires secure context.
- `NDEFReader` (foreground NFC) blocked on HTTP — requires secure context.
- Privy login works once IP is added to allowed origins, but the above two blockers make
  this useless for kiosk testing.
- Would work for non-kiosk features (employer dashboard, job flow) but not the use case
  we actually need tablet testing for.

---

### Option 2: Cloudflare Quick Tunnel (Single, Frontend Only)
**Approach:** `cloudflared tunnel --url http://localhost:5173` — gives a random
`https://xxx.trycloudflare.com` URL. No account needed.

**Why it doesn't work (fully):**
- Frontend gets HTTPS ✓
- But API calls from the tablet go to `VITE_API_BASE_URL`, which in docker-compose is
  `http://localhost:5001/api`. `localhost` on the tablet resolves to the tablet itself,
  not the Mac. API calls fail.
- Changing `VITE_API_BASE_URL` to `http://192.168.x.x:5001/api` (local IP) fails due to
  mixed content: HTTPS page cannot call HTTP API.
- **Partially workable** only if using the production API backend
  (`VITE_API_BASE_URL=https://production-api/api`), but then local backend changes aren't
  tested.
- URL changes every session → must update Privy allowed origins each time (~30 seconds,
  annoying but manageable).

---

### Option 3: Cloudflare Quick Tunnel (Two Tunnels — Frontend + Backend)
**Approach:** Run two tunnels simultaneously, one for port 5173 and one for port 5001.
Set `VITE_API_BASE_URL` to the backend tunnel URL. Rebuild frontend container.

**Why it doesn't work well:**
- Both tunnel URLs are random and change every session.
- Each session requires: (1) start two tunnels, (2) copy backend tunnel URL, (3) update
  `client/.env`, (4) rebuild frontend container (`docker compose up --build frontend`),
  (5) add frontend tunnel URL to Privy allowed origins.
- The container rebuild alone takes several minutes — comparable to or worse than just
  pushing to production.
- Verdict: more steps, more friction, similar wait time to CI/CD.

---

### Option 4: Named Cloudflare Tunnel (Persistent URL)
**Approach:** Create a named tunnel tied to a real domain (e.g. `dev.lucidledger.co`).
Persistent URL means Privy only needs to be updated once.

**Why it doesn't work for us:**
- Requires adding `lucidledger.co` to Cloudflare's DNS management, making Cloudflare the
  DNS authority for the entire production domain.
- Risk of disrupting production: SSL termination conflicts with existing nginx config,
  potential for missing DNS records during import.
- Still has the two-tunnel / container-rebuild problem for the backend URL.
- Not worth the production risk for a dev convenience feature.

---

### Option 5: mkcert (Locally Trusted HTTPS Cert)
**Approach:** Use `mkcert` to generate a cert trusted by both Mac and tablet for the local
IP (e.g. `192.168.x.x`). Configure Vite to serve HTTPS. Tablet installs mkcert root CA
once.

**Why it doesn't work cleanly:**
- Fixes frontend HTTPS ✓
- But backend (Express on port 5001) also needs HTTPS to avoid mixed content from the
  HTTPS frontend. Options:
  - Add cert handling to the Express server — touches production code with local-only config.
  - Add a local nginx reverse proxy — adds infrastructure complexity, mirrors production
    setup in a way that could cause confusion.
- `client/.env` `VITE_API_BASE_URL` would need to change to `https://192.168.x.x:5001/api`,
  affecting all local dev sessions even when not testing on tablet.
- Vite config changes needed (add `server.https` with key/cert paths) — local-only change
  that could confuse future contributors.
- One-time setup on tablet (install root CA) — minor but requires Android settings navigation.

---

## Conclusion and Current Approach

No local option provides a clean, low-friction, low-risk path for full kiosk testing
(HTTPS frontend + HTTPS backend + Privy + camera + NFC) without either:
- Significant per-session setup overhead, or
- Non-trivial changes to the codebase that carry production risk.

**Current workflow:**
- Non-kiosk features (employer dashboard, job flow, contract management): develop and test
  on `localhost` in the browser on the Mac.
- Kiosk features (QR scanning, NFC badge taps): push to production and test on the tablet
  against the live deployment. CI/CD pipeline takes ~10 minutes.

**If this becomes a bottleneck**, the best long-term solution is probably a dedicated
staging environment (separate server, permanent domain, own Privy allowed origin) that can
be deployed to faster than production — e.g. a smaller VPS with a simpler deploy script,
no CI/CD gating.
