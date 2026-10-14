import type { Meta, StoryObj } from '@storybook/react-vite';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Meter } from '../Meter/Meter';
import { StatusTag } from '../StatusTag/StatusTag';
import { DataGrid, type DataGridColumn, type DataGridSort } from './DataGrid';
import { dataGridMeta } from './DataGrid.meta';

interface Doc {
  id: string;
  subject: string;
  custodian: string;
  score: number;
  status: 'Uncoded' | 'Responsive' | 'Not responsive';
}

const TOTAL = 100_000;
const custodians = ['A. Rivera', 'J. Chen', 'M. Okafor', 'S. Novak', 'L. Haddad'];
const subjects = ['Q3 forecast', 'Board deck draft', 'Re: supplier terms', 'Merger diligence list', 'Lunch?'];
const makeDoc = (i: number): Doc => ({
  id: `DOC-${String(i + 1).padStart(6, '0')}`,
  subject: `${subjects[i % subjects.length]} #${i + 1}`,
  custodian: custodians[(i * 7) % custodians.length]!,
  score: ((i * 37) % 100) / 100,
  status: i % 9 === 0 ? 'Responsive' : i % 13 === 0 ? 'Not responsive' : 'Uncoded',
});

const columns: DataGridColumn<Doc>[] = [
  { id: 'id', header: 'Control #', field: 'id', width: '130px', sortable: true },
  { id: 'subject', header: 'Subject', field: 'subject', sortable: true },
  { id: 'custodian', header: 'Custodian', field: 'custodian', width: '140px' },
  { id: 'score', header: 'AI relevance', width: '140px', cell: (d) => <Meter label={`AI relevance for ${d.id}`} value={d.score} /> },
  {
    id: 'status',
    header: 'Status',
    width: '140px',
    cell: (d) => <StatusTag tone={d.status === 'Responsive' ? 'success' : d.status === 'Uncoded' ? 'neutral' : 'warning'}>{d.status}</StatusTag>,
  },
];

const meta = {
  title: 'Data display/DataGrid',
  component: DataGrid,
  parameters: { docs: { description: { component: dataGridMeta.description } } },
} satisfies Meta<typeof DataGrid>;

export default meta;

/** 100,000 rows fetched in windows with simulated latency; unloaded rows render as skeletons. */
export const WindowedHundredThousandRows: StoryObj = {
  render: function Render() {
    const [rows, setRows] = useState<Array<Doc | undefined>>(() => Array.from({ length: TOTAL }));
    const [selected, setSelected] = useState<string | null>(null);
    const [sort, setSort] = useState<DataGridSort>({ field: 'id', direction: 'asc' });
    const loaded = useRef(new Set<number>());

    const load = useCallback(({ first, last }: { first: number; last: number }) => {
      const missing: number[] = [];
      for (let i = first; i < Math.min(last, TOTAL); i++) if (!loaded.current.has(i)) missing.push(i);
      if (missing.length === 0) return;
      missing.forEach((i) => loaded.current.add(i));
      setTimeout(() => {
        setRows((prev) => {
          const next = prev.slice();
          for (const i of missing) next[i] = makeDoc(sort.direction === 'asc' ? i : TOTAL - 1 - i);
          return next;
        });
      }, 250);
    }, [sort.direction]);

    const onSort = (next: DataGridSort) => {
      loaded.current.clear();
      setRows(Array.from({ length: TOTAL }));
      setSort(next);
    };

    return (
      <div style={{ height: 480, display: 'flex', flexDirection: 'column', border: '1px solid var(--vds-color-border-default)' }}>
        <DataGrid
          aria-label="Documents"
          columns={columns}
          rows={rows}
          rowKey="id"
          selectedKey={selected}
          onRowActivate={(row) => setSelected(row.id)}
          sort={sort}
          onSortChange={onSort}
          onVisibleRangeChange={load}
        />
      </div>
    );
  },
};

export const ClientRows: StoryObj = {
  render: function Render() {
    const rows = useMemo(() => Array.from({ length: 50 }, (_, i) => makeDoc(i)), []);
    const [selected, setSelected] = useState<string | null>('DOC-000003');
    return (
      <div style={{ height: 360, display: 'flex', flexDirection: 'column' }}>
        <DataGrid aria-label="Documents" columns={columns} rows={rows} rowKey="id" selectedKey={selected} onRowActivate={(r) => setSelected(r.id)} />
      </div>
    );
  },
};

export const Empty: StoryObj = {
  render: () => (
    <div style={{ height: 200, display: 'flex', flexDirection: 'column' }}>
      <DataGrid aria-label="Documents" columns={columns} rows={[]} rowKey="id" emptyMessage="No documents match these filters." />
    </div>
  ),
};
