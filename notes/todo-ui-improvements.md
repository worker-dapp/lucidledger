# TODO: UI Improvements

## Admin Pages

- [x] **Add logout button to admin pages** — Added Sign Out button to header on all admin pages (Dashboard, Mediators, Deploy Factory).

- [x] **Add navigation between admin sub-pages** — Added back arrow to `/admin` on Mediators and Deploy Factory pages.

## General Auth

- [ ] **Add logout to Navbar for all roles** — Ensure there's a visible logout option in the user dropdown/menu for employees, employers, and mediators.
- [x] **Add login button to Mediator page** — The `/resolve-disputes` page now shows a login button when user is not authenticated.
- [x] **Add logout to Mediator page** — The `/resolve-disputes` page now has a Sign Out button in the header.

## Job Tracker (Worker Side)

- [ ] **Display disputes in Job Tracker** — The Disputes field/section should show active disputes when a worker files one. Currently may not display anything after dispute is filed.

## Future Considerations

- [ ] **Session timeout** — Consider adding automatic logout after inactivity period for security.
