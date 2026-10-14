import { defineComponentMeta } from '../../meta.ts';
import type { PanelProps } from './Panel.tsx';

export const panelMeta = defineComponentMeta<PanelProps>()({
  name: 'Panel',
  category: 'layout',
  description: 'Titled surface for a region of a screen (document list, viewer, coding form).',
  props: {
    title: { type: 'string', description: 'Region title; becomes the accessible name of the section.', required: true },
    children: { type: 'ReactNode', description: 'Body content.', required: true },
    actions: { type: 'ReactNode', description: 'Header actions (buttons, segmented controls).' },
    headingLevel: { type: '2 | 3', description: 'Heading level of the title.', default: '2' },
    flush: { type: 'boolean', description: 'No body padding (for grids).', default: 'false' },
    fill: { type: 'boolean', description: 'Fill parent height; body scrolls.', default: 'false' },
    className: { type: 'string', description: 'Layout escape hatch.' },
  },
  accessibility: ['Renders <section aria-labelledby>, so screen-reader users can jump between panels as regions.'],
  do: ['Give every panel a short, unique title.'],
  dont: ['Do not nest panels more than one level.'],
  example: `<Panel title="Documents" flush fill actions={<Button size="sm">Export</Button>}>{grid}</Panel>`,
});
