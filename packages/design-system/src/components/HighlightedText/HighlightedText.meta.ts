import { defineComponentMeta } from '../../meta.ts';
import type { HighlightedTextProps } from './HighlightedText.tsx';

export const highlightedTextMeta = defineComponentMeta<HighlightedTextProps>()({
  name: 'HighlightedText',
  category: 'data-display',
  description: 'Document text with search-hit and citation highlights. Citations link AI suggestions to the evidence behind them.',
  props: {
    text: { type: 'string', description: 'Plain text to render.', required: true },
    terms: { type: 'readonly string[]', description: 'Search terms to highlight.', default: '[]' },
    citations: { type: 'ReadonlyArray<{ id: string; start: number; end: number }>', description: 'Evidence ranges (character offsets).', default: '[]' },
    activeCitationId: { type: 'string | null', description: 'Citation to emphasise.' },
  },
  accessibility: [
    'Uses <mark>; citations get id="citation-{id}" so buttons can scroll to and reference them.',
    'Active citation adds an outline, not only a colour change.',
  ],
  do: ['Let users jump from each AI claim to its citation.'],
  dont: ['Do not inject HTML; text is always rendered as text.'],
  example: `<HighlightedText text={doc.body} terms={['merger']} citations={suggestion.citations} activeCitationId={active} />`,
});
