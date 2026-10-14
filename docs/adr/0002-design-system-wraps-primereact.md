# ADR 0002: The design system wraps PrimeReact 10 (unstyled + pass-through)

**Status:** accepted

## Context

PrimeReact gives us accessible, keyboard-complete behaviour (DataTable roving focus, Dialog focus trap, native
radios) that is expensive to rebuild. But:

- Product teams importing `primereact` directly couples hundreds of call sites to its API and its styling.
- PrimeReact 11 (July 2026) is a ground-up rewrite into composable primitives (`Select.Root`, `Select.Trigger` …)
  under a new commercial PrimeUI licence that needs a key. PrimeReact 10.9 stays MIT.

## Decision

- Wrap PrimeReact **10.9 in unstyled mode** and style it entirely through **pass-through (PT) class hooks** and our tokens.
- Each wrapper exposes a **narrower, owned API**. For example, `DataGrid` takes `columns` as data, controlled sort
  and `onVisibleRangeChange` for windowed loading, and hides `<Column>` children, selection modes and `lazy` flags.
- Not everything wraps PrimeReact: `Panel`, `Stack`, `Meter`, `StatusTag`, `SplitLayout` are small enough to own outright.
- Product code may not import `primereact` (ESLint `no-restricted-imports`); icons are re-exported from the design system.

## Consequences

- Plus: the v10 → v11 migration happens inside `packages/design-system`, component by component, behind a stable public API.
- Plus: every visual decision is a token, so tenants re-theme without forking components.
- Minus: we own all the CSS, including structural rules PrimeReact ships only in styled mode (the virtual scroller's positioning, for example).
- Minus: wrappers lag new PrimeReact features; teams request them through the design-system backlog.
- Found while building: in a virtualized DataTable, PT `context.index` is window-relative. The wrapper adds the
  scroller's first index so `aria-rowindex` is absolute, and drops `dataKey` so placeholder rows don't share a React key.
