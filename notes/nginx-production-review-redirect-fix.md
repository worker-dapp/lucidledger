# Nginx Production Review: Redirect Host Fix

## Diagnosis

The production Nginx setup is broadly correct and useful:
- Nginx is the public edge in `docker-compose.nginx.yml` on ports `80/443`.
- `/api/` routes to backend and `/` routes to frontend in `nginx.conf`.
- TLS termination, ACME challenge handling, security headers, and gzip are present.

However, there is a redirect issue in the HTTP server block:
- `nginx.conf:26` currently uses:

```nginx
return 301 https://$server_name$request_uri;
```

- The same server block defines multiple names (`lucidledger.co`, `www.lucidledger.co`, `api.lucidledger.co`) at `nginx.conf:16`.
- With multiple names, `$server_name` can resolve to the first configured name for the block rather than preserving the request host.

## Why This Matters

This can cause host-switching redirects, especially for `api.lucidledger.co` requests received over HTTP, which may be redirected to `https://lucidledger.co/...` instead of staying on `https://api.lucidledger.co/...`.

## Proposed Change

Replace the redirect target to preserve the incoming host:

```nginx
return 301 https://$host$request_uri;
```

## Exact Patch

File: `nginx.conf`

```diff
-        return 301 https://$server_name$request_uri;
+        return 301 https://$host$request_uri;
```

## Additional Observation (Non-blocking)

In `docker-compose.nginx.yml`, `nginx` depends on `frontend` but not `backend`. This is usually fine after startup, but backend cold starts can temporarily produce `502` on API routes.

Optional hardening:
- Add `depends_on` for `backend`, and/or
- Configure healthchecks and startup gating for backend readiness.
