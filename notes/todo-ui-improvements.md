# TODO: UI Improvements

## Admin Pages

- [x] **Add logout button to admin pages** — Added Sign Out button to header on all admin pages (Dashboard, Mediators, Deploy Factory).

- [x] **Add navigation between admin sub-pages** — Added back arrow to `/admin` on Mediators and Deploy Factory pages.

## General Auth

- [x] **Add logout to Navbar for all roles** — `LogoutButton` component added to `EmployerNavbar.jsx`, `EmployeeNavbar.jsx`, and `EmployerLayout.jsx`. Mediator page also has its own Sign Out button.
- [x] **Add login button to Mediator page** — The `/resolve-disputes` page now shows a login button when user is not authenticated.
- [x] **Add logout to Mediator page** — The `/resolve-disputes` page now has a Sign Out button in the header.

## Job Tracker (Worker Side)

- [x] **Display disputes in Job Tracker** — Full dispute section added: filters for `status === "disputed"`, shows dispute reason, includes "Raise Dispute" modal with on-chain filing via `raiseDispute()` and dispute history records.

## Employer Navigation

- [ ] **Update EmployerLayout nav link** — When Compliance Hub is built, change the "Compliance" nav link in `EmployerLayout.jsx` from `/dispute` to `/compliance`.

## Employer Landing Page

- [x] **Oracle advert** Reordered to: Manual, Time Clock, Image, Weight, GPS, Custom.

## Admin Employer Review

- [x] **Profile display size** -- Replaced `line-clamp-3` with scrollable container (`max-h-40 overflow-y-auto`) on company description in AdminEmployers.jsx.

## Positions to Fill

- [x] **Enter 1 for single hire, or 50+ for bulk hiring** -- Changed to "Enter the number of workers you need for this role".

## Worker Contract Rejection

- [ ] **Worker rejects contract, gets warning?** -- What happens when the worker rejects an offer. Does a modal appear warning them that they are about to reject the contract? Could be good as a failsafe. 

## Future Considerations

- [x] **Session timeout** — Idle timeout exists (`useIdleTimeout` hook). Logout-on-expiry bug fixed in `fix/bugs-and-quick-wins` branch.


