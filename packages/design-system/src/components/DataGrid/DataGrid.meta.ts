import { defineComponentMeta } from '../../meta.ts';
import type { DataGridProps } from './DataGrid.tsx';

export const dataGridMeta = defineComponentMeta<DataGridProps<object>>()({
  name: 'DataGrid',
  category: 'data-display',
  description:
    'Virtualized, keyboard-first table for large result sets (100k+ rows). Supports windowed loading, controlled sort and single-row activation.',
  wraps: 'primereact/datatable',
  props: {
    'aria-label': { type: 'string', description: 'Accessible name of the table.', required: true },
    columns: {
      type: 'ReadonlyArray<{ id: string; header: string; field?: keyof Row; width?: string; sortable?: boolean; align?: "start" | "end"; cell?: (row: Row) => ReactNode }>',
      description: 'Column definitions as data.',
      required: true,
    },
    rows: { type: 'ReadonlyArray<Row | undefined>', description: 'Rows; undefined holes render as skeletons during windowed loading.', required: true },
    rowKey: { type: 'keyof Row & string', description: 'Unique row identifier property.', required: true },
    selectedKey: { type: 'string | null', description: 'Key of the active row.' },
    onRowActivate: { type: '(row: Row, index: number) => void', description: 'Click, Enter or Space on a row.' },
    sort: { type: "{ field: string; direction: 'asc' | 'desc' }", description: 'Controlled sort state.' },
    onSortChange: { type: '(sort: DataGridSort) => void', description: 'Header click/Enter on a sortable column.' },
    onVisibleRangeChange: { type: '(range: { first: number; last: number }) => void', description: 'Windowed loading callback.' },
    emptyMessage: { type: 'ReactNode', description: 'Shown when rows is empty.', default: "'No rows'" },
    rowHeight: { type: 'number', description: 'Row height in px.', default: 'token size.grid-row' },
    scrollToIndex: { type: 'number | null', description: 'Row index to keep in view.' },
  },
  accessibility: [
    'Rows are focusable with a roving tabindex: Tab into the grid, Arrow Up/Down, Home/End, Enter or Space to open.',
    'aria-rowcount and aria-rowindex describe the full set even though only a window is in the DOM.',
    'Sortable headers are keyboard operable and expose aria-sort.',
  ],
  do: ['Keep the grid the only scroll container in its panel.', 'Fetch in windows; never load 100k rows up front.'],
  dont: ['Do not sort or filter client-side for server-backed data.', 'Do not put interactive controls inside cells; use row activation.'],
  example: `<DataGrid aria-label="Documents" rows={rows} rowKey="id" columns={columns} onRowActivate={(row) => open(row.id)} onVisibleRangeChange={load} />`,
});
