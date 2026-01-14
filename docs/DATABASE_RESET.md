# Database Reset Guide

This guide explains how to clear the database for testing the full login/onboarding flow.

## Quick Reset

### 1. Clear the Database

Run the reset script inside the Docker container:

```bash
docker compose exec backend npm run db:reset
```

This will truncate all tables (`employees`, `employers`, `jobs`, `job_applications`, `saved_jobs`) and reset auto-increment IDs.

### 2. Clear Browser Storage

Open your browser's DevTools (F12 or Cmd+Option+I) → Console tab, then run:

```javascript
localStorage.clear()
```

This clears persisted user role and other auth-related data.

### 3. Clear Service Worker & Caches (if needed)

If you encounter routing issues or stale pages after reset, run this in the DevTools console to fully clear the browser cache:

```javascript
navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
localStorage.clear();
location.reload();
```

This will:
- Unregister any service workers (Workbox PWA cache)
- Delete all browser caches
- Clear localStorage
- Reload the page

### 4. Refresh the Page

Hard refresh the page (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows) to ensure all cached state is cleared.

---

## What Gets Cleared

### Database Tables
- `employees` - Employee profiles
- `employers` - Employer profiles  
- `jobs` - Job listings
- `job_applications` - Applications to jobs
- `saved_jobs` - Saved/bookmarked jobs

### Browser localStorage
- `userRole` - Current active role (employee/employer)
- `persistedUserRole` - Last used role across sessions
- `pendingRole` - Role selected before authentication
- `pendingAction` - Pending job actions (apply/save)

---

## Running Outside Docker

If running the server directly (not in Docker):

```bash
cd server
npm run db:reset
```

---

## Troubleshooting

### "Table does not exist" errors
The script handles missing tables gracefully. If some tables don't exist yet, it will skip them and continue.

### Still seeing old data after reset
1. Make sure you cleared localStorage
2. Try an incognito/private window
3. Check that you're connected to the correct database (dev vs prod)

### Permission denied
Make sure the database user has TRUNCATE permissions on all tables.
