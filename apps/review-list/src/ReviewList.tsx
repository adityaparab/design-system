import type { DocumentSummary, PlatformEventMap, ReviewListProps, ReviewStatus } from '@verity/contracts';
import {
  Button,
  DataGrid,
  Meter,
  Panel,
  SearchIcon,
  SegmentedControl,
  Stack,
  StateMessage,
  StatusTag,
  TextField,
  type DataGridColumn,
  type DataGridSort,
  type StatusTone,
} from '@verity/design-system';
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useCallback, useDeferredValue, useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import { createApi } from './api';
import { useWindowedDocuments, type ListFilters } from './useWindowedDocuments';

const STATUS_LABEL: Record<ReviewStatus, string> = {
  uncoded: 'Uncoded',
  responsive: 'Responsive',
  'not-responsive': 'Not responsive',
  'needs-review': 'Needs review',
};
const STATUS_TONE: Record<ReviewStatus, StatusTone> = {
  uncoded: 'neutral',
  responsive: 'success',
  'not-responsive': 'danger',
  'needs-review': 'warning',
};

const FILTERS = ['uncoded', 'all', 'responsive', 'needs-review'] as const;
type Filter = (typeof FILTERS)[number];

// Most important columns first, so a narrow pane scrolls away the least useful ones.
const columns: DataGridColumn<DocumentSummary>[] = [
  { id: 'controlNumber', header: 'Control #', field: 'controlNumber', width: '112px', sortable: true },
  { id: 'subject', header: 'Subject', field: 'subject' },
  {
    id: 'status',
    header: 'Status',
    width: '124px',
    cell: (d) => (
      <StatusTag tone={d.privileged ? 'privileged' : STATUS_TONE[d.status]}>
        {STATUS_LABEL[d.status]}
        {d.privileged ? ' · Priv' : ''}
      </StatusTag>
    ),
  },
  {
    id: 'relevance',
    header: 'AI',
    field: 'relevance',
    width: '84px',
    sortable: true,
    cell: (d) => <Meter label={`AI relevance for ${d.controlNumber}`} value={d.relevance} />,
  },
  { id: 'sentAt', header: 'Date', field: 'sentAt', width: '108px', sortable: true, cell: (d) => format(new Date(d.sentAt), 'd MMM yyyy') },
];

function isTypingTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
}

function ReviewListView({ platform, activeDocumentId, onOpenDocument }: ReviewListProps) {
  const api = useMemo(() => createApi(platform), [platform]);
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>('uncoded');
  const [search, setSearch] = useState('');
  const q = useDeferredValue(search.trim());
  const [sort, setSort] = useState<DataGridSort>({ field: 'controlNumber', direction: 'asc' });
  const searchRef = useRef<HTMLInputElement>(null);

  const filters: ListFilters = useMemo(
    () => ({ status: filter, q, sort: sort.field as ListFilters['sort'], direction: sort.direction }),
    [filter, q, sort],
  );
  const { total, rows, error, requestRange, ensureRow, updateRow, retry } = useWindowedDocuments(api, filters);
  const counts = useQuery({ queryKey: ['counts', q], queryFn: () => api.counts(q), staleTime: 10_000 });

  const activeIndex = useMemo(
    () => (activeDocumentId ? rows.findIndex((r) => r?.id === activeDocumentId) : -1),
    [rows, activeDocumentId],
  );

  // Effect events read the latest rows and callbacks without re-subscribing to the bus.
  const onCoded = useEffectEvent(({ documentId, decision, privileged }: PlatformEventMap['document.coded']) => {
    updateRow(documentId, { status: decision, privileged });
    void queryClient.invalidateQueries({ queryKey: ['counts'] });
  });
  const onAdvance = useEffectEvent(async ({ fromDocumentId }: PlatformEventMap['review.advance']) => {
    const from = rows.findIndex((r) => r?.id === fromDocumentId);
    if (from === -1 || from + 1 >= rows.length) return;
    const next = rows[from + 1] ?? (await ensureRow(from + 1));
    if (next) onOpenDocument(next.id);
  });

  useEffect(() => {
    const offCoded = platform.events.on('document.coded', onCoded);
    const offAdvance = platform.events.on('review.advance', onAdvance);
    return () => {
      offCoded();
      offAdvance();
    };
  }, [platform.events]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === '/' && !isTypingTarget(event.target)) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleActivate = useCallback((row: DocumentSummary) => onOpenDocument(row.id), [onOpenDocument]);

  const options = FILTERS.map((value) => ({
    value,
    label: value === 'all' ? 'All' : STATUS_LABEL[value],
    count: counts.data?.[value],
  }));

  return (
    <Panel title="Documents" flush fill actions={<span aria-hidden="true">{total === null ? '…' : total.toLocaleString()}</span>}>
      <Stack padding={3} gap={3}>
        <TextField
          type="search"
          label="Search documents"
          hideLabel
          placeholder="Search subject, custodian or control #   ( / )"
          icon={<SearchIcon />}
          keyShortcut="/"
          value={search}
          onChange={setSearch}
          inputRef={searchRef}
        />
        <SegmentedControl label="Filter by review status" size="sm" options={options} value={filter} onChange={setFilter} />
      </Stack>
      <p className="vds-visually-hidden" aria-live="polite">
        {total === null ? 'Loading documents' : `${total.toLocaleString()} documents`}
      </p>
      {error ? (
        <StateMessage tone="error" title="Could not load documents" action={<Button onClick={retry}>Retry</Button>}>
          <p>{error.message}</p>
        </StateMessage>
      ) : (
        <DataGrid
          aria-label="Documents"
          columns={columns}
          rows={rows}
          rowKey="id"
          selectedKey={activeDocumentId}
          scrollToIndex={activeIndex}
          onRowActivate={handleActivate}
          sort={sort}
          onSortChange={setSort}
          onVisibleRangeChange={requestRange}
          emptyMessage={total === 0 ? 'No documents match these filters.' : ' '}
        />
      )}
    </Panel>
  );
}

/** Each remote owns its query cache: no shared mutable state across micro frontends. */
export function ReviewList(props: ReviewListProps) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } }));
  return (
    <QueryClientProvider client={client}>
      <ReviewListView {...props} />
    </QueryClientProvider>
  );
}
