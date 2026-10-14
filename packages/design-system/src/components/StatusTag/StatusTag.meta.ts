import { defineComponentMeta } from '../../meta.ts';
import type { StatusTagProps } from './StatusTag.tsx';

export const statusTagMeta = defineComponentMeta<StatusTagProps>()({
  name: 'StatusTag',
  category: 'data-display',
  description: 'Short status label such as a coding decision. Tones map to status tokens.',
  props: {
    children: { type: 'ReactNode', description: 'Status text. Always present; colour alone is not enough.', required: true },
    tone: {
      type: "'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'privileged'",
      description: 'Semantic tone.',
      default: "'neutral'",
    },
  },
  accessibility: ['Text/background pairs are contrast-tested per tenant in tokens.test.ts (WCAG 1.4.3).'],
  do: ['Keep labels to one or two words.'],
  dont: ['Do not invent tones with custom colours.'],
  example: `<StatusTag tone="privileged">Privileged</StatusTag>`,
});
