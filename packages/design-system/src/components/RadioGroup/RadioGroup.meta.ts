import { defineComponentMeta } from '../../meta.ts';
import type { RadioGroupProps } from './RadioGroup.tsx';

export const radioGroupMeta = defineComponentMeta<RadioGroupProps<string>>()({
  name: 'RadioGroup',
  category: 'forms',
  description: 'Single choice among 2–6 options, e.g. a responsiveness decision.',
  wraps: 'primereact/radiobutton',
  props: {
    label: { type: 'string', description: 'Fieldset legend.', required: true },
    options: { type: 'ReadonlyArray<{ value: V; label: string; shortcut?: string }>', description: 'Choices.', required: true },
    value: { type: 'V | null', description: 'Selected value.', required: true },
    onChange: { type: '(value: V) => void', description: 'Selection handler.', required: true },
    name: { type: 'string', description: 'Native group name.', default: 'generated' },
    disabled: { type: 'boolean', description: 'Disable the whole group.', default: 'false' },
    orientation: { type: "'vertical' | 'horizontal'", description: 'Layout.', default: "'vertical'" },
  },
  accessibility: [
    'Native radios in a <fieldset><legend>: one Tab stop, arrow keys move the choice.',
    'Shortcuts are exposed with aria-keyshortcuts and shown with <Kbd>.',
  ],
  do: ['Use for mutually exclusive coding decisions.'],
  dont: ['Do not use for more than ~6 options; use a select.'],
  example: `<RadioGroup label="Responsiveness" options={[{ value: 'responsive', label: 'Responsive', shortcut: '1' }]} value={v} onChange={setV} />`,
});
