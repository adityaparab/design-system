# ADR 0004: Failure isolation and observability for remotes

**Status:** accepted

## Context

A micro-frontend architecture is only as reliable as its weakest remote unless failures are contained. A remote can
fail in three distinct ways, and each needs its own response:

| Failure | Example | Handling |
| --- | --- | --- |
| Fetch | Bad deploy, CDN outage, wrong URL in the registry | `RemoteSlot` catches the `loadRemote` rejection, shows a retryable fallback, and `resetRemote()` clears the runtime cache so Retry really refetches |
| Contract | Remote built for contract 2.x, shell on 1.x | Refused before mounting; info state, no retry (it would fail the same way) |
| Render | Bug throws during render | Per-remote error boundary; resets when the document id changes; Retry remounts |

## Decision

- Every remote mounts through `RemoteSlot` (shell). Load has a 10 s timeout.
- Event subscribers are isolated too: `createEventBus` catches a throwing handler so one remote cannot break another's events.
- Every error goes to telemetry with `remote`, `buildId`, `phase` and the component stack, so an incident can be traced
  to the deploy that caused it. The shell also records load time per remote.
- Failure drills are first-class (`?simulate=viewer-crash | remote-offline | contract-mismatch`) and covered by E2E tests.

## Consequences

- Plus: the review list keeps working in all three drills, as the E2E tests assert.
- Plus: fallback copy is user-facing; raw runtime errors sit behind "Technical details" for support staff.
- Production next steps: on-call alerts on error rate per `remote@buildId`, automated rollback via the remote registry,
  and SLOs for remote availability and load time.
