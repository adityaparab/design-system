import type { DocumentQuery, DocumentSummary } from '@verity/contracts';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReviewApi } from './api';

export const PAGE_SIZE = 100;

export type ListFilters = Omit<DocumentQuery, 'offset' | 'limit'>;

interface WindowState {
  /** Filters this state belongs to; a new key means "start over". */
  key: string;
  total: number | null;
  rows: Array<DocumentSummary | undefined>;
  error: Error | null;
}

const empty = (key: string): WindowState => ({ key, total: null, rows: [], error: null });

/**
 * Server-windowed list: keeps a sparse array of `total` rows and fetches
 * 100-row pages as the grid's visible range moves. Pages go through the
 * TanStack Query cache, so scrolling back is instant and requests dedupe.
 *
 * `filters` must be referentially stable (memoize it) because a new object
 * means a new result set.
 */
export function useWindowedDocuments(api: ReviewApi, filters: ListFilters) {
  const queryClient = useQueryClient();
  const key = JSON.stringify(filters);
  const [stored, setStored] = useState<WindowState>(() => empty(key));
  const requested = useRef(new Set<number>());

  // New filters: drop the old window during render instead of in an effect.
  const state = stored.key === key ? stored : empty(key);
  if (stored.key !== key) setStored(state);

  const fetchPageData = useCallback(
    (page: number) =>
      queryClient.fetchQuery({
        queryKey: ['documents', filters, page],
        queryFn: () => api.list({ ...filters, offset: page * PAGE_SIZE, limit: PAGE_SIZE }),
        staleTime: 30_000,
      }),
    [api, filters, queryClient],
  );

  const fetchPage = useCallback(
    async (page: number) => {
      try {
        const data = await fetchPageData(page);
        setStored((prev) => {
          if (prev.key !== key) return prev; // filters changed while in flight
          const rows = prev.total === data.total ? prev.rows.slice() : Array.from({ length: data.total }, (_, i) => prev.rows[i]);
          data.items.forEach((item, i) => {
            rows[data.offset + i] = item;
          });
          return { key, total: data.total, rows, error: null };
        });
      } catch (error) {
        requested.current.delete(page);
        setStored((prev) => (prev.key === key ? { ...prev, error: error as Error } : prev));
      }
    },
    [fetchPageData, key],
  );

  useEffect(() => {
    requested.current = new Set([0]);
    void fetchPage(0);
  }, [fetchPage]);

  const requestRange = useCallback(
    ({ first, last }: { first: number; last: number }) => {
      for (let page = Math.floor(first / PAGE_SIZE); page <= Math.floor(Math.max(first, last - 1) / PAGE_SIZE); page += 1) {
        if (requested.current.has(page)) continue;
        requested.current.add(page);
        void fetchPage(page);
      }
    },
    [fetchPage],
  );

  /** Ensures the row at `index` is loaded and returns it. */
  const ensureRow = useCallback(
    async (index: number): Promise<DocumentSummary | undefined> => {
      const data = await fetchPageData(Math.floor(index / PAGE_SIZE));
      return data.items[index - data.offset];
    },
    [fetchPageData],
  );

  const updateRow = useCallback(
    (id: string, patch: Partial<DocumentSummary>) => {
      setStored((prev) => {
        const index = prev.rows.findIndex((row) => row?.id === id);
        if (index === -1) return prev;
        const rows = prev.rows.slice();
        rows[index] = { ...rows[index]!, ...patch };
        return { ...prev, rows };
      });
      // Cached pages are now stale; refetch when scrolled back to.
      void queryClient.invalidateQueries({ queryKey: ['documents'], refetchType: 'none' });
    },
    [queryClient],
  );

  const retry = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['documents'], refetchType: 'none' });
    setStored(empty(key));
    requested.current = new Set([0]);
    void fetchPage(0);
  }, [fetchPage, key, queryClient]);

  return { total: state.total, rows: state.rows, error: state.error, requestRange, ensureRow, updateRow, retry };
}
