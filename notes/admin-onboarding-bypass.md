# Admin Onboarding Bypass

## Problem

When an admin user (e.g. `emmanuel.teitelbaum@gmail.com`) navigates to `/` (employee landing page) while authenticated, App.jsx's `checkProfileAndRedirect` looks up their wallet in the employee table, finds no profile, and redirects to `/user-profile` (onboarding).

Admin isn't a separate role in the routing system — it's just an email check on specific API endpoints. So admin users without an employee profile get stuck in onboarding when hitting the employee side of the app.

## Fix

In `App.jsx`'s `checkProfileAndRedirect`, check if the user's email is in `ADMIN_EMAILS` (would need a lightweight admin-check endpoint or pass admin emails to the client). If so, skip the onboarding redirect and let them stay on the landing page or redirect to `/admin`.

Alternatively, add an admin-specific route that doesn't require an employee/employer profile check.

## Workaround (Current)

Navigate directly to `/admin/mediators` or `/admin/employers` instead of going through `/`.
