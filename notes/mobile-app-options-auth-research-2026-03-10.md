# Mobile App Options And Auth Research

Date: 2026-03-10

## Context

This note summarizes a review of the current LucidLedger codebase and follow-up research on React Native, PWA, Capacitor, Privy auth, `localStorage`, and `HttpOnly` cookies.

The goal was to answer:

- How much work would be involved in making a phone app in React Native?
- Should that be a new repo or part of the existing project?
- Would Capacitor or a PWA wrapper fit better?
- Why might auth have failed in a previous PWA attempt?
- Is relying on `localStorage` for auth a problem?
- Would migrating to `HttpOnly` cookies be a reasonable next milestone?

## Codebase Findings

The current frontend is a browser-first React/Vite app, not a shared React codebase designed to target both web and native.

Key signals:

- Web-only entry point and DOM rendering in `client/src/main.jsx`
- Web routing via `react-router-dom` in `client/src/App.jsx`
- Tailwind/CSS styling in `client/src/index.css`
- Heavy use of browser APIs such as `localStorage`, `window`, `document`, and `navigator`
- Auth and wallet flows built around Privy's web React SDK

Examples:

- `client/src/main.jsx` uses `react-dom/client`, `document.getElementById`, and `BrowserRouter`
- `client/src/App.jsx` uses `PrivyProvider`, `SmartWalletsProvider`, route-based redirects, and `localStorage`
- `client/src/hooks/useAuth.js` clears role and pending-action state from `localStorage`
- `client/src/services/api.js` fetches a Privy access token and sends `Authorization: Bearer ...`
- `server/middleware/authMiddleware.js` expects bearer tokens from the `Authorization` header

The frontend surface area is non-trivial:

- 71 JS/JSX files under `client/src`
- Major sections include `components`, `EmployerPages`, `EmployeePages`, `pages`, and `Form`

## React Native Assessment

Conclusion:

- React Native would not be "just a few plugins"
- React Native would also not be "start from absolute scratch"
- The realistic description is: a frontend rewrite over an existing backend

What can be reused:

- Most of the backend API and database
- A good amount of business rules
- Some API client structure
- Some blockchain/domain logic, depending on mobile wallet/auth compatibility
- Smart contract ABIs and chain interaction concepts

What would need major rework:

- Navigation
- Most UI components and layouts
- Forms and responsive interactions
- Browser-only storage and event flows
- Download/export behavior
- Browser geolocation and permissions
- Current Privy web SDK integration
- Any code assuming `window.ethereum`

Bottom line:

- A true React Native client should generally be a separate mobile frontend
- For this repo, that likely means a new repo unless there is a deliberate monorepo/shared-package plan

## Repo Recommendation

Recommendation:

- Keep the current repo for web app + backend
- If building React Native, create a separate repo for the mobile app
- Optionally move shared utilities into shared packages later

Reason:

- Web and React Native would have different runtimes, navigation, UI primitives, build pipelines, and mobile-native configuration
- Keeping React Native inside the existing `client/` app as a normal milestone would blur two different frontends

## PWA And Capacitor Assessment

For this codebase, PWA or Capacitor are much more natural extensions of the existing project than React Native.

Why:

- The app is already a web app
- Existing React, routing, and browser-oriented UI can be kept
- This can be treated as another delivery target rather than a second frontend product

Tradeoff:

- PWA is the lowest-effort path
- Capacitor is more work than PWA, but much less work than React Native
- Capacitor is better if app-store packaging, native permissions, camera/files/geolocation plugins, or push notifications matter

Recommended order:

1. Improve mobile UX in the existing web app
2. Use PWA if the goal is the fastest installable mobile access
3. Use Capacitor if app-store distribution and native device integration matter
4. Revisit React Native only if the web-based mobile approach proves insufficient

## Why Auth Likely Failed In A Previous PWA Attempt

Based on this codebase, auth is the first area where trouble would be expected in a PWA.

Likely causes:

- Auth popup or redirect flow failed or was blocked
- Session state did not persist reliably on mobile browsers
- `localStorage`-based role and pending-action logic was lost or became inconsistent
- Smart wallet creation/linking behaved differently on mobile
- Any auth flow depending on returning from email/SMS/browser handoff became fragile

Why this repo is especially sensitive:

- `client/src/App.jsx` contains substantial post-login redirect and role detection logic
- `client/src/hooks/useAuth.js` and many UI flows depend on `localStorage`
- `client/src/EmployeePages/EmployeeJobsPage.jsx` stores pending actions and uses `window` events
- Core on-chain flows depend on `smartWalletClient` and `smartWalletAddress`

Important point:

- PWA issues do not automatically mean Capacitor is impossible
- They do mean auth, deep-link return, persistence, and wallet flow must be treated as the first proof-of-concept

## Capacitor Research Summary

Official Capacitor position:

- Capacitor is intended to be added to an existing modern web app
- Native projects remain real Xcode/Android Studio projects
- Capacitor provides native APIs via plugins, but does not eliminate mobile app architecture concerns

What official docs suggest:

- Existing web apps are a valid starting point
- Use real native configuration where needed
- Use native/browser plugins and deep-link handling for auth-like flows
- Use plugin-backed storage instead of relying on WebView `localStorage` for important persistent data

Relevant official docs:

- https://capacitorjs.com/docs
- https://capacitorjs.com/docs/basics/workflow
- https://capacitorjs.com/docs/basics/configuring-your-app
- https://capacitorjs.com/docs/apis/browser
- https://capacitorjs.com/docs/apis/app
- https://capacitorjs.com/docs/guides/deep-links
- https://capacitorjs.com/docs/guides/storage
- https://capacitorjs.com/docs/apis/preferences
- https://capacitorjs.com/docs/guides/security

Community signals from Capacitor issues/discussions:

- Positive reports exist for store-approved apps using Capacitor with OAuth/Auth0/MSAL and mostly core plugins
- Recurrent pain points include deep-link return handling, Android app-link verification, and auth/browser callback edge cases

Representative sources:

- https://github.com/ionic-team/capacitor/discussions/7305
- https://github.com/ionic-team/capacitor/discussions/5211
- https://github.com/ionic-team/capacitor/issues/6300
- https://github.com/ionic-team/capacitor/issues/5786

Inference:

- Capacitor is a credible path for LucidLedger
- The hard part is not wrapping the app
- The hard part is getting login, callback, persistence, and smart-wallet flows reliable on real devices

## `localStorage` And Auth

Question answered:

- Depending on `localStorage` for auth is not automatically wrong
- It is a common default for web SDKs
- It is usually not the strongest production design

Main security concern:

- JavaScript can read `localStorage`
- If malicious JavaScript runs in the app page, it can read tokens stored there and exfiltrate them

This is the XSS concern:

- XSS = cross-site scripting
- An attacker gets their JavaScript to run in the page
- If tokens are in `localStorage`, that script can steal them

Why `HttpOnly` cookies are safer:

- Browser sends them automatically with requests
- Frontend JavaScript cannot read them directly
- They reduce token theft risk from XSS

Clarification:

- `HttpOnly` cookies do not make XSS harmless
- They do reduce the risk of raw token theft

## What Privy Docs Say

Privy's docs do not say `localStorage` is forbidden.

Privy's docs do say:

- By default, access tokens are stored in `localStorage`
- For production web apps, `HttpOnly` cookies are recommended
- Setting a base domain is recommended so identity tokens can be set as more secure `HttpOnly` cookies

Relevant official Privy docs:

- Configure cookies: https://docs.privy.io/recipes/react/cookies
- Identity tokens: https://docs.privy.io/user-management/users/identity-tokens
- Security FAQ: https://docs.privy.io/security/security-faqs

Research on Privy and mobile wrappers:

- Privy has an official Capacitor OAuth recipe: https://docs.privy.io/recipes/capacitor-oauth
- That recipe uses Capacitor's browser and app plugins plus Universal/App Links
- It specifically notes OAuth for Capacitor requires Universal App Links over HTTPS and does not work with custom URL schemes
- A dedicated Privy PWA guide was not found during this research
- Privy's OAuth docs also note that some providers, such as Google OAuth, may not work in in-app browsers: https://docs.privy.io/authentication/user-authentication/login-methods/oauth

Inference:

- Privy supports Capacitor, but not in a "wrap the web app and auth will automatically behave" sense
- Mobile callback, storage, and browser handoff still need intentional implementation

## Why The Team May Have Stayed On `localStorage`

Likely reasons:

- It is the simpler initial path
- The current web SDK flow is easy to wire up
- The frontend can fetch a token directly and attach it as a bearer token
- Local development is straightforward when frontend and backend run on separate ports

The current implementation is explicitly built around bearer tokens:

- `client/src/hooks/useAuth.js` gets a token via `getAccessToken()`
- `client/src/services/api.js` attaches the token as `Authorization: Bearer ...`
- `server/middleware/authMiddleware.js` expects the token from the header

So the current architecture is not "Privy cookies but not enabled." It is a bearer-token architecture end to end.

## Would Moving To `HttpOnly` Cookies Be Reasonable Next Milestone?

Yes, as a focused auth hardening milestone.

No, if treated as a tiny configuration-only change.

Why it is not trivial:

- Backend auth currently reads bearer headers, not cookies
- Frontend request behavior would need to change for cookie credentials
- Cross-origin and cookie settings need to be correct
- Some app logic currently mixes auth-adjacent behavior with `localStorage` state

Why it is still reasonable:

- Privy already supports cookie-based production web setups
- Server CORS is already configured with `credentials: true`
- This is a contained architecture improvement, not a total rewrite

Expected work:

1. Decide on cookie-based web auth flow with Privy
2. Update frontend requests for cookie-based session use where appropriate
3. Update backend middleware to support cookie-based token/session reading
4. Reduce reliance on `localStorage` as the source of truth for auth-adjacent state
5. Retest login, logout, refresh, role switching, and mobile behavior

Assessment:

- Moderate change
- Not a one-line switch
- Reasonable for a next milestone if scoped deliberately

## Recommended Next Steps

1. Treat React Native as a separate future product, not the next web-app milestone
2. If mobile is needed sooner, evaluate Capacitor first
3. Make the first Capacitor proof-of-concept only about:
   - fresh login
   - callback return
   - session persistence after close/reopen
   - smart-wallet creation
   - one real on-chain action
4. Before investing more in mobile wrappers, reduce auth fragility in the web app
5. Plan a cookie-based auth hardening milestone for the web app
6. Audit and reduce use of `localStorage` for role/pending-action/session orchestration

## Final Practical Takeaway

The app is well positioned to keep one backend and continue as a web-first product.

If a native app is eventually desired:

- React Native is a substantial mobile frontend project
- Capacitor is much closer to the current architecture
- PWA/Capacitor auth problems should be expected unless storage, callback handling, and wallet flows are designed intentionally

The most useful near-term move is likely:

- harden auth and persistence first
- then run a small Capacitor proof-of-concept against the real Privy and wallet flows
