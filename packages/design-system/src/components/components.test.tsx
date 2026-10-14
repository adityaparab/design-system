import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../test/axe';
import { Button } from './Button/Button';
import { Checkbox } from './Checkbox/Checkbox';
import { DataGrid } from './DataGrid/DataGrid';
import { Dialog } from './Dialog/Dialog';
import { HighlightedText } from './HighlightedText/HighlightedText';
import { Meter } from './Meter/Meter';
import { Panel } from './Panel/Panel';
import { RadioGroup } from './RadioGroup/RadioGroup';
import { SegmentedControl } from './SegmentedControl/SegmentedControl';
import { StateMessage } from './StateMessage/StateMessage';
import { StatusTag } from './StatusTag/StatusTag';
import { TextArea } from './TextArea/TextArea';
import { TextField } from './TextField/TextField';

describe('Button', () => {
  it('is a native button that fires onClick from keyboard', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    button.focus();
    await userEvent.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('marks loading buttons busy and disabled', () => {
    render(<Button loading>Saving</Button>);
    const button = screen.getByRole('button', { name: /saving/i });
    expect(button).toHaveProperty('disabled', true);
    expect(button.getAttribute('aria-busy')).toBe('true');
  });

  it('exposes keyboard shortcuts', () => {
    render(<Button keyShortcut="Control+Enter">Save and next</Button>);
    expect(screen.getByRole('button').getAttribute('aria-keyshortcuts')).toBe('Control+Enter');
  });
});

describe('RadioGroup', () => {
  function Harness() {
    const [value, setValue] = useState<'a' | 'b' | null>(null);
    return (
      <RadioGroup
        label="Decision"
        value={value}
        onChange={setValue}
        options={[
          { value: 'a', label: 'Responsive', shortcut: '1' },
          { value: 'b', label: 'Not responsive', shortcut: '2' },
        ]}
      />
    );
  }

  it('is a labelled group of native radios', async () => {
    render(<Harness />);
    expect(screen.getByRole('group', { name: 'Decision' })).toBeTruthy();
    await userEvent.click(screen.getByLabelText('Not responsive'));
    expect((screen.getByRole('radio', { name: 'Not responsive' }) as HTMLInputElement).checked).toBe(true);
    expect(screen.getByRole('radio', { name: 'Responsive' }).getAttribute('aria-keyshortcuts')).toBe('1');
  });
});

describe('Checkbox', () => {
  it('toggles via its label', async () => {
    const onChange = vi.fn();
    render(<Checkbox label="Privileged" checked={false} onChange={onChange} />);
    await userEvent.click(screen.getByText('Privileged'));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

describe('TextField and TextArea', () => {
  it('keep a programmatic label even when visually hidden', async () => {
    const onChange = vi.fn();
    render(
      <>
        <TextField label="Search documents" hideLabel value="" onChange={onChange} keyShortcut="/" />
        <TextArea label="Note" hint="Visible to your team" value="" onChange={() => {}} />
      </>,
    );
    const search = screen.getByRole('textbox', { name: 'Search documents' });
    expect(search.getAttribute('aria-keyshortcuts')).toBe('/');
    await userEvent.type(search, 'm');
    expect(onChange).toHaveBeenCalledWith('m');
    expect(screen.getByRole('textbox', { name: 'Note' }).getAttribute('aria-describedby')).toBeTruthy();
  });
});

describe('SegmentedControl', () => {
  it('reports the pressed segment', async () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl
        label="Status filter"
        value="all"
        onChange={onChange}
        options={[
          { value: 'all', label: 'All' },
          { value: 'uncoded', label: 'Uncoded', count: 12 },
        ]}
      />,
    );
    expect(screen.getByRole('group', { name: 'Status filter' })).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: /uncoded/i }));
    expect(onChange).toHaveBeenCalledWith('uncoded');
  });
});

describe('Dialog', () => {
  it('is a labelled modal that closes on Escape', async () => {
    const onClose = vi.fn();
    render(
      <Dialog title="Keyboard shortcuts" open onClose={onClose}>
        <p>Body</p>
      </Dialog>,
    );
    const dialog = await screen.findByRole('dialog', { name: 'Keyboard shortcuts' });
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    await act(async () => {
      await userEvent.keyboard('{Escape}');
    });
    expect(onClose).toHaveBeenCalled();
  });
});

describe('feedback components', () => {
  it('announce errors as alerts and other states as status', () => {
    render(
      <>
        <StateMessage tone="error" title="Viewer unavailable" />
        <StateMessage tone="empty" title="Nothing here" />
      </>,
    );
    expect(screen.getByRole('alert').textContent).toContain('Viewer unavailable');
    expect(screen.getByRole('status').textContent).toContain('Nothing here');
  });

  it('Meter exposes a bounded value', () => {
    render(<Meter label="AI relevance" value={0.873} />);
    const meter = screen.getByRole('meter', { name: 'AI relevance' });
    expect(meter.getAttribute('aria-valuenow')).toBe('87');
  });

  it('HighlightedText marks hits and anchors citations', () => {
    const { container } = render(
      <HighlightedText text="the merger agreement" terms={['agreement']} citations={[{ id: 'c1', start: 4, end: 10 }]} activeCitationId="c1" />,
    );
    const marks = container.querySelectorAll('mark');
    expect(marks).toHaveLength(2);
    expect(container.querySelector('#citation-c1')?.className).toContain('vds-mark--active');
  });
});

describe('DataGrid', () => {
  it('labels the table and announces the full row count', () => {
    render(
      <div style={{ height: 300 }}>
        <DataGrid
          aria-label="Documents"
          rowKey="id"
          rows={[{ id: '1', subject: 'Hello' }, undefined]}
          columns={[{ id: 'subject', header: 'Subject', field: 'subject' }]}
        />
      </div>,
    );
    const table = screen.getByRole('table', { name: 'Documents' });
    expect(table.getAttribute('aria-rowcount')).toBe('3');
    expect(screen.getByRole('columnheader', { name: /subject/i })).toBeTruthy();
  });
});

describe('accessibility (axe)', () => {
  it('a composed coding form has no violations', async () => {
    const { container } = render(
      <main>
        <Panel title="Coding">
          <TextField label="Search documents" hideLabel type="search" value="" onChange={() => {}} />
          <SegmentedControl label="Filter" value="a" onChange={() => {}} options={[{ value: 'a', label: 'All' }, { value: 'b', label: 'Uncoded' }]} />
          <RadioGroup label="Decision" value="a" onChange={() => {}} options={[{ value: 'a', label: 'Responsive' }, { value: 'b', label: 'Not responsive' }]} />
          <Checkbox label="Privileged" checked onChange={() => {}} />
          <TextArea label="Note" value="" onChange={() => {}} />
          <Meter label="AI relevance" value={0.5} />
          <StatusTag tone="success">Responsive</StatusTag>
          <Button variant="primary">Save</Button>
        </Panel>
      </main>,
    );
    await expectNoA11yViolations(container);
  });
});
