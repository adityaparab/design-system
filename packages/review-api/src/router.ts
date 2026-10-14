import type { DocumentQuery } from '@verity/contracts';
import { countDocuments, getDocument, listDocuments, saveCoding, TOTAL_DOCUMENTS, validateCoding } from './data.js';

export interface ReviewApiOptions {
  /** Simulated network latency in ms. */
  latencyMs?: number;
}

export interface ReviewApi {
  /** Handles /api/* requests; returns null for anything else so the caller can pass it through. */
  handle(request: Request): Promise<Response | null>;
}

const SORTS = new Set(['controlNumber', 'sentAt', 'relevance']);
const STATUSES = new Set(['all', 'uncoded', 'responsive', 'not-responsive', 'needs-review']);

const json = (status: number, body: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'content-type, authorization',
      'access-control-allow-methods': 'GET, PUT, OPTIONS',
    },
  });

function parseQuery(params: URLSearchParams): DocumentQuery | string {
  const sort = params.get('sort') ?? 'controlNumber';
  const status = params.get('status') ?? 'all';
  const direction = params.get('direction') ?? 'asc';
  const offset = Number(params.get('offset') ?? 0);
  const limit = Math.min(Number(params.get('limit') ?? 100), 500);
  if (!SORTS.has(sort)) return `Unknown sort "${sort}"`;
  if (!STATUSES.has(status)) return `Unknown status "${status}"`;
  if (direction !== 'asc' && direction !== 'desc') return 'direction must be asc or desc';
  if (!Number.isInteger(offset) || offset < 0 || !Number.isInteger(limit) || limit < 1) return 'Bad offset/limit';
  return {
    sort: sort as DocumentQuery['sort'],
    status: status as DocumentQuery['status'],
    direction,
    offset,
    limit,
    q: (params.get('q') ?? '').trim(),
  };
}

/** Stub token format: "Bearer stub.<userId>.<displayName>". */
const reviewerFrom = (request: Request) =>
  decodeURIComponent((request.headers.get('authorization') ?? '').split('.').slice(2).join('.')) || 'Unknown reviewer';

/**
 * The review API written against the Fetch API, so the same code runs behind a
 * Node HTTP server and inside the browser (static demo deploys).
 */
export function createReviewApi({ latencyMs = 0 }: ReviewApiOptions = {}): ReviewApi {
  return {
    async handle(request) {
      const url = new URL(request.url);
      if (!url.pathname.startsWith('/api/')) return null;
      if (request.method === 'OPTIONS') return json(204, undefined);
      if (latencyMs > 0) await new Promise((r) => setTimeout(r, latencyMs));

      if (url.pathname === '/api/health') return json(200, { ok: true, documents: TOTAL_DOCUMENTS });

      if (url.pathname === '/api/documents' && request.method === 'GET') {
        const query = parseQuery(url.searchParams);
        return typeof query === 'string' ? json(400, { error: query }) : json(200, listDocuments(query));
      }

      if (url.pathname === '/api/documents/counts' && request.method === 'GET') {
        return json(200, countDocuments((url.searchParams.get('q') ?? '').trim()));
      }

      const match = /^\/api\/documents\/([\w-]+)(\/coding)?$/.exec(url.pathname);
      if (match) {
        const [, id, coding] = match;
        if (!coding && request.method === 'GET') {
          const doc = getDocument(id!);
          return doc ? json(200, doc) : json(404, { error: `No document ${id}` });
        }
        if (coding && request.method === 'PUT') {
          const body = validateCoding(await request.json().catch(() => undefined));
          if (typeof body === 'string') return json(422, { error: body });
          const saved = saveCoding(id!, body, reviewerFrom(request));
          return saved ? json(200, saved) : json(404, { error: `No document ${id}` });
        }
      }

      return json(404, { error: `No route for ${request.method} ${url.pathname}` });
    },
  };
}
