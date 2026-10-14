import { defineComponentMeta } from '../../meta.ts';
import type { ButtonProps } from './Button.tsx';

export const buttonMeta = defineComponentMeta<ButtonProps>()({
  name: 'Button',
  category: 'actions',
  description: 'Triggers an action. One primary button per view; everything else is secondary or ghost.',
  wraps: 'primereact/button',
  props: {
    children: { type: 'ReactNode', description: 'Visible label. Use a verb: "Save", "Code document".', required: true },
    variant: { type: "'primary' | 'secondary' | 'ghost' | 'danger'", description: 'Visual emphasis.', default: "'secondary'" },
    size: { type: "'sm' | 'md'", description: 'Control height from the size tokens.', default: "'md'" },
    type: { type: "'button' | 'submit' | 'reset'", description: 'Native button type.', default: "'button'" },
    disabled: { type: 'boolean', description: 'Disables interaction.', default: 'false' },
    loading: { type: 'boolean', description: 'Shows a spinner, disables the button and sets aria-busy.', default: 'false' },
    icon: { type: 'ReactNode', description: 'Decorative leading icon (hidden from assistive tech).' },
    keyShortcut: { type: 'string', description: 'Shortcut exposed via aria-keyshortcuts, e.g. "Control+Enter".' },
    onClick: { type: '(event: MouseEvent<HTMLButtonElement>) => void', description: 'Click handler.' },
    'aria-label': { type: 'string', description: 'Accessible name when the visible label is ambiguous.' },
    className: { type: 'string', description: 'Escape hatch for layout only (margins, grid placement). Never colours.' },
  },
  accessibility: [
    'Renders a native <button>, so Enter and Space work without extra code.',
    'Focus ring uses color.focus.ring with a 2px offset (WCAG 2.2 SC 2.4.11 Focus Appearance).',
    'loading sets aria-busy and keeps the label so screen readers still announce the action.',
  ],
  do: ['Use exactly one primary button per region.', 'Pair keyShortcut with a visible <Kbd> hint.'],
  dont: ['Do not use Button for navigation; use a link.', 'Do not override colours via className.'],
  example: `<Button variant="primary" keyShortcut="Control+Enter" onClick={save}>Save and next</Button>`,
});
