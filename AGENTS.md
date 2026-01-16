# Repository Guidelines

## Project Structure & Module Organization
- `client/` holds the React + Vite frontend (`src/components`, `src/pages`, `src/api`, `src/contracts`).
- `server/` is the Express + Sequelize backend (`controllers`, `models`, `routes`, `middleware`).
- `server/migrations/` contains SQL and helper scripts for schema changes.
- `docs/` collects deployment, CI/CD, and governance references (see `docs/README.md`).
- Docker and infra files live at the repo root (`docker-compose*.yml`, `nginx.conf`).

## Build, Test, and Development Commands
- `docker compose up --build` runs the full stack (frontend on `:5173`, API on `:5001`, Postgres on `:5432`).
- `cd client && npm run dev` starts the frontend Vite dev server.
- `cd client && npm run build` produces a production build, `npm run preview` serves it.
- `cd client && npm run lint` runs ESLint for frontend code.
- `cd server && npm start` runs the API; `npm run dev` uses nodemon.
- `cd server && npm run migrate` runs a migration file via `server/scripts/run-migration.js`.
- `cd server && npm run db:reset` resets the database using `server/scripts/resetDb.js`.

## Coding Style & Naming Conventions
- Follow existing file style; frontend uses ESLint (`client/eslint.config.js`).
- JavaScript/React: prefer `PascalCase` for components and `camelCase` for variables/functions.
- Keep module and folder names consistent with existing structure (e.g., `controllers`, `routes`).

## Testing Guidelines
- No formal test suite is configured; `server` has a placeholder `npm test`.
- Validate changes with targeted manual checks and, when relevant, run `npm run lint` in `client`.
- When adding tests, keep filenames aligned with the tool you introduce (e.g., `*.test.js`).

## Commit & Pull Request Guidelines
- Recent history uses short, imperative messages, sometimes prefixed with `Fix:` or `Revise ...`.
- Keep commits focused; mention key scope in the subject (e.g., `Fix: Forward Authorization header`).
- PRs should link relevant issues, describe behavior changes, and include screenshots for UI updates.

## Configuration & Security Notes
- Set environment variables in `server/.env` and `client/.env` as shown in `README.md`.
- For database setup or schema changes, prefer the migration files in `server/migrations/`.
