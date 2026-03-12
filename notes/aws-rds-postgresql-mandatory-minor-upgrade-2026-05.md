# AWS RDS PostgreSQL Mandatory Minor Upgrade Notice (May 2026)

## Summary
AWS sent a health notice indicating one or more RDS PostgreSQL instances in our AWS account are on minor versions that are reaching end of standard support.

Key dates from AWS notice:
- **May 1, 2026**: Cannot create new RDS instances on the listed old minor versions.
- **May 31, 2026**: End of standard support for those minor versions.
- **After May 31, 2026**: AWS will automatically upgrade affected instances during a maintenance window.

AWS target versions mentioned:
- PostgreSQL 14 -> 14.20 (or higher)
- PostgreSQL 15 -> 15.15 (or higher)
- PostgreSQL 16 -> 16.11 (or higher)
- PostgreSQL 17 -> 17.7 (or higher)

## Does this apply to this repository?
Short answer: **indirectly yes, directly no**.

- This repository uses PostgreSQL and is designed to run against AWS RDS in production.
- The application code does **not** pin a specific PostgreSQL *minor* version.
- Therefore, impact is determined by the **actual RDS instance versions in AWS**, not by source code alone.

Code references:
- Local dev DB image uses PostgreSQL 15: [`docker-compose.yml`](../docker-compose.yml)
- Production DB is external via environment variables and RDS-style host config: [`server/config/database.js`](../server/config/database.js), [`server/.env.example`](../server/.env.example)

## What is actually happening
This is an **infrastructure lifecycle event** from AWS, not a feature or security alert specific to our code.

If we do nothing:
- AWS will eventually perform a mandatory minor upgrade in a maintenance window.
- There will be downtime during the upgrade.
- The timing is constrained by AWS windows rather than our preferred release timing.

## Recommended plan
1. **Inventory affected DBs**
   - Open AWS Health Dashboard -> Affected resources.
   - Record each DB instance, environment (prod/staging/dev), engine version, and maintenance window.

2. **Choose target versions now**
   - Keep same major version, move to current supported minor target suggested by AWS.
   - Avoid waiting for forced upgrade windows.

3. **Test in staging first**
   - Upgrade a staging instance first.
   - Run application smoke tests: auth, core CRUD flows, contract creation, dispute workflows, reporting endpoints, and migrations.

4. **Prepare production change window**
   - Snapshot production DB immediately before upgrade.
   - Confirm rollback/restore steps and access.
   - Notify stakeholders of planned maintenance.

5. **Execute controlled production upgrade**
   - Run manual minor upgrade in planned window.
   - If downtime sensitivity is high, use RDS Blue/Green Deployment to reduce cutover interruption.

6. **Post-upgrade validation**
   - Verify API health endpoints.
   - Check error logs and DB connection stability.
   - Validate critical business flows and background jobs.

## Operational checklist (quick)
- [ ] AWS Health affected resources exported and tracked
- [ ] Target version selected for each instance
- [ ] Staging upgraded and validated
- [ ] Pre-upgrade snapshot taken
- [ ] Maintenance comms sent
- [ ] Production upgraded manually
- [ ] Post-upgrade smoke tests passed
- [ ] Monitoring/log review complete

## Notes for this codebase
Because Sequelize + PostgreSQL usage here is standard (no pinned minor-specific SQL behavior observed in config), compatibility risk is usually low for minor upgrades. The bigger risk is **downtime timing** and **operational readiness**, not code breakage.
