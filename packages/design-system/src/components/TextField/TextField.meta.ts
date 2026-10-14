import { defineComponentMeta } from '../../meta.ts';
import type { TextFieldProps } from './TextField.tsx';

export const textFieldMeta = defineComponentMeta<TextFieldProps>()({
  name: 'TextField',
  category: 'forms',
  description: 'Single-line text or search input with a programmatic label.',
  wraps: 'primereact/inputtext',
  props: {
    label: { type: 'string', description: 'Label text (always rendered, optionally visually hidden).', required: true },
    value: { type: 'string', description: 'Controlled value.', required: true },
    onChange: { type: '(value: string) => void', description: 'Change handler.', required: true },
    hideLabel: { type: 'boolean', description: 'Visually hide the label.', default: 'false' },
    type: { type: "'text' | 'search'", description: 'Input type.', default: "'text'" },
    placeholder: { type: 'string', description: 'Example input. Never a substitute for the label.' },
    icon: { type: 'ReactNode', description: 'Decorative leading icon.' },
    keyShortcut: { type: 'string', description: 'Shortcut that focuses the field, e.g. "/".' },
    inputRef: { type: 'Ref<HTMLInputElement>', description: 'Ref to the native input (for focus shortcuts).' },
  },
  accessibility: ['Label is always in the DOM; hideLabel uses a visually-hidden class rather than removing it.'],
  do: ['Use type="search" for filter boxes.'],
  dont: ['Do not rely on placeholder as the label.'],
  example: `<TextField type="search" label="Search documents" hideLabel keyShortcut="/" value={q} onChange={setQ} />`,
});
