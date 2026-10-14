# ADR 0005: Design tokens and multi-tenant theming

**Status:** accepted

## Context

Each tenant (law firm, corporate legal team) wants its brand. Building one bundle per tenant does not scale, and
colour changes must not break accessibility.

## Decision

- Tokens are written in the **W3C DTCG** format: primitives (`primitive.color.brand.600`) and semantic tokens
  (`color.accent.default → {primitive.color.brand.600}`). Components may only use **semantic** tokens.
- `scripts/build-tokens.ts` emits CSS custom properties. Semantic tokens keep their alias as `var(--vds-color-brand-600)`
  and are declared on `:root, [data-tenant]`, so they **re-resolve inside every tenant scope**. A tenant file lists only
  overrides (Northwind: teal brand, rounder radii, 44 px grid rows).
- The same build emits `tokens.json`, read by Storybook's token page, by tests and by the MCP server.
- Guardrails run as unit tests: WCAG contrast for key pairs in **every** tenant, no raw colours in component CSS,
  and only `vds-` class selectors in component CSS (so the design system cannot restyle markup owned by a remote).
- The DataGrid reads `--vds-size-grid-row` at runtime, so tenant density changes keep the virtual-scroll maths right.

## Consequences

- Plus: switching tenant is one attribute; no rebuild, no flash of a second stylesheet.
- Plus: a tenant colour that fails contrast fails CI before it ships.
- Minus: custom properties referencing custom properties are easy to get wrong (they resolve where declared). That is
  why semantic tokens are declared on every `[data-tenant]` scope, not only on `:root`.
- Production next step: sync primitives from Figma variables (Style Dictionary or Tokens Studio) into the same JSON.
