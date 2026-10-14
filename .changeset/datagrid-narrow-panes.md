---
'@verity/design-system': minor
---

- `DataGrid`: tables get a minimum width (fixed column widths plus 180px per flexible column), so a narrow
  micro-frontend slot scrolls horizontally instead of collapsing a column to zero.
- New `SplitLayout`: two-pane layout driven by container queries, so a remote adapts to the slot it is given.
- New curated icon exports (`SearchIcon`, `CheckIcon`, …) so product code never imports `primereact` directly.
