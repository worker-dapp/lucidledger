# Wave 0 + 0.5 — Local QA Checklist (branch `wave-0-security-fixes`, PR #137)

Manual "kick the tires" pass to confirm #132 (on-chain fee verification) and #130
(ESLint cleanup) work locally. Run the app via `docker compose up`, open the browser
devtools **Console** (keep visible) and **Network** tabs.

Key facts:
- `sendSponsoredTransaction` waits for the tx receipt before returning the hash
  (`client/src/contracts/aaClient.js:110`), so a legit recruiter-fee payment should land
  **"Paid" (verified)**, not "pending".
- Local DB is the `postgres` container (separate from prod RDS). `server/.env` has the new
  `USDC_ADDRESS` loaded via `env_file` on backend startup.

## Part 1 — #130: did anything break? (higher risk)
Risk sources: the context extraction (Employee/Employer/Recruiter contexts moved to their own
files, ~13 imports repointed) and dead-code removal. A miss shows as a white screen or a console
error like `Cannot read properties of null` / anything mentioning a context (`useEmployer`, etc.).
Load each page, confirm it renders its data with **no red console errors**:

- [ ] Employee: `/job-search`
- [ ] Employee: `/job-tracker`
- [ ] Employee: `/employee-profile`
- [ ] Employer: `/contract-factory` — click **every** tab (Posted Jobs, Application Review, Awaiting Deployment, Library)
- [ ] Employer: `/workforce`
- [ ] Employer: Compliance Hub — all tabs (Overview, Reports, Disputes, Completed Contracts, Audit Log)
- [ ] Employer: `/employer-profile`
- [ ] Recruiter: `/recruiter-dashboard`
- [ ] Recruiter: `/recruiter-candidates`
- [ ] Recruiter: `/recruiter-profile`
- [ ] Onboarding: `/user-profile` (removed dead `usStates` here — confirm the state field still works)
- [ ] Both navbars (employee + employer) — click around; removed unused handlers, confirm nothing dead-clicks/404s

## Part 2 — #132: the new behavior
Do a recruiter-fee payment end-to-end (as employer, pay the fee for a job with a recruiter assigned).

- [ ] Payment completes; shows a **"Paid" badge with a working Basescan link**
- [ ] In Network tab, `POST /api/recruiters/fee-payments`:
  - **201 + `payment_status: "paid"`** → verification passed ✓ (the win)
  - **400 "On-chain verification failed…"** → verifier rejected (real mismatch to investigate)
  - **201 + `payment_status: "pending"`** → couldn't confirm on-chain (RPC/timing)

Optional: watch verification live with `docker compose logs -f backend` during the payment.

## Troubleshooting log

### 2026-08-04 — Blank white page on employer login (FIXED)
- **Symptom:** blank page after logging in as employer. Console: `EmployerLayout.jsx:127 Uncaught ReferenceError: Icon is not defined`.
- **Root cause:** the #130 cleanup removed `icon: Icon` from four `.map()` destructures that *do* render `<Icon />` in JSX. ESLint false-flagged them as unused because (a) the config has no JSX-aware plugin and (b) `Icon` is a destructured **arg**, which the existing `varsIgnorePattern: '^[A-Z_]'` doesn't cover (that only applies to vars). So lint + `npm run build` both passed while the pages crashed at runtime.
- **Blast radius (all fixed):** `EmployerLayout.jsx`, `RecruiterLayout.jsx`, `ContractFactory/index.jsx`, `ComplianceHub/index.jsx` — restored `icon: Icon` in each.
- **Prevention:** added `argsIgnorePattern: '^[A-Z_]'` to `no-unused-vars` in `eslint.config.js` so capitalized destructured components aren't false-flagged.
- **Lesson:** lint + build passing does NOT prove JSX renders — only runtime does. This is exactly the gap #136 (and browser smoke-testing) is meant to close. `Icon` was the only JSX-element-only var removed in #130; all other removals (functions/data used via normal JS references) were genuinely unused.
