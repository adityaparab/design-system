import { defineComponentMeta } from '../../meta.ts';
import type { CheckboxProps } from './Checkbox.tsx';

export const checkboxMeta = defineComponentMeta<CheckboxProps>()({
  name: 'Checkbox',
  category: 'forms',
  description: 'Independent on/off choice, e.g. "Privileged" or an issue tag.',
  wraps: 'primereact/checkbox',
  props: {
    label: { type: 'string', description: 'Visible label, linked with htmlFor.', required: true },
    checked: { type: 'boolean', description: 'Checked state.', required: true },
    onChange: { type: '(checked: boolean) => void', description: 'Change handler.', required: true },
    disabled: { type: 'boolean', description: 'Disable.', default: 'false' },
    shortcut: { type: 'string', description: 'Single-key shortcut hint.' },
    id: { type: 'string', description: 'Input id.', default: 'generated' },
  },
  accessibility: ['Native checkbox input stays focusable and clickable; the visual box is decorative.'],
  do: ['Group related checkboxes in a fieldset with a legend.'],
  dont: ['Do not use a checkbox for an action that applies immediately and cannot be undone.'],
  example: `<Checkbox label="Privileged" shortcut="P" checked={privileged} onChange={setPrivileged} />`,
});
