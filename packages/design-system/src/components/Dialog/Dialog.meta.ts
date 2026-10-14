import { defineComponentMeta } from '../../meta.ts';
import type { DialogProps } from './Dialog.tsx';

export const dialogMeta = defineComponentMeta<DialogProps>()({
  name: 'Dialog',
  category: 'overlay',
  description: 'Modal dialog for focused tasks such as the keyboard shortcut reference or a confirmation.',
  wraps: 'primereact/dialog',
  props: {
    title: { type: 'string', description: 'Dialog title; labels the dialog.', required: true },
    open: { type: 'boolean', description: 'Visibility.', required: true },
    onClose: { type: '() => void', description: 'Called on Escape, mask click or close button.', required: true },
    children: { type: 'ReactNode', description: 'Body.', required: true },
    footer: { type: 'ReactNode', description: 'Footer actions, primary last.' },
    width: { type: "'sm' | 'md' | 'lg'", description: 'Max width.', default: "'md'" },
  },
  accessibility: [
    'role="dialog" + aria-modal + aria-labelledby the title.',
    'Focus is trapped while open and returned to the trigger on close; Escape closes.',
  ],
  do: ['Keep dialogs short and task-focused.'],
  dont: ['Do not open a dialog from another dialog.'],
  example: `<Dialog title="Keyboard shortcuts" open={open} onClose={() => setOpen(false)}>{list}</Dialog>`,
});
