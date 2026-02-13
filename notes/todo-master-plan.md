# Master Plan: Post-Refactor Improvements

## Work Item Triage

### Category 1: Bug Fixes

| Item | Priority | Effort | Source |
|------|----------|--------|--------|
| Multi-position job visibility (job disappears after 1st hire) | **High** | ~2 hrs | `todo-fix-multi-position-job-visibility.md` |
| Idle timeout logout (warning fires but logout never happens) | **Medium** | ~30 min | `todo-fix-idle-timeout-logout.md` |

### Category 2: UI / UX Improvements

| Item | Priority | Effort | Source |
|------|----------|--------|--------|
| Remaining UI tweaks (nav link update, oracle reorder, admin enlargement, positions language, reject warning modal) | **Low** | ~1-2 hrs | `todo-ui-improvements.md` |
| Worker profile buildout (languages, availability, profile tiers) | **Medium** | ~3-4 hrs | `todo-worker-profile-buildout.md` |
| Worker earnings enhancements (filtering, grouping) | **Low** | ~2-3 hrs | `todo-worker-earnings-page.md` |

### Category 3: Feature Build (Compliance Hub)

| Item | Priority | Effort | Source |
|------|----------|--------|--------|
| Phase 1: Tab consolidation (Disputes + Completed Contracts) | **High** | ~2-3 hrs | `todo-compliance-hub-buildout.md` |
| Phase 2: Audit log system (DB + backend + frontend) | **Medium** | ~3-4 hrs | same |
| Phase 3: Reports & exports (CSV generation) | **Low** | ~4-6 hrs | same |

### Category 4: Infrastructure / DevOps

| Item | Priority | Effort | Source |
|------|----------|--------|--------|
| Upgrade Docker Compose v1 → v2 | **Medium** | ~30 min | `todo-upgrade-docker-compose.md` |
| Update DB reset script (add missing tables) | **Medium** | ~30 min | `todo-update-db-reset-script.md` |
| Switch BaseScan → Blockscout | **Low** | ~15 min | `todo-switch-basescan-to-blockscout.md` |

### Category 5: Documentation

| Item | Priority | Effort | Source |
|------|----------|--------|--------|
| Rewrite CLAUDE.md (Dynamic→Privy, factory, mediator, admin) | **High** | ~3-4 hrs | `todo-update-docs.md` |
| Rewrite root README.md | **Medium** | ~2-3 hrs | `todo-update-readme.md` |
| Update remaining docs (DB_RESET, ENV_SETUP, CI_CD, etc.) | **Medium** | ~2-3 hrs | `todo-update-docs.md` |

---

## Branch Strategy

### Branch 1: `fix/bugs-and-quick-wins` (Do first — ~3 hrs)
Quick, low-risk fixes that clean up known issues:
- Fix multi-position job visibility bug
- Fix idle timeout logout
- Update DB reset script (add missing tables)
- Switch BaseScan → Blockscout (GitHub variable change + redeploy)
- Remaining UI tweaks from `todo-ui-improvements.md`

**Rationale:** All small, independent, low-blast-radius. Gets the codebase stable before layering features.

### Branch 2: `docs/full-rewrite` (~5-6 hrs)
- Rewrite CLAUDE.md
- Rewrite root README.md
- Update DATABASE_RESET.md, ENVIRONMENT_SETUP.md, CI_CD_SETUP.md, SMART_CONTRACT_SECURITY.md

**Rationale:** Docs-only branch, zero code risk, but high value for contributor onboarding. Can be done in parallel with other branches since it doesn't touch app code.

### Branch 3: `infra/docker-compose-upgrade` (~30 min)
- Update deploy.yml (`docker-compose` → `docker compose`)
- Test on EC2

**Rationale:** Tiny change but touches CI/CD, so isolate it. Merge + deploy independently to verify nothing breaks.

### Branch 4: `feature/compliance-hub` (~10-13 hrs → GitHub issue)
- Phase 1: Tab consolidation
- Phase 2: Audit log system
- Phase 3: Reports & exports

**Rationale:** Largest body of work. Multi-phase, touches DB migrations, new controllers, new frontend components. Deserves its own feature branch and should be sequenced over multiple sessions.

### Branch 5: `feature/worker-profile-v2` (~3-4 hrs → GitHub issue)
- Add language/availability fields
- Profile completeness indicator
- Onboarding simplification (make street address optional)

**Rationale:** Moderate scope, touches DB schema + onboarding flow. Worth a separate branch to keep diffs reviewable.

---

## Execution Order

**Do now (near-term):**
- Branch 1 (bugs + quick wins) — highest value-per-hour
- Branch 2 (docs) — can be done in parallel, no code conflict
- Branch 3 (docker compose) — trivial, merge fast

**Create GitHub issues and sequence later:**
- Branch 4 (Compliance Hub) — multi-session feature
- Branch 5 (Worker Profile v2) — moderate effort, can wait
- Worker earnings enhancements — low priority, current state is sufficient
