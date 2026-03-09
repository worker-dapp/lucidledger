# Audit Log Reliability

**Created:** 2026-03-07
**Related:** Issue #47 (security hardening), compliance hub (#52)

## Current Behavior

`logAction()` in `server/controllers/auditLogController.js` catches all errors silently and logs them via `console.error`. Audit failures are non-blocking by design — they never surface to the user or interrupt the main operation.

## Why This Is Acceptable (For Now)

- The blockchain is the primary source of truth for payments and contract deployments — immutable and auditable independently of our DB.
- A transient DB write failure should never cause an employer to see an error screen when their actual operation succeeded.
- Errors are still recorded in server logs via `console.error`, so they're not invisible.

## The Gap

If `logAction` fails repeatedly and server logs aren't monitored, audit trail gaps accumulate silently. This is a compliance risk if gaps are discovered during an external audit.

## Prerequisite to Address First

**Check whether server log monitoring is in place** (e.g. CloudWatch, Datadog, Logtail, or equivalent). If not, that's the baseline fix — audit failures are only non-problematic if someone is watching the logs.

## Future Enhancement

A dead-letter queue or retry mechanism for failed audit writes would be the production-grade solution. Failed `logAction` calls could be queued and retried, with alerting if the queue backs up.

Consider adding to #47 or opening a new issue targeting v0.3.0.
