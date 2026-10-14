import type {
  AiSuggestion,
  Citation,
  Coding,
  CodingDecision,
  DocumentDetail,
  DocumentKind,
  DocumentPage,
  DocumentQuery,
  DocumentSummary,
  ReviewStatus,
  SaveCodingRequest,
  StatusCounts,
} from '@verity/contracts';

export const TOTAL_DOCUMENTS = 100_000;
export const HIT_TERMS = ['Atlas', 'merger', 'pricing', 'Northgate', 'confidential'];

/** Small seeded PRNG so every document is reproducible from its index alone. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T>(rand: () => number, items: readonly T[]): T => items[Math.floor(rand() * items.length)]!;

const CUSTODIANS = [
  'Alex Morgan', 'Priya Natarajan', 'Tomasz Nowak', 'Grace Okafor', 'Daniel Reyes', 'Hannah Schmidt',
  'Kenji Watanabe', 'Lucia Ferrari', 'Omar Haddad', 'Sofia Lindqvist', 'Marcus Bell', 'Ewa Kowalska',
];

interface Topic {
  subject: string;
  relevance: [number, number];
  decision: CodingDecision;
  privileged: boolean;
  paragraphs: string[];
  evidence: Array<{ sentence: string; label: string }>;
}

const TOPICS: Topic[] = [
  {
    subject: 'Project Atlas merger timeline',
    relevance: [0.78, 0.98],
    decision: 'responsive',
    privileged: false,
    paragraphs: [
      'Following yesterday\'s steering call, the Project Atlas merger timeline moves to the third quarter.',
      'Finance needs the revised synergy model before the board pack is circulated.',
      'Please keep this confidential until the announcement; only the deal team should see the draft.',
    ],
    evidence: [
      { sentence: 'the Project Atlas merger timeline moves to the third quarter', label: 'Merger timeline changed' },
      { sentence: 'Please keep this confidential until the announcement', label: 'Confidentiality instruction' },
    ],
  },
  {
    subject: 'Northgate pricing agreement – redlines',
    relevance: [0.7, 0.95],
    decision: 'responsive',
    privileged: false,
    paragraphs: [
      'Attached are the redlines on the Northgate pricing agreement.',
      'We agreed to hold list pricing flat for both regions through year end, as discussed with their sales lead.',
      'Let\'s not put the floor price in email; I will share it on the call.',
    ],
    evidence: [
      { sentence: 'We agreed to hold list pricing flat for both regions through year end', label: 'Pricing coordination' },
      { sentence: 'Let\'s not put the floor price in email', label: 'Avoiding written record' },
    ],
  },
  {
    subject: 'Advice re: Atlas disclosure obligations',
    relevance: [0.6, 0.9],
    decision: 'responsive',
    privileged: true,
    paragraphs: [
      'Privileged and confidential – attorney-client communication.',
      'Counsel advised that the Atlas data room index should stay restricted until the disclosure review is complete.',
      'Outside counsel will circulate a memo on the merger filing requirements next week.',
    ],
    evidence: [
      { sentence: 'Counsel advised that the Atlas data room index should stay restricted', label: 'Legal advice' },
      { sentence: 'Privileged and confidential – attorney-client communication', label: 'Privilege header' },
    ],
  },
  {
    subject: 'Q3 supplier pricing review',
    relevance: [0.45, 0.75],
    decision: 'needs-review',
    privileged: false,
    paragraphs: [
      'The procurement team finished the Q3 supplier pricing review.',
      'Two suppliers raised prices above the contracted cap; we may need legal to look at the clauses.',
      'Full numbers are in the shared spreadsheet.',
    ],
    evidence: [{ sentence: 'Two suppliers raised prices above the contracted cap', label: 'Possible contract issue' }],
  },
  {
    subject: 'Board meeting prep',
    relevance: [0.3, 0.6],
    decision: 'needs-review',
    privileged: false,
    paragraphs: [
      'Agenda for Thursday\'s board meeting is attached.',
      'Item four covers strategic options; the slides are still in draft.',
      'Please send comments by Tuesday noon.',
    ],
    evidence: [{ sentence: 'Item four covers strategic options', label: 'Strategic options item' }],
  },
  {
    subject: 'Team lunch Friday',
    relevance: [0.01, 0.15],
    decision: 'not-responsive',
    privileged: false,
    paragraphs: [
      'Who is in for lunch on Friday? Thinking the new ramen place.',
      'Reply by Thursday so I can book a table.',
    ],
    evidence: [{ sentence: 'Who is in for lunch on Friday?', label: 'Social plans' }],
  },
  {
    subject: 'Expense report reminder',
    relevance: [0.02, 0.2],
    decision: 'not-responsive',
    privileged: false,
    paragraphs: [
      'Reminder: September expense reports are due by the 5th.',
      'Receipts over 50 EUR need to be attached.',
    ],
    evidence: [{ sentence: 'September expense reports are due by the 5th', label: 'Administrative reminder' }],
  },
  {
    subject: 'Weekly sync notes',
    relevance: [0.1, 0.4],
    decision: 'not-responsive',
    privileged: false,
    paragraphs: [
      'Notes from the weekly sync: hiring is on track and the office move is confirmed for March.',
      'No updates on the vendor contract renewal yet.',
    ],
    evidence: [{ sentence: 'hiring is on track and the office move is confirmed', label: 'Operational update' }],
  },
];

const KINDS: DocumentKind[] = ['email', 'email', 'email', 'email', 'attachment', 'attachment', 'spreadsheet', 'chat'];
const START = Date.UTC(2021, 0, 1);
const SPAN = Date.UTC(2023, 11, 31) - START;

interface Seed {
  summary: DocumentSummary;
  topic: Topic;
  from: string;
  to: string[];
}

function seedDocument(index: number): Seed {
  const rand = mulberry32(index * 2654435761);
  const topic = TOPICS[Math.floor(rand() * TOPICS.length)]!;
  const [lo, hi] = topic.relevance;
  const custodian = pick(rand, CUSTODIANS);
  const recipient = pick(rand, CUSTODIANS.filter((c) => c !== custodian));
  const controlNumber = `VRT-${String(index + 1).padStart(7, '0')}`;
  return {
    topic,
    from: custodian,
    to: [recipient],
    summary: {
      id: controlNumber,
      controlNumber,
      kind: pick(rand, KINDS),
      subject: `${rand() < 0.35 ? 'RE: ' : ''}${topic.subject}`,
      custodian,
      sentAt: new Date(START + Math.floor(rand() * SPAN)).toISOString(),
      relevance: Math.round((lo + rand() * (hi - lo)) * 100) / 100,
      status: 'uncoded',
      privileged: false,
    },
  };
}

// ---- Store ---------------------------------------------------------------

const seeds: Seed[] = Array.from({ length: TOTAL_DOCUMENTS }, (_, i) => seedDocument(i));
const byId = new Map(seeds.map((s, i) => [s.summary.id, i]));
const codings = new Map<string, Coding>();

// Pre-code ~12% so the list has history.
for (let i = 0; i < TOTAL_DOCUMENTS; i += 1) {
  if (i % 8 === 3) {
    const seed = seeds[i]!;
    codings.set(seed.summary.id, {
      decision: seed.topic.decision,
      privileged: seed.topic.privileged,
      note: '',
      codedBy: 'First-pass reviewer',
      codedAt: '2024-02-01T09:00:00.000Z',
    });
  }
}

function summaryOf(seed: Seed): DocumentSummary {
  const coding = codings.get(seed.summary.id);
  return {
    ...seed.summary,
    status: coding?.decision ?? 'uncoded',
    privileged: coding?.privileged ?? false,
  };
}

const sortedIndex = new Map<string, number[]>();
function sortedIndices(sort: DocumentQuery['sort'], direction: DocumentQuery['direction']): number[] {
  const key = `${sort}:${direction}`;
  let order = sortedIndex.get(key);
  if (!order) {
    const value = (i: number) => {
      const s = seeds[i]!.summary;
      return sort === 'sentAt' ? s.sentAt : sort === 'relevance' ? s.relevance : s.controlNumber;
    };
    order = seeds.map((_, i) => i).sort((a, b) => (value(a) < value(b) ? -1 : value(a) > value(b) ? 1 : 0));
    if (direction === 'desc') order.reverse();
    sortedIndex.set(key, order);
  }
  return order;
}

function matches(seed: Seed, status: DocumentQuery['status'], q: string): boolean {
  if (status !== 'all' && (codings.get(seed.summary.id)?.decision ?? 'uncoded') !== status) return false;
  if (!q) return true;
  const needle = q.toLowerCase();
  return (
    seed.summary.subject.toLowerCase().includes(needle) ||
    seed.summary.custodian.toLowerCase().includes(needle) ||
    seed.summary.controlNumber.toLowerCase().includes(needle)
  );
}

export function listDocuments(query: DocumentQuery): DocumentPage {
  const items: DocumentSummary[] = [];
  let total = 0;
  for (const index of sortedIndices(query.sort, query.direction)) {
    const seed = seeds[index]!;
    if (!matches(seed, query.status, query.q)) continue;
    if (total >= query.offset && items.length < query.limit) items.push(summaryOf(seed));
    total += 1;
  }
  return { total, offset: query.offset, items };
}

export function countDocuments(q: string): StatusCounts {
  const counts: StatusCounts = { all: 0, uncoded: 0, responsive: 0, 'not-responsive': 0, 'needs-review': 0 };
  for (const seed of seeds) {
    if (!matches(seed, 'all', q)) continue;
    counts.all += 1;
    counts[(codings.get(seed.summary.id)?.decision ?? 'uncoded') as ReviewStatus] += 1;
  }
  return counts;
}

function buildBody(seed: Seed): string {
  const rand = mulberry32(byId.get(seed.summary.id)! * 7919);
  const greeting = `Hi ${seed.to[0]!.split(' ')[0]},`;
  const filler = [
    'Let me know if anything here is unclear.',
    'Happy to discuss on our next call.',
    'Copying the wider team for visibility.',
  ];
  return [greeting, ...seed.topic.paragraphs, pick(rand, filler), `Best,\n${seed.from.split(' ')[0]}`].join('\n\n');
}

function suggestionFor(seed: Seed, body: string): AiSuggestion {
  const citations: Citation[] = seed.topic.evidence.flatMap((e, i) => {
    const start = body.indexOf(e.sentence);
    return start === -1 ? [] : [{ id: `${seed.summary.id}-c${i + 1}`, start, end: start + e.sentence.length, label: e.label }];
  });
  const decisionText = { responsive: 'responsive', 'not-responsive': 'not responsive', 'needs-review': 'worth a closer look' }[
    seed.topic.decision
  ];
  return {
    decision: seed.topic.decision,
    privilegeLikely: seed.topic.privileged,
    // Confidence is in the suggested decision, not in relevance itself.
    confidence:
      seed.topic.decision === 'responsive'
        ? seed.summary.relevance
        : seed.topic.decision === 'not-responsive'
          ? Math.round((1 - seed.summary.relevance) * 100) / 100
          : Math.round((0.5 + seed.summary.relevance / 4) * 100) / 100,
    rationale: `Likely ${decisionText}: ${citations.map((c) => c.label.toLowerCase()).join('; ')}.`,
    citations,
    model: 'review-assist-mock-1',
  };
}

export function getDocument(id: string): DocumentDetail | undefined {
  const index = byId.get(id);
  if (index === undefined) return undefined;
  const seed = seeds[index]!;
  const body = buildBody(seed);
  return {
    ...summaryOf(seed),
    from: seed.from,
    to: seed.to,
    body,
    hitTerms: HIT_TERMS,
    aiSuggestion: suggestionFor(seed, body),
    coding: codings.get(id) ?? { decision: null, privileged: false, note: '' },
  };
}

const DECISIONS: readonly CodingDecision[] = ['responsive', 'not-responsive', 'needs-review'];

export function validateCoding(input: unknown): SaveCodingRequest | string {
  if (typeof input !== 'object' || input === null) return 'Body must be a JSON object';
  const { decision, privileged, note } = input as Record<string, unknown>;
  if (!DECISIONS.includes(decision as CodingDecision)) return `decision must be one of ${DECISIONS.join(', ')}`;
  if (typeof privileged !== 'boolean') return 'privileged must be a boolean';
  if (typeof note !== 'string' || note.length > 2000) return 'note must be a string of at most 2000 characters';
  return { decision: decision as CodingDecision, privileged, note };
}

export function saveCoding(id: string, request: SaveCodingRequest, reviewer: string): DocumentDetail | undefined {
  if (!byId.has(id)) return undefined;
  codings.set(id, { ...request, codedBy: reviewer, codedAt: new Date().toISOString() });
  return getDocument(id);
}
