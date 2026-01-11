# Beta Access Gate Implementation Plan

## Overview
Implement an access code system that gates Dynamic Labs login while keeping job browsing public. This protects against real job applications while allowing funders/partners to explore the platform.

## Problem Statement
- Site is in production but not ready for real users
- Need to show functionality to funders/partners
- Want public to browse jobs (with demo warnings) but not apply
- Current demo mode shows warnings but doesn't prevent actions

## Proposed Solution
Add a **Beta Access Gate** that requires an access code BEFORE allowing users to trigger Dynamic Labs authentication.

---

## User Flows

### Public User (No Access Code)
1. Visits landing page → ✅ Can browse freely
2. Browses job search → ✅ Can see all jobs
3. Clicks "Apply" or "Login" button → ❌ Access gate modal appears
4. Sees message: "Beta access required. Contact admin@lucidledger.co"
5. Can either:
   - Click "Contact Us" (opens email)
   - Click "I Have An Access Code" (shows input field)

### Funder/Partner (Has Access Code)
1. Visits landing page → ✅ Can browse freely
2. Clicks "Login" button → Access gate modal appears
3. Enters access code → Validates successfully
4. Code stored in localStorage (`betaAccessGranted=true`)
5. Dynamic Labs modal opens → Proceeds with normal auth flow
6. Full access to all features (with demo banners still visible)

### Returning Beta User
1. Has `betaAccessGranted=true` in localStorage
2. Can login directly without re-entering code
3. Code persists until localStorage is cleared

---

## Implementation Details

### 1. Environment Variable
**File: `client/.env`**
```bash
# Beta Access Configuration
VITE_BETA_ACCESS_CODE=pilot2026
# Change this code if it leaks or for different cohorts
```

### 2. New Component: BetaAccessGate
**File: `client/src/components/BetaAccessGate.jsx`**

Create a modal component that:
- Appears when user tries to login (employee or employer)
- Has two states:
  - **Initial:** Shows beta message with "Contact Us" and "I Have An Access Code" buttons
  - **Code Entry:** Shows input field with "Submit" button
- Validates code against `VITE_BETA_ACCESS_CODE`
- On success: stores `betaAccessGranted=true` in localStorage, closes modal, triggers callback
- On failure: shows error "Invalid code. Please contact admin@lucidledger.co"

**Modal Content:**
```
🔒 Beta Access Required

LucidLedger is currently in private beta for pilot partners and funders.

To participate in our pilot program or learn more about partnership opportunities:

📧 admin@lucidledger.co

[Contact Us via Email]    [I Have An Access Code]
```

### 3. Modify Navbar Component
**File: `client/src/components/Navbar.jsx`**

Update employee/employer login handlers:
```javascript
const [showAccessGate, setShowAccessGate] = useState(false);

const handleEmployeeLogin = () => {
  // Check if user already has access
  if (localStorage.getItem('betaAccessGranted') === 'true') {
    // Proceed with normal login
    localStorage.setItem('pendingRole', 'employee');
    localStorage.setItem('userRole', 'employee');
    window.dispatchEvent(new Event('roleSelected'));
    setShowAuthFlow(true);
    openModal?.();
  } else {
    // Show access gate
    setShowAccessGate(true);
  }
};

const handleAccessGranted = () => {
  // Called after successful code entry
  setShowAccessGate(false);
  // Now trigger Dynamic Labs
  localStorage.setItem('pendingRole', 'employee'); // or employer
  localStorage.setItem('userRole', 'employee'); // or employer
  window.dispatchEvent(new Event('roleSelected'));
  setShowAuthFlow(true);
  openModal?.();
};
```

### 4. Modify EmployeeJobsPage
**File: `client/src/EmployeePages/EmployeeJobsPage.jsx`**

Update "Apply" and "Save" button handlers:
```javascript
const handleApplyClick = (job) => {
  if (!user) {
    // Check for beta access before triggering auth
    if (localStorage.getItem('betaAccessGranted') !== 'true') {
      setShowAccessGate(true);
      setPendingAction({ type: 'apply', jobId: job.id });
    } else {
      setShowAuthFlow(true);
      localStorage.setItem('pendingAction', JSON.stringify({
        type: 'apply',
        jobId: job.id,
        timestamp: Date.now()
      }));
    }
  } else {
    // Already authenticated, proceed with apply
    handleApply(job.id);
  }
};
```

### 5. Files to Modify

**New Files:**
- `client/src/components/BetaAccessGate.jsx` - Access gate modal component

**Modified Files:**
- `client/src/components/Navbar.jsx` - Intercept login buttons
- `client/src/components/EmployeeNavbar.jsx` - No changes (authenticated users already have access)
- `client/src/components/EmployerNavbar.jsx` - No changes (authenticated users already have access)
- `client/src/EmployeePages/EmployeeJobsPage.jsx` - Intercept Apply/Save when not authenticated
- `client/.env` - Add VITE_BETA_ACCESS_CODE
- `client/.env.example` - Add VITE_BETA_ACCESS_CODE template

**Optional (if gating other entry points):**
- `client/src/pages/LandingPage.jsx` - Update "Get Started" button to check access

---

## Technical Considerations

### Access Code Storage Strategy

**Option 1: Environment Variable (Recommended for MVP)**
- Store single code in `VITE_BETA_ACCESS_CODE`
- **Pros:** Simple, no backend changes, easy to update
- **Cons:** Same code for everyone, if leaked must change for all users
- **Distribution:** Manual email to funders/partners

**Option 2: Backend Validation (Future Enhancement)**
- Create `beta_access_codes` table with columns: code, email, created_at, used_at
- API endpoint: `POST /api/beta-access/validate`
- **Pros:** Unique codes per user, can track usage, can revoke
- **Cons:** Requires database migration, API endpoint
- **Distribution:** Automated email when requested

**Recommendation:** Start with Option 1 (env var), migrate to Option 2 later if needed.

### Security Notes
- Access code is client-side only (not cryptographically secure)
- Purpose is to discourage casual users, not prevent determined actors
- Code will be visible in client-side JS (acceptable for this use case)
- For true security, would need backend validation with unique tokens

### localStorage Key
```javascript
// Key: betaAccessGranted
// Value: 'true' | null
// Cleared when: User clears browser data or logs out
```

**Should access persist after logout?**
- **Yes (recommended):** Once you have a code, you're a trusted beta user
- **No:** Forces re-entry after logout (more secure but annoying)

---

## Testing Checklist

### Without Access Code
- [ ] Landing page loads and shows demo warnings
- [ ] Can browse job search without login
- [ ] Clicking "Apply" on job shows access gate modal
- [ ] Clicking "Employee Login" shows access gate modal
- [ ] Clicking "Employer Login" shows access gate modal
- [ ] "Contact Us" button opens email to admin@lucidledger.co
- [ ] "I Have An Access Code" shows input field
- [ ] Invalid code shows error message
- [ ] Valid code stores in localStorage and proceeds to Dynamic Labs

### With Access Code
- [ ] Can trigger Dynamic Labs authentication
- [ ] Can complete employee registration
- [ ] Can complete employer registration
- [ ] Can apply to jobs
- [ ] Can save jobs
- [ ] Demo banners still visible
- [ ] Access persists after page refresh
- [ ] Access persists after logout (if desired)

### Edge Cases
- [ ] What happens if user enters code mid-session?
- [ ] What happens if code is changed in env var?
- [ ] What happens if localStorage is cleared?
- [ ] What happens if user is already authenticated?

---

## Future Enhancements

### Phase 2: Backend Validation
1. Create `beta_access_codes` database table
2. Generate unique codes per email
3. Add API endpoint for validation
4. Track code usage and analytics
5. Add admin panel to manage codes

### Phase 3: Automated Access Request
1. "Request Beta Access" form on landing page
2. Collects: email, organization, use case
3. Sends email to admin@lucidledger.co
4. Admin can approve/generate code via dashboard
5. Automated email sends code to requester

### Phase 4: Tiered Access
- **Tier 1 (View Only):** Browse jobs, no apply
- **Tier 2 (Employee Beta):** Can apply to jobs
- **Tier 3 (Employer Beta):** Can post jobs
- **Tier 4 (Full Partner):** All features + analytics

---

## Code Distribution Strategy (To Decide)

### Manual Distribution (Phase 1)
- Admin receives inquiry email
- Manually sends code via email reply
- Tracks codes in spreadsheet
- **Pros:** Full control, personal touch
- **Cons:** Manual work, doesn't scale

### Automated Distribution (Phase 2)
- User fills out "Request Access" form
- System auto-generates unique code
- Sends email with code automatically
- **Pros:** Scales, faster turnaround
- **Cons:** Less filtering, could get spam

### Hybrid Approach (Recommended)
- User fills out form → Notifies admin
- Admin reviews → Clicks "Approve"
- System sends code automatically
- **Pros:** Balanced, scales with oversight
- **Cons:** Requires admin panel

---

## Example Code Snippets

### BetaAccessGate.jsx (Basic Structure)
```javascript
import React, { useState } from 'react';

const BetaAccessGate = ({ isOpen, onClose, onAccessGranted, pendingRole }) => {
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const validCode = import.meta.env.VITE_BETA_ACCESS_CODE;

    if (code.trim() === validCode) {
      localStorage.setItem('betaAccessGranted', 'true');
      onAccessGranted();
    } else {
      setError('Invalid code. Please contact admin@lucidledger.co');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-8">
        {/* Modal content here */}
      </div>
    </div>
  );
};

export default BetaAccessGate;
```

### Environment Variable Usage
```javascript
// Checking access
const hasAccess = localStorage.getItem('betaAccessGranted') === 'true';

// Validating code
const validCode = import.meta.env.VITE_BETA_ACCESS_CODE;
const isValid = userInputCode === validCode;
```

---

## Related Configuration

This feature works alongside the existing **Demo Mode** toggle:

- `VITE_DEMO_MODE=true` → Controls demo warnings/banners
- `VITE_BETA_ACCESS_CODE=xxx` → Controls who can login

Both can be used together:
- Demo mode ON + Access gate ON = Current desired state
- Demo mode OFF + Access gate ON = Clean UI but still gated
- Demo mode OFF + Access gate OFF = Full production

---

## Timeline Estimate

**Phase 1 (MVP):**
- Create BetaAccessGate component: 30 min
- Modify Navbar login handlers: 20 min
- Update EmployeeJobsPage apply buttons: 15 min
- Add environment variable and docs: 10 min
- Testing: 30 min
- **Total: ~2 hours**

**Phase 2 (Backend Validation):**
- Database migration: 20 min
- API endpoint: 30 min
- Update frontend to call API: 20 min
- Testing: 30 min
- **Total: ~2 hours**

---

## Questions to Resolve Before Implementation

1. **Should access code persist after logout?** (Recommend: Yes)
2. **Should we gate both employee AND employer login?** (Recommend: Yes)
3. **Should "Get Started" button on landing page also check for access?** (Recommend: Yes)
4. **What should happen if code is changed in production?** (Users need to re-enter)
5. **Should we log access attempts?** (Not in Phase 1, add in Phase 2)

---

## Success Metrics

After implementation, we should see:
- Reduced confusion from casual visitors
- Qualified leads contacting admin@lucidledger.co
- Funders/partners can demo full functionality
- No real job applications from unauthorized users
- Demo banners still visible to beta users

---

## Documentation Updates Needed

**CLAUDE.md:**
- Add beta access gate section under "Environment Configuration"
- Document VITE_BETA_ACCESS_CODE variable
- Explain how to change/update the access code

**README.md:**
- Add note about private beta status
- Link to contact email for access

---

## Rollback Plan

If issues arise:
1. Set `VITE_BETA_ACCESS_CODE` to empty string
2. Update login handlers to skip access check if code is empty
3. Redeploy
4. Result: Back to current behavior (open login)

---

## Labels for GitHub Issue
- `enhancement`
- `ui/ux`
- `authentication`
- `priority: medium`
- `phase: 1`
