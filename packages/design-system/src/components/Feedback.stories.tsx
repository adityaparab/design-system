import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button } from './Button/Button';
import { Dialog } from './Dialog/Dialog';
import { HighlightedText } from './HighlightedText/HighlightedText';
import { Kbd } from './Kbd/Kbd';
import { Meter } from './Meter/Meter';
import { Panel } from './Panel/Panel';
import { Skeleton } from './Skeleton/Skeleton';
import { Stack } from './Stack/Stack';
import { StateMessage } from './StateMessage/StateMessage';
import { StatusTag } from './StatusTag/StatusTag';

const meta = { title: 'Feedback & display/Gallery' } satisfies Meta;
export default meta;

export const StatusTags: StoryObj = {
  render: () => (
    <Stack direction="row" gap={2} wrap>
      <StatusTag>Uncoded</StatusTag>
      <StatusTag tone="success">Responsive</StatusTag>
      <StatusTag tone="warning">Needs review</StatusTag>
      <StatusTag tone="danger">Not responsive</StatusTag>
      <StatusTag tone="info">In batch</StatusTag>
      <StatusTag tone="privileged">Privileged</StatusTag>
    </Stack>
  ),
};

export const States: StoryObj = {
  render: () => (
    <Stack gap={4}>
      <StateMessage tone="empty" title="No documents match">
        <p>Clear a filter or broaden your search.</p>
      </StateMessage>
      <StateMessage tone="error" title="Document viewer is unavailable" action={<Button>Retry</Button>}>
        <p>The rest of the review workspace still works. We have logged the error.</p>
      </StateMessage>
      <Stack gap={2}>
        <Skeleton width="40%" />
        <Skeleton width="90%" />
        <Skeleton width="75%" />
      </Stack>
    </Stack>
  ),
};

const body =
  'Per our call, the merger timeline moves to Q3. Please keep the supplier terms confidential until legal review is complete. Counsel advised that the diligence list stays privileged.';

export const AiSuggestionWithCitations: StoryObj = {
  render: function Render() {
    const [active, setActive] = useState<string | null>('c2');
    const cite = (id: string, quote: string, label: string) => {
      const start = body.indexOf(quote);
      return { id, start, end: start + quote.length, label };
    };
    const citations = [
      cite('c1', 'the merger timeline moves to Q3', 'Merger timeline'),
      cite('c2', 'Counsel advised that the diligence list stays privileged', 'Counsel advice'),
    ];
    return (
      <Stack direction="row" gap={4} align="start">
        <Panel title="Document" className="sb-flex-2">
          <p style={{ fontFamily: 'var(--vds-font-family-document)', lineHeight: 1.7, margin: 0 }}>
            <HighlightedText text={body} terms={['supplier']} citations={citations} activeCitationId={active} />
          </p>
        </Panel>
        <Panel title="AI suggestion" headingLevel={3} className="sb-flex-1">
          <Stack gap={3} align="start">
            <Stack direction="row" gap={3} align="center">
              <StatusTag tone="privileged">Likely privileged</StatusTag>
              <Meter label="Model confidence" value={0.82} valueText="High, 82%" />
            </Stack>
            {citations.map((c) => (
              <Button key={c.id} variant="ghost" size="sm" onClick={() => setActive(c.id)}>
                Evidence: {c.label}
              </Button>
            ))}
          </Stack>
        </Panel>
      </Stack>
    );
  },
};

export const ShortcutDialog: StoryObj = {
  render: function Render() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Show keyboard shortcuts</Button>
        <Dialog
          title="Keyboard shortcuts"
          open={open}
          onClose={() => setOpen(false)}
          footer={<Button variant="primary" onClick={() => setOpen(false)}>Done</Button>}
        >
          <Stack gap={2}>
            <span><Kbd>↑</Kbd> <Kbd>↓</Kbd> Move between documents</span>
            <span><Kbd>Enter</Kbd> Open document</span>
            <span><Kbd>1</Kbd> <Kbd>2</Kbd> <Kbd>3</Kbd> Code responsiveness</span>
            <span><Kbd>Ctrl</Kbd> + <Kbd>Enter</Kbd> Save and next</span>
          </Stack>
        </Dialog>
      </>
    );
  },
};
