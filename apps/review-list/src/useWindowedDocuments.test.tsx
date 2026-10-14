import type { DocumentPage, DocumentQuery } from '@verity/contracts';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { ReviewApi } from './api';
import { PAGE_SIZE, useWindowedDocuments, type ListFilters } from './useWindowedDocuments';

const TOTAL = 1_000;

function fakeApi() {
  const list = vi.fn(async (q: DocumentQuery): Promise<DocumentPage> => ({
    total: TOTAL,
    offset: q.offset,
    items: Array.from({ length: Math.min(q.limit, TOTAL - q.offset) }, (_, i) => ({
      id: `D${q.offset + i}`,
      controlNumber: `D${q.offset + i}`,
      kind: 'email',
      subject: `Doc ${q.offset + i}`,
      custodian: 'A',
      sentAt: '2022-01-01T00:00:00.000Z',
      relevance: 0.5,
      status: 'uncoded',
      privileged: false,
    })),
  }));
  return { list, counts: vi.fn() } as unknown as ReviewApi & { list: typeof list };
}

const filters: ListFilters = { status: 'all', q: '', sort: 'controlNumber', direction: 'asc' };

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>;
}

describe('useWindowedDocuments', () => {
  it('loads the first page into a sparse array of the full length', async () => {
    const api = fakeApi();
    const { result } = renderHook(() => useWindowedDocuments(api, filters), { wrapper });
    await waitFor(() => expect(result.current.total).toBe(TOTAL));
    expect(result.current.rows).toHaveLength(TOTAL);
    expect(result.current.rows[0]?.id).toBe('D0');
    expect(result.current.rows[PAGE_SIZE]).toBeUndefined();
  });

  it('fetches only the pages a visible range touches, once', async () => {
    const api = fakeApi();
    const { result } = renderHook(() => useWindowedDocuments(api, filters), { wrapper });
    await waitFor(() => expect(result.current.total).toBe(TOTAL));
    act(() => result.current.requestRange({ first: 450, last: 520 }));
    act(() => result.current.requestRange({ first: 460, last: 510 }));
    await waitFor(() => expect(result.current.rows[519]?.id).toBe('D519'));
    const offsets = api.list.mock.calls.map(([q]) => q.offset);
    expect(offsets).toEqual([0, 400, 500]);
  });

  it('patches a row in place when another remote codes it', async () => {
    const api = fakeApi();
    const { result } = renderHook(() => useWindowedDocuments(api, filters), { wrapper });
    await waitFor(() => expect(result.current.total).toBe(TOTAL));
    act(() => result.current.updateRow('D3', { status: 'responsive', privileged: true }));
    expect(result.current.rows[3]).toMatchObject({ status: 'responsive', privileged: true });
  });
});
