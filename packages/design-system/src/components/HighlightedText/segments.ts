export interface TextRange {
  start: number;
  end: number;
  kind: 'hit' | 'citation';
  /** Citation id, used to link evidence to the passage. */
  id?: string;
}

export interface TextSegment {
  text: string;
  range?: TextRange;
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Case-insensitive, whole-word-ish matches for search terms. */
export function findTermRanges(text: string, terms: readonly string[]): TextRange[] {
  const cleaned = terms.map((t) => t.trim()).filter((t) => t.length > 1);
  if (cleaned.length === 0) return [];
  // Lookbehind instead of \b so terms that start with punctuation still match.
  const pattern = new RegExp(`(?<!\\w)(${cleaned.map(escapeRegExp).join('|')})`, 'gi');
  return Array.from(text.matchAll(pattern), (m) => ({ start: m.index, end: m.index + m[0].length, kind: 'hit' as const }));
}

/**
 * Splits text into plain and highlighted segments. Citations win over search hits
 * when they overlap, because citations are the evidence a reviewer must verify.
 */
export function segmentText(text: string, ranges: readonly TextRange[]): TextSegment[] {
  const sorted = [...ranges]
    .filter((r) => r.end > r.start && r.start >= 0 && r.end <= text.length)
    .sort((a, b) => a.start - b.start || (a.kind === 'citation' ? -1 : 1));

  const accepted: TextRange[] = [];
  for (const range of sorted) {
    const last = accepted.at(-1);
    if (!last || range.start >= last.end) {
      accepted.push(range);
    } else if (range.kind === 'citation' && last.kind === 'hit') {
      accepted[accepted.length - 1] = range;
    }
  }

  const segments: TextSegment[] = [];
  let cursor = 0;
  for (const range of accepted) {
    if (range.start > cursor) segments.push({ text: text.slice(cursor, range.start) });
    segments.push({ text: text.slice(range.start, range.end), range });
    cursor = range.end;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor) });
  return segments;
}
