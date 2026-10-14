import { describe, expect, it } from 'vitest';
import { findTermRanges, segmentText } from './segments';

describe('findTermRanges', () => {
  it('matches terms case-insensitively at word starts', () => {
    expect(findTermRanges('Merger and the MERGER plan; emerge', ['merger'])).toEqual([
      { start: 0, end: 6, kind: 'hit' },
      { start: 15, end: 21, kind: 'hit' },
    ]);
  });

  it('escapes regex characters and ignores one-letter terms', () => {
    expect(findTermRanges('cost (est.) a', ['(est.)', 'a'])).toEqual([{ start: 5, end: 11, kind: 'hit' }]);
  });
});

describe('segmentText', () => {
  it('splits text around ranges', () => {
    const segments = segmentText('hello brave world', [{ start: 6, end: 11, kind: 'hit' }]);
    expect(segments.map((s) => s.text)).toEqual(['hello ', 'brave', ' world']);
  });

  it('prefers citations over overlapping search hits', () => {
    const segments = segmentText('the merger agreement', [
      { start: 4, end: 10, kind: 'hit' },
      { start: 4, end: 20, kind: 'citation', id: 'c1' },
    ]);
    expect(segments).toEqual([
      { text: 'the ' },
      { text: 'merger agreement', range: { start: 4, end: 20, kind: 'citation', id: 'c1' } },
    ]);
  });

  it('drops out-of-bounds ranges instead of throwing', () => {
    expect(segmentText('abc', [{ start: 2, end: 99, kind: 'hit' }])).toEqual([{ text: 'abc' }]);
  });
});
