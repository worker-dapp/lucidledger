# Deferred Bugs & Feature Notes

Quick-capture notes for issues and features that need attention but aren't yet assigned to a milestone.

---

## Bugs

### Auto-logout not triggering after idle timeout

**Location:** `client/src/components/IdleTimeoutWarning.jsx` (or equivalent)
**Symptom:** The idle-timeout warning modal appears correctly after ~13 minutes of inactivity, but the automatic logout does not execute when the countdown expires. The user is shown the modal but remains logged in.
**Expected:** After the 2-minute warning countdown, `logout()` should fire automatically.
**Observed on:** Employer side — unconfirmed whether the same issue exists on the employee side. May also be browser-specific (needs testing across Chrome/Safari/Firefox).
**To investigate:**
- Check if `IdleTimeoutWarning` is rendered in the employer layout but a different instance (or none) is used on the employee side — behaviour difference could point to a mounting/context issue
- Check whether the countdown timer's `onExpire` / timeout callback is actually calling `logout()`
- Check if the modal's unmount or backdrop interaction is clearing the timer prematurely
- Confirm `logout()` from `useAuth` is being called (not just UI dismissed)
- Test in multiple browsers to rule out browser-specific timer throttling (browsers throttle `setTimeout` in background tabs)

---

## Deferred Features

### Worker wallet balance — intentionally not exposed

The USDC smart wallet balance is **not shown** to workers in the earnings tab. Workers are paid out in fiat via a third-party money service business (MSB), so the on-chain wallet is purely a transient settlement pipe and should never carry a meaningful balance. Surfacing it would imply workers should manage funds there, which conflicts with the legal/UX intent.

If autosweep (#49) is implemented, this remains correct — balance stays near zero after each sweep.

If a manual escape hatch is ever needed for workers with residual balances, scope it separately and keep it out of normal earnings UX.

---

### Contract Library — Edit Template Functionality

**Location:** `client/src/EmployerPages/ContractFactory/ContractLibrary.jsx`
**Context:** The Contract Library tab lets employers save and reuse contract templates. Currently there is no edit functionality for saved templates — employers can create and presumably delete, but cannot modify an existing template.
**What to build:**
- Edit button per template row that opens the template creation form pre-populated with the existing template's data
- `PUT /api/contract-templates/:id` route (check if already exists on the backend)
- Confirm whether the employer can edit a template that has been used in active/completed deployments (probably yes — templates are copied at deployment time, not referenced live, so editing is safe)
- Consider a "last edited" timestamp on the template card

---
