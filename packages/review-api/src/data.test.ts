import { describe, expect, it } from 'vitest';
import { countDocuments, getDocument, listDocuments, saveCoding, TOTAL_DOCUMENTS, validateCoding } from './data.js';

describe('mock review data', () => {
  it('is deterministic and complete', () => {
    const page = listDocuments({ offset: 0, limit: 3, sort: 'controlNumber', direction: 'asc', status: 'all', q: '' });
    expect(page.total).toBe(TOTAL_DOCUMENTS);
    expect(page.items.map((d) => d.id)).toEqual(['VRT-0000001', 'VRT-0000002', 'VRT-0000003']);
    expect(getDocument('VRT-0000002')).toEqual(getDocument('VRT-0000002'));
  });

  it('sorts by relevance descending', () => {
    const { items } = listDocuments({ offset: 0, limit: 50, sort: 'relevance', direction: 'desc', status: 'all', q: '' });
    const scores = items.map((d) => d.relevance);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });

  it('citations point at real passages in the body', () => {
    const doc = getDocument('VRT-0000042')!;
    expect(doc.aiSuggestion.citations.length).toBeGreaterThan(0);
    for (const c of doc.aiSuggestion.citations) {
      expect(doc.body.slice(c.start, c.end).length).toBe(c.end - c.start);
    }
  });

  it('validates and saves coding, updating counts', () => {
    expect(validateCoding({ decision: 'maybe', privileged: false, note: '' })).toMatch(/decision/);
    const id = 'VRT-0000001';
    expect(getDocument(id)!.status).toBe('uncoded');
    const before = countDocuments('').responsive;
    const request = validateCoding({ decision: 'responsive', privileged: true, note: 'Key doc' });
    if (typeof request === 'string') throw new Error(request);
    const saved = saveCoding(id, request, 'Test Reviewer')!;
    expect(saved.status).toBe('responsive');
    expect(saved.coding.codedBy).toBe('Test Reviewer');
    expect(countDocuments('').responsive).toBe(before + 1);
  });
});
