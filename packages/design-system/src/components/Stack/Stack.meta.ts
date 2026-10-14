import { defineComponentMeta } from '../../meta.ts';
import type { StackProps } from './Stack.tsx';

export const stackMeta = defineComponentMeta<StackProps>()({
  name: 'Stack',
  category: 'layout',
  description: 'Flexbox layout primitive with token-based spacing. Use instead of custom CSS for arranging components.',
  props: {
    children: { type: 'ReactNode', description: 'Content.', required: true },
    direction: { type: "'column' | 'row'", description: 'Flow direction.', default: "'column'" },
    gap: { type: '0 | 1 | 2 | 3 | 4 | 5 | 6 | 8', description: 'Gap from the space scale (space.N).', default: '3' },
    padding: { type: '0 | 1 | 2 | 3 | 4 | 5 | 6 | 8', description: 'Padding from the space scale.' },
    align: { type: "'start' | 'center' | 'end' | 'stretch' | 'baseline'", description: 'Cross-axis alignment.' },
    justify: { type: "'start' | 'center' | 'end' | 'between'", description: 'Main-axis distribution.' },
    wrap: { type: 'boolean', description: 'Allow wrapping.', default: 'false' },
    grow: { type: 'boolean', description: 'Fill remaining space in a flex parent.', default: 'false' },
    as: { type: 'ElementType', description: 'Element to render, e.g. "section" or "ul".', default: "'div'" },
    className: { type: 'string', description: 'Layout escape hatch.' },
  },
  accessibility: ['Purely visual. Pick a semantic element via `as` when the group has meaning.'],
  do: ['Use gap tokens rather than margins on children.'],
  dont: ['Do not hard-code pixel spacing.'],
  example: `<Stack direction="row" gap={2} align="center"><Button>Cancel</Button><Button variant="primary">Save</Button></Stack>`,
});
