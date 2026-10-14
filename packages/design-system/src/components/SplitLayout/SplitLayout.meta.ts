import { defineComponentMeta } from '../../meta.ts';
import type { SplitLayoutProps } from './SplitLayout.tsx';

export const splitLayoutMeta = defineComponentMeta<SplitLayoutProps>()({
  name: 'SplitLayout',
  category: 'layout',
  description:
    'Two panes side by side (list | viewer, document | coding sidebar). Collapses with container queries, so it adapts to the slot a micro frontend is given rather than the viewport.',
  props: {
    start: { type: 'ReactNode', description: 'First pane (left in LTR).', required: true },
    end: { type: 'ReactNode', description: 'Second pane.', required: true },
    fixedPane: { type: "'start' | 'end'", description: 'Pane with a fixed width.', default: "'end'" },
    fixedWidth: { type: 'string', description: 'CSS width of the fixed pane.', default: "'340px'" },
    gap: { type: '0 | 1 | 2 | 3 | 4 | 5 | 6 | 8', description: 'Gap token.', default: '3' },
    collapseBelow: { type: "'sm' | 'md' | 'lg'", description: 'Container width (600/760/960px) below which panes stack.', default: "'md'" },
  },
  accessibility: ['Source order equals visual order in both layouts, so keyboard and screen-reader order stay logical.'],
  do: ['Put each pane inside a Panel so it is a labelled region.'],
  dont: ['Do not use viewport media queries inside micro frontends; use this or container queries.'],
  example: `<SplitLayout start={<DocumentPanel />} end={<CodingPanel />} fixedWidth="340px" />`,
});
