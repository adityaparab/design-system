import { defineComponentMeta } from '../../meta.ts';
import type { SegmentedControlProps } from './SegmentedControl.tsx';

export const segmentedControlMeta = defineComponentMeta<SegmentedControlProps<string>>()({
  name: 'SegmentedControl',
  category: 'forms',
  description: 'Toggle between a few mutually exclusive views or filters, e.g. Uncoded / Responsive / All.',
  wraps: 'primereact/selectbutton',
  props: {
    label: { type: 'string', description: 'Accessible group name.', required: true },
    options: { type: 'ReadonlyArray<{ value: V; label: string; count?: number }>', description: 'Segments.', required: true },
    value: { type: 'V', description: 'Selected value (one is always selected).', required: true },
    onChange: { type: '(value: V) => void', description: 'Change handler.', required: true },
    size: { type: "'sm' | 'md'", description: 'Height.', default: "'md'" },
  },
  accessibility: ['role="group" with aria-label; items are role="button" with aria-pressed and roving tabindex.'],
  do: ['Keep labels short; show counts when they help triage.'],
  dont: ['Do not use for navigation between pages.'],
  example: `<SegmentedControl label="Status filter" options={[{ value: 'all', label: 'All' }]} value={filter} onChange={setFilter} />`,
});
