import { createEventBus, type DocumentDetail, type PlatformContext } from '@verity/contracts';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DocViewer } from './DocViewer';

const doc: DocumentDetail = {
  id: 'VRT-1',
  controlNumber: 'VRT-1',
  kind: 'email',
  subject: 'Northgate pricing agreement',
  custodian: 'Alex Morgan',
  sentAt: '2022-03-01T10:00:00.000Z',
  relevance: 0.9,
  status: 'uncoded',
  privileged: false,
  from: 'Alex Morgan',
  to: ['Priya Natarajan'],
  body: 'We agreed to hold list pricing flat for both regions.',
  hitTerms: ['pricing'],
  aiSuggestion: {
    decision: 'responsive',
    privilegeLikely: false,
    confidence: 0.9,
    rationale: 'Likely responsive: pricing coordination.',
    citations: [{ id: 'c1', start: 0, end: 30, label: 'Pricing coordination' }],
    model: 'test',
  },
  coding: { decision: null, privileged: false, note: '' },
};

function setup() {
  const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
    if (init?.method === 'PUT') {
      const body = JSON.parse(String(init.body)) as DocumentDetail['coding'];
      return new Response(JSON.stringify({ ...doc, status: body.decision, coding: body }));
    }
    return new Response(JSON.stringify(doc));
  });
  vi.stubGlobal('fetch', fetchMock);
  const events = createEventBus();
  const coded = vi.fn();
  const advance = vi.fn();
  events.on('document.coded', coded);
  events.on('review.advance', advance);
  const platform: PlatformContext = {
    session: { userId: 'u', displayName: 'U', tenant: 'acme', accessToken: 'stub.u.U', roles: [] },
    apiBaseUrl: '/api',
    navigate: vi.fn(),
    events,
    telemetry: { error: vi.fn(), event: vi.fn() },
  };
  render(<DocViewer platform={platform} documentId="VRT-1" />);
  return { fetchMock, coded, advance };
}

beforeEach(() => vi.unstubAllGlobals());
afterEach(() => vi.unstubAllGlobals());

describe('DocViewer', () => {
  it('codes with single-key shortcuts and saves-and-advances with Ctrl+Enter', async () => {
    const { fetchMock, coded, advance } = setup();
    await screen.findByRole('heading', { name: 'Northgate pricing agreement' });

    await userEvent.keyboard('1');
    await userEvent.keyboard('p');
    expect((screen.getByRole('radio', { name: 'Responsive' }) as HTMLInputElement).checked).toBe(true);
    expect((screen.getByRole('checkbox', { name: 'Privileged' }) as HTMLInputElement).checked).toBe(true);

    await userEvent.keyboard('{Control>}{Enter}{/Control}');
    await waitFor(() => expect(advance).toHaveBeenCalledWith({ fromDocumentId: 'VRT-1' }));
    expect(coded).toHaveBeenCalledWith({ documentId: 'VRT-1', decision: 'responsive', privileged: true });
    const put = fetchMock.mock.calls.find(([, init]) => init?.method === 'PUT')!;
    expect(JSON.parse(String(put[1]!.body))).toEqual({ decision: 'responsive', privileged: true, note: '' });
    expect(await screen.findByText(/Saved VRT-1 as Responsive, privileged/)).toBeTruthy();
  });

  it('ignores single-key shortcuts while typing a note (WCAG 2.1.4)', async () => {
    setup();
    await screen.findByRole('heading', { name: 'Northgate pricing agreement' });
    await userEvent.type(screen.getByRole('textbox', { name: 'Reviewer note' }), 'see p1');
    expect((screen.getByRole('radio', { name: 'Responsive' }) as HTMLInputElement).checked).toBe(false);
    expect((screen.getByRole('checkbox', { name: 'Privileged' }) as HTMLInputElement).checked).toBe(false);
  });

  it('applies the AI suggestion only when the reviewer asks', async () => {
    setup();
    await screen.findByRole('heading', { name: 'Northgate pricing agreement' });
    expect((screen.getByRole('radio', { name: 'Responsive' }) as HTMLInputElement).checked).toBe(false);
    await userEvent.click(screen.getByRole('button', { name: 'Apply AI suggestion' }));
    expect((screen.getByRole('radio', { name: 'Responsive' }) as HTMLInputElement).checked).toBe(true);
  });
});
