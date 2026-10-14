# Changesets

Every change to a versioned package (`@verity/design-system`, `@verity/contracts`) needs a changeset:

```bash
pnpm changeset
```

Pick the package, the bump (`patch` for fixes, `minor` for additive API, `major` for anything that breaks
consumers) and write the release note for the teams that consume it. CI fails a pull request that changes
these packages without one. `pnpm version-packages` applies pending changesets and writes CHANGELOGs.

Apps are private and not published; they are versioned by deploy, not by changesets.
