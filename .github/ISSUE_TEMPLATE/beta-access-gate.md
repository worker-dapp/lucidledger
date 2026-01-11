---
name: Implement Beta Access Gate
about: Add access code requirement before login to gate beta access
title: 'Feature: Implement Beta Access Gate for Private Beta'
labels: 'enhancement, authentication, ui/ux, priority: medium'
assignees: ''
---

## Overview

Implement an access code system that gates Dynamic Labs login while keeping job browsing public. This protects against real job applications while allowing funders/partners to explore the full platform.

## Problem Statement

- Site is in production but not ready for real users
- Need to show full functionality to funders/partners
- Want public to browse jobs (with demo warnings) but not apply
- Current demo mode shows warnings but doesn't prevent actions

## Solution

Add a Beta Access Gate modal that requires an access code BEFORE allowing users to trigger Dynamic Labs authentication.

---

## User Flows

**Public User (No Access Code)**
- Can browse landing page and job search freely
- Clicking "Apply" or "Login" triggers access gate modal
- Modal shows: "Beta access required. Contact admin@lucidledger.co"
- Options: "Contact Us" or "I Have An Access Code"

**Funder/Partner (Has Access Code)**
- Clicks "Login" → Access gate modal appears
- Enters valid code → Stored in localStorage (`betaAccessGranted=true`)
- Dynamic Labs modal opens → Full access granted
- Demo banners remain visible

**Returning Beta User**
- Access persists via localStorage
- Can login directly without re-entering code

---

## Implementation Tasks

### Environment Setup
- [ ] Add `VITE_BETA_ACCESS_CODE` to `client/.env`
- [ ] Add `VITE_BETA_ACCESS_CODE` to `client/.env.example` with documentation
- [ ] Document in `CLAUDE.md` under Environment Configuration

### New Component
- [ ] Create `client/src/components/BetaAccessGate.jsx`
  - Modal UI with two states: message and code entry
  - "Contact Us" button (opens email to admin@lucidledger.co)
  - "I Have An Access Code" button (shows input field)
  - Code validation against `VITE_BETA_ACCESS_CODE`
  - On success: store `betaAccessGranted=true` in localStorage
  - On error: show "Invalid code. Please contact admin@lucidledger.co"

### Component Updates
- [ ] Modify `client/src/components/Navbar.jsx`
  - Intercept employee/employer login buttons
  - Check `betaAccessGranted` before triggering Dynamic Labs
  - Show access gate modal if not granted

- [ ] Modify `client/src/EmployeePages/EmployeeJobsPage.jsx`
  - Intercept "Apply" and "Save" buttons when user not authenticated
  - Show access gate modal instead of auth flow
  - Store pending action to resume after access granted

### Testing
- [ ] Can browse jobs without access code
- [ ] Login buttons show access gate modal
- [ ] Apply button shows access gate modal
- [ ] Invalid code shows error message
- [ ] Valid code grants access and opens Dynamic Labs
- [ ] Access persists after page refresh
- [ ] Demo banners still visible with access
- [ ] Mobile responsive

---

## Technical Details

**Environment Variable:**
```bash
VITE_BETA_ACCESS_CODE=pilot2026
```

**localStorage Key:**
```javascript
betaAccessGranted: 'true' | null
```

**Access Check Pattern:**
```javascript
const hasAccess = localStorage.getItem('betaAccessGranted') === 'true';
if (!hasAccess) {
  // Show access gate modal
}
```

**Modal Content (Initial State):**
```
Beta Access Required

LucidLedger is currently in private beta for pilot partners and funders.

To participate in our pilot program or learn more about partnership
opportunities, please contact:

admin@lucidledger.co

[Contact Us via Email]    [I Have An Access Code]
```

---

## Files to Modify

**New:**
- `client/src/components/BetaAccessGate.jsx`

**Modified:**
- `client/.env`
- `client/.env.example`
- `client/src/components/Navbar.jsx`
- `client/src/EmployeePages/EmployeeJobsPage.jsx`
- `CLAUDE.md`

---

## Success Criteria

- [ ] Unauthorized users can browse but cannot apply or login
- [ ] Valid access code grants full platform access
- [ ] Demo banners remain visible to beta users
- [ ] Access persists across sessions
- [ ] No console errors or broken functionality

---

## Documentation

Detailed implementation plan: `docs/beta-access-gate-implementation-plan.md`

## Estimated Time

Phase 1 MVP: ~2 hours

---

## Future Enhancements

- Phase 2: Backend validation with unique codes per user
- Phase 3: Automated access request form
- Phase 4: Tiered access levels
