import { defineComponentMeta } from '../../meta.ts';
import type { MeterProps } from './Meter.tsx';

export const meterMeta = defineComponentMeta<MeterProps>()({
  name: 'Meter',
  category: 'data-display',
  description: 'Shows a bounded score such as AI relevance. Always pair model scores with an explanation the user can inspect.',
  props: {
    label: { type: 'string', description: 'Accessible name.', required: true },
    value: { type: 'number', description: 'Value from 0 to 1 (clamped).', required: true },
    showLabel: { type: 'boolean', description: 'Render the label visibly.', default: 'false' },
    valueText: { type: 'string', description: 'Announced value override, e.g. "High (0.87)".' },
  },
  accessibility: ['role="meter" with aria-valuenow/min/max; the numeric value is also printed so colour is not the only cue.'],
  do: ['Explain what drives a score next to the meter.'],
  dont: ['Do not use Meter for task progress; that is a progress bar.'],
  example: `<Meter label="AI relevance" value={0.87} valueText="High, 87%" />`,
});
