# ADR 0001: Module Federation 2.0 on Vite, with runtime-registered remotes

**Status:** accepted

## Context

Several teams ship parts of one review workspace. Each team needs to deploy on its own schedule, and the
workspace needs one React instance, one design system and one session. Options:

| Option | Independent deploy | Shared React/DS | Isolation | Cost |
| --- | --- | --- | --- | --- |
| Build-time packages (monorepo libs) | No: shell rebuild per change | Yes | None | Lowest |
| iframes | Yes | No | Strong (separate documents) | Poor UX, duplicated runtime, a11y and focus issues across frames |
| single-spa + import maps | Yes | Via import map | Lifecycle-level | Framework-agnostic, more glue code |
| **Module Federation 2.0** | **Yes** | **Yes, with semver negotiation** | Error boundaries + contract checks | Runtime share scope to understand |

## Decision

- Use `@module-federation/vite` (MF 2.0 runtime) so the whole repo stays on one toolchain: Vite builds, Vitest tests and Storybook.
- The shell declares **no remotes at build time**. At boot it fetches `/remotes.json` and calls `registerRemotes()`.
  Promoting or rolling back a remote is a manifest change, not a shell release.
- Remotes expose one module each with the shape `RemoteModule<P> = { meta, Component }` (see ADR 0003).
- The **share policy** (singletons, version ranges) lives in `packages/build-config`, not in each app.

## Consequences

- Plus: independent deploys and rollbacks; each remote costs about 9 KB brotli on top of shared dependencies (`pnpm size`).
- Plus: dev and production preview both work. Verified in a spike before building features, the riskiest assumption.
- Minus: the shell can't type-check a remote it only meets at runtime. Mitigated by the contract package and a runtime compatibility check.
- Minus: shared-dependency negotiation is invisible unless surfaced, so the shell's Platform page shows the live share scope.
- Rejected: iframes, because focus management and screen-reader continuity across frames would hurt a keyboard-first, accessibility-critical product.
