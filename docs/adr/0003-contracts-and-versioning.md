# ADR 0003: A versioned contract between the shell and remotes

**Status:** accepted

## Context

With runtime composition, the shell and a remote can be built months apart. A prop renamed in the shell would
otherwise surface as a runtime crash in production.

## Decision

- `@verity/contracts` defines everything that crosses the boundary: `PlatformContext` (session, API base URL,
  navigate, events, telemetry), per-remote props, the typed event map, and the `RemoteModule` shape.
- `CONTRACT_VERSION` follows semver. Additive changes (a new optional prop, a new event) are **minor**; anything else is **major**.
- Each remote reports the contract version it was **built** against. Before mounting, the shell runs
  `checkContractCompatibility(remote, host)`:
  - different major: refuse;
  - remote minor newer than host: refuse ("deploy the shell first");
  - otherwise: mount (the host provides a superset).
- Remotes integrate through **props, events and the URL** only. They never import the shell or each other (ESLint rule).
  Example: the viewer emits `review.advance`; the list decides what "next" means and asks the shell to route.
- Versioned packages (`design-system`, `contracts`) use **changesets**; CI requires one on pull requests that touch them.

## Consequences

- Plus: incompatible deploys fail closed with a clear message (drill: `?simulate=contract-mismatch`) instead of a crash.
- Plus: release order is explicit: shell first for new capabilities, remotes first for removals.
- Minus: contract changes need discipline and review; that is the point.
- Considered: sharing a global store (Redux) across remotes. Rejected because it couples release cycles through shared state shape.
