import { defineComponentMeta } from '../../meta.ts';
import type { TextAreaProps } from './TextArea.tsx';

export const textAreaMeta = defineComponentMeta<TextAreaProps>()({
  name: 'TextArea',
  category: 'forms',
  description: 'Multi-line free text, e.g. reviewer notes.',
  wraps: 'primereact/inputtextarea',
  props: {
    label: { type: 'string', description: 'Visible label.', required: true },
    value: { type: 'string', description: 'Controlled value.', required: true },
    onChange: { type: '(value: string) => void', description: 'Change handler.', required: true },
    rows: { type: 'number', description: 'Initial visible rows.', default: '3' },
    placeholder: { type: 'string', description: 'Example input.' },
    hint: { type: 'string', description: 'Helper text linked via aria-describedby.' },
    maxLength: { type: 'number', description: 'Character limit.' },
  },
  accessibility: ['Hint text is linked with aria-describedby.', 'Global single-key shortcuts must ignore keystrokes typed here.'],
  do: ['State limits in the hint.'],
  dont: ['Do not auto-submit on Enter; Enter inserts a newline.'],
  example: `<TextArea label="Reviewer note" hint="Visible to your team" value={note} onChange={setNote} />`,
});
