import { Column } from 'primereact/column';
import {
  DataTable,
  type DataTableSelectionSingleChangeEvent,
  type DataTableValueArray,
} from 'primereact/datatable';
import type { VirtualScrollerLazyEvent } from 'primereact/virtualscroller';
import { useCallback, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { cx } from '../../utils/cx';
import { Skeleton } from '../Skeleton/Skeleton';

export interface DataGridColumn<Row> {
  id: string;
  header: string;
  /** Field used for sorting and default text rendering. */
  field?: keyof Row & string;
  /** CSS width, e.g. "120px" or "30%". */
  width?: string;
  sortable?: boolean;
  align?: 'start' | 'end';
  cell?: (row: Row) => ReactNode;
}

export interface DataGridSort {
  field: string;
  direction: 'asc' | 'desc';
}

export interface DataGridProps<Row> {
  /** Accessible name of the table. */
  'aria-label': string;
  columns: ReadonlyArray<DataGridColumn<Row>>;
  /**
   * Rows to show. For windowed loading pass an array of length `total` with
   * `undefined` holes for rows not fetched yet; they render as skeletons.
   */
  rows: ReadonlyArray<Row | undefined>;
  /** Property that uniquely identifies a row. */
  rowKey: keyof Row & string;
  selectedKey?: string | null;
  /** Fired on click, Enter or Space on a row. */
  onRowActivate?: (row: Row, index: number) => void;
  /** Controlled sort. The grid never sorts locally; the data owner does. */
  sort?: DataGridSort;
  onSortChange?: (sort: DataGridSort) => void;
  /** Called as the visible window moves; fetch the rows in [first, last). */
  onVisibleRangeChange?: (range: { first: number; last: number }) => void;
  emptyMessage?: ReactNode;
  /** Row height in px. Defaults to the size.grid-row token of the current tenant. */
  rowHeight?: number;
  /** Index of the row to keep in view (e.g. after "save and next"). */
  scrollToIndex?: number | null;
}

const FALLBACK_ROW_HEIGHT = 40;
const FLEX_COLUMN_MIN_WIDTH = 180;

/** Reads size.grid-row from the cascade so tenant density changes keep virtual-scroll maths right. */
function useTokenRowHeight(override?: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(override ?? FALLBACK_ROW_HEIGHT);
  useLayoutEffect(() => {
    if (override !== undefined || !ref.current) return;
    const raw = getComputedStyle(ref.current).getPropertyValue('--vds-size-grid-row');
    const parsed = Number.parseFloat(raw);
    if (Number.isFinite(parsed) && parsed > 0) setHeight(parsed);
  }, [override]);
  return { ref, height: override ?? height };
}

/**
 * Virtualized, keyboard-first data grid over PrimeReact DataTable.
 *
 * The API is deliberately narrower than DataTable's: columns are data, sorting and
 * loading are controlled, and there is one selection model. That keeps product
 * code independent of PrimeReact's component API (which changes completely in v11).
 */
export function DataGrid<Row extends object>({
  'aria-label': ariaLabel,
  columns,
  rows,
  rowKey,
  selectedKey,
  onRowActivate,
  sort,
  onSortChange,
  onVisibleRangeChange,
  emptyMessage = 'No rows',
  rowHeight,
  scrollToIndex,
}: DataGridProps<Row>) {
  const { ref: containerRef, height } = useTokenRowHeight(rowHeight);
  const tableRef = useRef<DataTable<DataTableValueArray>>(null);
  const windowFirst = useRef(0);

  // Fixed-width columns plus a floor for flexible ones; narrower panes scroll
  // horizontally instead of squashing a column to zero.
  const minTableWidth = useMemo(
    () =>
      columns.reduce((sum, c) => {
        const px = c.width?.endsWith('px') ? Number.parseFloat(c.width) : Number.NaN;
        return sum + (Number.isFinite(px) ? px : FLEX_COLUMN_MIN_WIDTH);
      }, 0),
    [columns],
  );

  const selected = useMemo(
    () => (selectedKey == null ? null : (rows.find((r) => r !== undefined && String(r[rowKey]) === selectedKey) ?? null)),
    [rows, rowKey, selectedKey],
  );

  useLayoutEffect(() => {
    if (scrollToIndex == null || scrollToIndex < 0) return;
    const scroller = tableRef.current?.getVirtualScroller();
    if (!scroller) return;
    const { first, last } = scroller.getRenderedRange().viewport;
    // Keep a one-row margin so the target is fully visible, not clipped.
    if (scrollToIndex <= first || scrollToIndex >= last - 1) {
      scroller.scrollToIndex(Math.max(0, scrollToIndex - 2), 'auto');
    }
  }, [scrollToIndex]);

  const handleSelection = useCallback(
    (event: DataTableSelectionSingleChangeEvent<Row[]>) => {
      // PrimeReact toggles a selected row off on a second activation; we treat
      // every activation as "open", so ignore the null.
      const row = event.value as Row | null;
      if (!row || !onRowActivate) return;
      const index = rows.indexOf(row);
      onRowActivate(row, index);
    },
    [onRowActivate, rows],
  );

  const handleLazyLoad = useCallback(
    (event: VirtualScrollerLazyEvent) => {
      onVisibleRangeChange?.({ first: Number(event.first), last: Number(event.last) });
    },
    [onVisibleRangeChange],
  );

  return (
    <div ref={containerRef} className="vds-grid">
      <DataTable
        ref={tableRef}
        unstyled
        value={rows as Row[]}
        // No dataKey: unloaded rows are undefined and would share a React key.
        // Rows keep index keys and selection compares by reference instead.
        compareSelectionBy="equals"
        lazy
        scrollable
        scrollHeight="flex"
        selectionMode="single"
        selection={selected}
        onSelectionChange={handleSelection}
        metaKeySelection={false}
        sortField={sort?.field}
        sortOrder={sort ? (sort.direction === 'asc' ? 1 : -1) : undefined}
        onSort={(event) =>
          onSortChange?.({ field: event.sortField, direction: event.sortOrder === -1 ? 'desc' : 'asc' })
        }
        emptyMessage={emptyMessage}
        tableStyle={{ minWidth: minTableWidth }}
        rowClassName={(row: unknown) => (row === undefined ? 'vds-grid__row--loading' : '')}
        virtualScrollerOptions={{
          itemSize: height,
          lazy: Boolean(onVisibleRangeChange),
          onLazyLoad: handleLazyLoad,
          numToleratedItems: 12,
          delay: 0,
          onScrollIndexChange: (event) => {
            windowFirst.current = Number(event.first);
          },
        }}
        pt={{
          root: { className: 'vds-grid__root' },
          wrapper: { className: 'vds-grid__wrapper' },
          virtualScroller: {
            root: { className: 'vds-grid__scroller' },
            content: { className: 'vds-grid__scroller-content' },
            spacer: { className: 'vds-grid__scroller-spacer' },
          },
          table: { className: 'vds-grid__table', 'aria-label': ariaLabel, 'aria-rowcount': rows.length + 1 },
          thead: { className: 'vds-grid__thead' },
          headerRow: { className: 'vds-grid__header-row', 'aria-rowindex': 1 },
          tbody: { className: 'vds-grid__tbody' },
          // context.index is the position inside the rendered window; add the
          // window's first index so screen readers hear "row 5,001 of 100,000".
          bodyRow: ({ context }: { context: { index: number; selected: boolean } }) => ({
            className: cx('vds-grid__row', context.selected && 'vds-grid__row--selected'),
            'aria-rowindex': windowFirst.current + context.index + 2,
          }),
          emptyMessage: { className: 'vds-grid__empty' },
          virtualScrollerSpacer: { className: 'vds-grid__spacer' },
        }}
      >
        {columns.map((column) => (
          <Column
            key={column.id}
            field={column.field}
            header={column.header}
            sortable={column.sortable}
            headerStyle={column.width ? { width: column.width } : undefined}
            body={(row: Row | undefined) => {
              if (row === undefined) return <Skeleton width="70%" />;
              if (column.cell) return column.cell(row);
              return column.field ? String(row[column.field] ?? '') : null;
            }}
            pt={{
              headerCell: ({ context }: { context: { sorted: boolean } }) => ({
                className: cx(
                  'vds-grid__th',
                  column.align === 'end' && 'vds-grid__cell--end',
                  column.sortable && 'vds-grid__th--sortable',
                  context?.sorted && 'vds-grid__th--sorted',
                ),
              }),
              headerContent: { className: 'vds-grid__th-content' },
              headerTitle: { className: 'vds-grid__th-title' },
              sortIcon: { className: 'vds-grid__sort-icon' },
              bodyCell: { className: cx('vds-grid__td', column.align === 'end' && 'vds-grid__cell--end') },
            }}
          />
        ))}
      </DataTable>
    </div>
  );
}
