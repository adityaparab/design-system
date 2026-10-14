import { defineComponentMeta } from '../../meta.ts';
import type { KbdProps } from './Kbd.tsx';

export const kbdMeta = defineComponentMeta<KbdProps>()({
  name: 'Kbd',
  category: 'data-display',
  description: 'Shows a keyboard shortcut. Reviewers are keyboard-first, so shortcuts are always visible, never hidden in tooltips.',
  props: {
    children: { type: 'ReactNode', description: 'Key label, e.g. "J" or "Ctrl".', required: true },
  },
  accessibility: ['Renders <kbd>. The control itself must expose the shortcut via aria-keyshortcuts.'],
  do: ['Show shortcuts next to the action they trigger.'],
  dont: ['Do not use Kbd as the only way to discover a shortcut; list it in the shortcuts dialog too.'],
  example: `<Kbd>Ctrl</Kbd> + <Kbd>Enter</Kbd>`,
});
