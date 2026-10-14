import type { Meta, StoryObj } from '@storybook/react-vite';
import { SearchIcon } from 'primereact/icons/search';
import { useState } from 'react';
import { Checkbox } from './Checkbox/Checkbox';
import { RadioGroup } from './RadioGroup/RadioGroup';
import { SegmentedControl } from './SegmentedControl/SegmentedControl';
import { Stack } from './Stack/Stack';
import { TextArea } from './TextArea/TextArea';
import { TextField } from './TextField/TextField';

const meta = { title: 'Forms/Coding form' } satisfies Meta;
export default meta;

const decisions = [
  { value: 'responsive', label: 'Responsive', shortcut: '1' },
  { value: 'not-responsive', label: 'Not responsive', shortcut: '2' },
  { value: 'needs-review', label: 'Needs further review', shortcut: '3' },
] as const;

export const CodingForm: StoryObj = {
  render: function Render() {
    const [decision, setDecision] = useState<(typeof decisions)[number]['value'] | null>(null);
    const [privileged, setPrivileged] = useState(false);
    const [note, setNote] = useState('');
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState<'uncoded' | 'all'>('uncoded');
    return (
      <Stack gap={5} className="sb-narrow">
        <TextField type="search" label="Search documents" hideLabel placeholder="Search subject or custodian" icon={<SearchIcon />} keyShortcut="/" value={query} onChange={setQuery} />
        <SegmentedControl
          label="Status filter"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'uncoded', label: 'Uncoded', count: 88_412 },
            { value: 'all', label: 'All', count: 100_000 },
          ]}
        />
        <RadioGroup label="Responsiveness" options={decisions} value={decision} onChange={setDecision} />
        <Checkbox label="Privileged" shortcut="P" checked={privileged} onChange={setPrivileged} />
        <TextArea label="Reviewer note" hint="Visible to your review team" value={note} onChange={setNote} />
      </Stack>
    );
  },
};
