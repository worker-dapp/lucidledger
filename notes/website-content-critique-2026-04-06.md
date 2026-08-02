# Website Content Critique
**Date:** April 6, 2026
**Pages reviewed:** `/` (LandingPage.jsx) and `/about-us` (NewAbout.jsx)
**Status:** Deferred — return when ready to prioritize public-facing content

---

## Correction: The Real About Page

The actual About page is `client/src/pages/NewAbout.jsx` (exports `AboutPage`), not `AboutUs.jsx` (exports `AboutUs`). The router mounts `AboutPage` at `/about-us`. `AboutUs.jsx` is dead code — it is not used anywhere.

`NewAbout.jsx` is a full, well-structured page with:
- Hero: *"Preventing Wage Theft Through Transparency"*
- Problem & Solution comparison (Traditional Platforms vs. Lucid Ledger)
- "Learn More" cards (White Paper, GitHub, Contributors, Discord) — this is what appears in the browser
- Oracle verification methods (Location, Image, Weight/Quantity, Time Tracking)
- Complete System Flow diagram (SVG, inline)
- Technology Stack section
- Open Source / Community section
- Call to Action ("Join the Movement")

The summary critique below focuses on what still needs work.

---

## Known Bugs / Broken Links (fix when ready)

**1. Broken white paper link — appears in TWO places:**
- `NewAbout.jsx` line 108: `/assets/luicid-ledger-whitepaper.pdf`
- `Footer.jsx` line 33: `/assets/luicid-ledger-whitepaper.pdf`

The filename has a typo: `luicid` instead of `lucid`. Fix both to `/assets/lucid-ledger-whitepaper.pdf` (and confirm the file exists at that path in `client/public/assets/`).

**2. Dead code: `AboutUs.jsx` and `Banner.jsx`**
Neither is used in routing. `AboutUs.jsx` renders the old stub page (slogan + 4 icon cards, no content). Safe to delete both, along with `WhyLaborLadger.jsx` (also unused, also has a filename typo — "Ladger").

**3. Stale alt text in `Banner.jsx`**: `alt="laborledger-banner"` uses the old project name. Moot if the file is deleted.

---

## Content Issues

**1. The system flow diagram is confusing (confirmed).**
The SVG in `NewAbout.jsx` tries to show everything at once — Employer, Worker, Recruitment Hub, Job Posting, Application, Work Contract, Work Period, Escrow System, Oracle Network, Compliance System, Survey System, Worker/Employer DAOs, Dispute Resolution, Payment Release, Reputation System — all in a single downward-branching graph with nodes at awkward coordinates. It is hard to follow because it is not a sequence; it is a system map.

The presentation version works better because it walks through a *narrative* (what happens first, second, third). For the poster and potentially for the website too, a two-lane swimlane (Employer / Worker) is clearer. See the poster planning note for a suggested redraw.

**2. Roadmap/research features presented as current — remove from marketing materials.**
The diagram and tech stack include items that do not exist in the current codebase and should be removed from public-facing pages:
- **DAOs** (Worker/Employer DAOs node in the diagram; "DAOs" tag in the tech stack) — **drop entirely** from marketing. Better suited to an academic article or niche governance experiment than an app being marketed to industry. Explaining DAOs to an industry audience creates more confusion and skepticism than it's worth.
- **Reputation System** (node in the diagram) — remove or label as roadmap
- **Compliance System** and **Survey System** (nodes in the diagram) — remove or label as roadmap
- **AI-powered job recommendations** (in `WhyLaborLadger.jsx`, unused) — remove

For the system flow diagram specifically, strip it back to the core flow that actually exists: job posting → application → contract deployment + escrow → work → oracle verification → payment release / dispute resolution. That is the differentiating story and it stands on its own.

**3. The problem statement is present but light.**
The Problem & Solution section has a good structure (red/green comparison boxes) but the content is generic bullet points without any of the compelling statistics from the pitch deck. Adding even one or two numbers ($11.85B, 170M migrant workers) would make this section much more impactful.

---

## Landing Page (`/`) Issues

**1. "How It Works" describes any job board.**
The three steps — Search & Apply → Sign Your Contract → Get Paid — apply equally to Indeed or LinkedIn. The escrow mechanism is absent. At minimum, Step 2 should mention wages are locked in a smart contract before work begins:

> *Sign Your Contract* — Review terms and sign digitally. Your wages are locked in escrow on-chain before you start work.

**2. "Join thousands of workers" needs updating before production.**
The platform is in private beta. This copy needs to change before going fully public. (Likely already in PRODUCTION_CHECKLIST.md.)

**3. Feature naming is inconsistent with the About page.**
The landing page and About page use the same 4 icons with different labels. Pick one set.

| Landing Page | About Page (Banner.jsx, now dead) |
|---|---|
| Find Your Next Job | Easy Job Hunt |
| Get Paid Securely | Simplified Payments |
| Voice Your Concerns | Grievance Mechanism |
| Fair Dispute Resolution | Dispute Management |

---

## Recommended Priorities (when this work is picked up)

1. **Fix the broken white paper link** in `NewAbout.jsx` and `Footer.jsx` — `luicid` → `lucid`. Confirm the PDF exists at `client/public/assets/lucid-ledger-whitepaper.pdf`.
2. **Delete dead files**: `AboutUs.jsx`, `Banner.jsx`, `WhyLaborLadger.jsx`.
3. **Add stats to the Problem section** in `NewAbout.jsx` — at least the $11.85B figure and the 170M migrant workers number.
4. **Label or remove roadmap items** from the system flow diagram (DAOs, Reputation System, Compliance System, Survey System).
5. **Replace or redraw the system flow diagram** — a Mermaid sequence diagram draft is saved in `innovationfest-poster-plan-2026-04-06.md` under "SYSTEM FLOW DIAGRAM". Use the full version (including the dispute resolution `alt/else` block) for the website.
6. **Add one sentence about escrow** to Step 2 of "How It Works" on the landing page.
7. **"Join thousands of workers"** — update before production launch.
