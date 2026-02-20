# UI: Button Accessibility & Cross-Side Consistency

## Problems

1. **Color-only differentiation**: Action buttons use red/green as the primary visual signal (e.g. "Approve" in green, dispute/refund actions in red). Red-green color blindness affects ~8% of males. WCAG requires color not be the sole means of conveying information.

2. **Employer vs. employee style mismatch**: Employer buttons (WorkforceDashboard) use solid fills (`bg-green-600`, `bg-yellow-500`, `bg-blue-600`). Employee buttons (JobTracker) use soft tints (`bg-yellow-100 text-yellow-800`). They look like two different apps.

## Affected Files

- `client/src/EmployerPages/WorkforceDashboard.jsx`
- `client/src/EmployeePages/JobTracker.jsx`
- `client/src/pages/MediatorResolution.jsx`
- Any other pages with action buttons

## Proposed System

Use the site's existing brand palette consistently across both sides:

| Action type | Style | Use case |
|---|---|---|
| Primary action | `bg-[#0D3B66] text-white` (navy, solid) | Approve & Pay, Confirm Top Up, Resolve Dispute |
| Warning action | `bg-[#EE964B] text-white` (orange, solid) | Raise Dispute |
| Secondary/additive | `border border-[#0D3B66] text-[#0D3B66]` (navy, outlined) | Top Up Escrow, secondary confirms |
| Destructive/final | `bg-gray-700 text-white` (dark gray, solid) | irreversible actions where orange feels wrong |
| Cancel/dismiss | `bg-gray-100 text-gray-700` (soft gray) | modal cancel buttons |

All buttons already have icons + text labels, which satisfies WCAG's requirement that meaning not rely on color alone. The above changes are purely about visual consistency and color choice.

## Notes

- Solid buttons should be used consistently on both employer and employee sides — drop the soft tint style from JobTracker
- The mediator resolution slider UI (added in PR 4) already uses `bg-[#0D3B66]` for its single resolve button — use this as the reference pattern
- Do not use red (`bg-red-*`) for any action button; orange covers the warning use case accessibly
- This is purely cosmetic — no logic changes needed

## Copy Changes

- `client/src/EmployerPages/ContractFactory/ApplicationReviewTab.jsx`: Change "Accept Selected" → **"Make Offer"** and "Reject Selected" → **"Reject"**. "Accept" implies a final decision; "Make Offer" better reflects that the employer is extending an offer the worker still needs to sign.

## Priority

Low — non-blocking, no functional impact. Do as a standalone UI polish PR after current feature work settles.
