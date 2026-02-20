# Mediator Dispute History

## Feature

Add a history of resolved disputes to both the mediator and admin views.

### Mediator Resolution Page (`/resolve-disputes`)

- Show a "Resolved Disputes" section below the pending disputes list
- Each entry: job title, worker/employer names, resolution outcome (worker %, employer %), amount, date resolved, tx hash link
- Gives mediators a record of their past decisions

### Admin Mediators Page (`/admin/mediators`)

- Show dispute history per mediator (expandable or linked from the mediator list)
- Columns: mediator name, job title, worker, employer, outcome, amount, date
- Useful for tracking mediator performance and identifying patterns
- The `dispute_history` table already exists in the DB for this data

### Existing Infrastructure

- `dispute_history` table and `DisputeHistory` model already exist
- `PaymentTransaction` records are created on resolution
- `DeployedContract` tracks `mediator_id` and final status
- Data is available — just needs frontend views
