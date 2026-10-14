import { useMemo } from 'react';
import { cx } from '../../utils/cx';
import { findTermRanges, segmentText, type TextRange } from './segments';

export interface HighlightedTextProps {
  text: string;
  /** Search terms to mark. */
  terms?: readonly string[];
  /** Evidence passages, e.g. citations behind an AI suggestion. */
  citations?: ReadonlyArray<{ id: string; start: number; end: number }>;
  /** Citation currently in focus; it gets a stronger highlight. */
  activeCitationId?: string | null;
}

/** Renders document text with <mark> highlights for search hits and AI citations. */
export function HighlightedText({ text, terms = [], citations = [], activeCitationId }: HighlightedTextProps) {
  const segments = useMemo(() => {
    const ranges: TextRange[] = [
      ...findTermRanges(text, terms),
      ...citations.map((c) => ({ start: c.start, end: c.end, kind: 'citation' as const, id: c.id })),
    ];
    return segmentText(text, ranges);
  }, [text, terms, citations]);

  return (
    <>
      {segments.map((segment, index) =>
        segment.range ? (
          <mark
            key={index}
            id={segment.range.id ? `citation-${segment.range.id}` : undefined}
            data-citation={segment.range.id}
            className={cx(
              'vds-mark',
              `vds-mark--${segment.range.kind}`,
              segment.range.id !== undefined && segment.range.id === activeCitationId && 'vds-mark--active',
            )}
          >
            {segment.text}
          </mark>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </>
  );
}
