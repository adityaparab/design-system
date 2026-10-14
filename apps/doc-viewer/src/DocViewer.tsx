import type { AiSuggestion, CodingDecision, DocViewerProps, DocumentDetail } from '@verity/contracts';
import {
  Button,
  Checkbox,
  HighlightedText,
  Kbd,
  Meter,
  Panel,
  RadioGroup,
  Skeleton,
  SplitLayout,
  Stack,
  StateMessage,
  StatusTag,
  TextArea,
} from '@verity/design-system';
import { QueryClient, QueryClientProvider, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useMemo, useState } from 'react';
import { createApi } from './api';
import { useShortcuts } from './useShortcuts';

const DECISIONS = [
  { value: 'responsive', label: 'Responsive', shortcut: '1' },
  { value: 'not-responsive', label: 'Not responsive', shortcut: '2' },
  { value: 'needs-review', label: 'Needs further review', shortcut: '3' },
] as const satisfies ReadonlyArray<{ value: CodingDecision; label: string; shortcut: string }>;

const decisionLabel = (d: CodingDecision) => DECISIONS.find((o) => o.value === d)!.label;

function simulatedCrash() {
  if (new URLSearchParams(window.location.search).get('simulate') === 'viewer-crash') {
    throw new Error('Simulated render crash inside the doc-viewer remote');
  }
}

function DocumentPane({ doc, activeCitationId }: { doc: DocumentDetail; activeCitationId: string | null }) {
  return (
    <Panel title={doc.subject} fill>
      <Stack gap={4}>
        <Stack direction="row" gap={2} wrap align="center">
          <StatusTag tone="info">{doc.controlNumber}</StatusTag>
          <StatusTag>{doc.kind}</StatusTag>
          <span>
            {doc.from} → {doc.to.join(', ')}
          </span>
          <span aria-label="Sent">{format(new Date(doc.sentAt), 'd MMM yyyy, HH:mm')}</span>
        </Stack>
        <article
          aria-label="Document text"
          style={{ fontFamily: 'var(--vds-font-family-document)', fontSize: 'var(--vds-font-size-md)', lineHeight: 1.7, whiteSpace: 'pre-wrap', maxWidth: '72ch' }}
        >
          <HighlightedText text={doc.body} terms={doc.hitTerms} citations={doc.aiSuggestion.citations} activeCitationId={activeCitationId} />
        </article>
      </Stack>
    </Panel>
  );
}

function AiSuggestionPanel({
  suggestion,
  activeCitationId,
  onCite,
  onApply,
}: {
  suggestion: AiSuggestion;
  activeCitationId: string | null;
  onCite: (id: string) => void;
  onApply: () => void;
}) {
  return (
    <Panel title="AI suggestion" actions={<Button size="sm" variant="ghost" keyShortcut="A" aria-label="Apply AI suggestion" onClick={onApply}>Apply <Kbd>A</Kbd></Button>}>
      <Stack gap={3}>
        <Stack direction="row" gap={2} align="center" wrap>
          <StatusTag tone={suggestion.decision === 'responsive' ? 'success' : suggestion.decision === 'needs-review' ? 'warning' : 'danger'}>
            {decisionLabel(suggestion.decision)}
          </StatusTag>
          {suggestion.privilegeLikely ? <StatusTag tone="privileged">Likely privileged</StatusTag> : null}
        </Stack>
        <Meter label="Model confidence" showLabel value={suggestion.confidence} valueText={`${Math.round(suggestion.confidence * 100)}% confidence`} />
        <p style={{ margin: 0, fontSize: 'var(--vds-font-size-sm)' }}>{suggestion.rationale}</p>
        <Stack as="ul" gap={1} padding={0} align="start">
          {suggestion.citations.map((citation, index) => (
            <li key={citation.id} style={{ listStyle: 'none' }}>
              <Button
                size="sm"
                variant={citation.id === activeCitationId ? 'secondary' : 'ghost'}
                aria-label={`Show evidence ${index + 1}: ${citation.label}`}
                onClick={() => onCite(citation.id)}
              >
                [{index + 1}] {citation.label}
              </Button>
            </li>
          ))}
        </Stack>
        <p style={{ margin: 0, fontSize: 'var(--vds-font-size-xs)', color: 'var(--vds-color-text-muted)' }}>
          {suggestion.model} · Suggestions are a starting point; the reviewer makes the call.
        </p>
      </Stack>
    </Panel>
  );
}

interface FormState {
  decision: CodingDecision | null;
  privileged: boolean;
  note: string;
}

function ViewerContent({
  doc,
  platform,
  announce,
}: {
  doc: DocumentDetail;
  platform: DocViewerProps['platform'];
  announce: (message: string) => void;
}) {
  const api = useMemo(() => createApi(platform), [platform]);
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>({ decision: doc.coding.decision, privileged: doc.coding.privileged, note: doc.coding.note });
  const [activeCitationId, setActiveCitationId] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: (variables: { advance: boolean }) => {
      if (!form.decision) throw new Error('Choose a responsiveness decision before saving.');
      return api.saveCoding(doc.id, { decision: form.decision, privileged: form.privileged, note: form.note }).then((saved) => ({ saved, ...variables }));
    },
    onSuccess: ({ saved, advance }) => {
      queryClient.setQueryData(['document', saved.id], saved);
      announce(`Saved ${saved.controlNumber} as ${decisionLabel(saved.coding.decision!)}${saved.coding.privileged ? ', privileged' : ''}.`);
      platform.events.emit('document.coded', { documentId: saved.id, decision: saved.coding.decision!, privileged: saved.coding.privileged });
      platform.telemetry.event('document.coded', { documentId: saved.id, advance });
      if (advance) platform.events.emit('review.advance', { fromDocumentId: saved.id });
    },
    onError: (error) => platform.telemetry.error(error, { documentId: doc.id, action: 'save-coding' }),
  });

  const cite = (id: string) => {
    setActiveCitationId(id);
    document.getElementById(`citation-${id}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  };
  const applySuggestion = () =>
    setForm((f) => ({ ...f, decision: doc.aiSuggestion.decision, privileged: doc.aiSuggestion.privilegeLikely }));

  useShortcuts([
    ...DECISIONS.map((d) => ({ key: d.shortcut, handler: () => setForm((f) => ({ ...f, decision: d.value })) })),
    { key: 'p', handler: () => setForm((f) => ({ ...f, privileged: !f.privileged })) },
    { key: 'a', handler: applySuggestion },
    { key: 'enter', mod: true, handler: () => save.mutate({ advance: true }) },
    { key: 's', mod: true, handler: () => save.mutate({ advance: false }) },
  ]);

  const coding = (
    <Panel title="Coding">
      <Stack gap={4}>
        <RadioGroup label="Responsiveness" options={DECISIONS} value={form.decision} onChange={(decision) => setForm((f) => ({ ...f, decision }))} />
        <Checkbox label="Privileged" shortcut="P" checked={form.privileged} onChange={(privileged) => setForm((f) => ({ ...f, privileged }))} />
        <TextArea label="Reviewer note" hint="Visible to your review team" value={form.note} maxLength={2000} onChange={(note) => setForm((f) => ({ ...f, note }))} />
        {save.error ? <StateMessage tone="error" title="Not saved">{save.error.message}</StateMessage> : null}
        <Stack direction="row" gap={2} justify="end" wrap>
          <Button keyShortcut="Control+S" loading={save.isPending && !save.variables?.advance} onClick={() => save.mutate({ advance: false })}>
            Save
          </Button>
          <Button variant="primary" keyShortcut="Control+Enter" loading={save.isPending && save.variables?.advance} onClick={() => save.mutate({ advance: true })}>
            Save and next <Kbd>Ctrl</Kbd>
            <Kbd>↵</Kbd>
          </Button>
        </Stack>
        {doc.coding.codedBy ? (
          <p style={{ margin: 0, fontSize: 'var(--vds-font-size-xs)', color: 'var(--vds-color-text-muted)' }}>
            Last coded by {doc.coding.codedBy}
            {doc.coding.codedAt ? ` on ${format(new Date(doc.coding.codedAt), 'd MMM yyyy')}` : ''}
          </p>
        ) : null}
      </Stack>
    </Panel>
  );

  return (
    <SplitLayout
      start={<DocumentPane doc={doc} activeCitationId={activeCitationId} />}
      end={
        <Stack gap={3} grow>
          <AiSuggestionPanel suggestion={doc.aiSuggestion} activeCitationId={activeCitationId} onCite={cite} onApply={applySuggestion} />
          {coding}
        </Stack>
      }
      fixedWidth="340px"
      collapseBelow="md"
    />
  );
}

function DocViewerView({ platform, documentId, announce }: DocViewerProps & { announce: (message: string) => void }) {
  simulatedCrash();
  const api = useMemo(() => createApi(platform), [platform]);
  const query = useQuery({ queryKey: ['document', documentId], queryFn: () => api.get(documentId) });

  if (query.isPending) {
    return (
      <Panel title="Loading document" fill>
        <Stack gap={3}>
          <Skeleton width="45%" height="1.2em" />
          <Skeleton width="90%" />
          <Skeleton width="85%" />
          <Skeleton width="70%" />
        </Stack>
      </Panel>
    );
  }
  if (query.isError) {
    return (
      <StateMessage tone="error" title="Could not load this document" action={<Button onClick={() => query.refetch()}>Retry</Button>}>
        <p>{query.error.message}</p>
      </StateMessage>
    );
  }
  // Keying by id resets the coding form when the reviewer moves to the next document.
  return <ViewerContent key={query.data.id} doc={query.data} platform={platform} announce={announce} />;
}

export function DocViewer(props: DocViewerProps) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } }));
  // The live region sits above the per-document key so "Saved …" survives "save and next".
  const [announcement, setAnnouncement] = useState('');
  return (
    <QueryClientProvider client={client}>
      <DocViewerView {...props} announce={setAnnouncement} />
      <p role="status" className="vds-visually-hidden">
        {announcement}
      </p>
    </QueryClientProvider>
  );
}
