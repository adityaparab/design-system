import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import type { DocumentQuery } from '@verity/contracts';
import { countDocuments, getDocument, listDocuments, saveCoding, TOTAL_DOCUMENTS, validateCoding } from './data.ts';

const PORT = Number(process.env.PORT ?? 5180);
/** Simulated network latency in ms; override with LATENCY=0 for tests. */
const LATENCY = Number(process.env.LATENCY ?? 120);

const SORTS = new Set(['controlNumber', 'sentAt', 'relevance']);
const STATUSES = new Set(['all', 'uncoded', 'responsive', 'not-responsive', 'needs-review']);

function send(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'access-control-allow-origin': '*',
    'access-control-allow-headers': 'content-type, authorization',
    'access-control-allow-methods': 'GET, PUT, OPTIONS',
  });
  res.end(body === undefined ? undefined : JSON.stringify(body));
}

async function readJson(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    return undefined;
  }
}

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

const reviewerFrom = (req: IncomingMessage) => {
  const header = req.headers.authorization ?? '';
  // Stub token format: "Bearer stub.<userId>.<displayName>"
  return decodeURIComponent(header.split('.').slice(2).join('.')) || 'Unknown reviewer';
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
  if (req.method === 'OPTIONS') return send(res, 204, undefined);
  if (LATENCY > 0) await new Promise((r) => setTimeout(r, LATENCY));

  if (url.pathname === '/api/health') return send(res, 200, { ok: true, documents: TOTAL_DOCUMENTS });

  if (url.pathname === '/api/documents' && req.method === 'GET') {
    const query = parseQuery(url.searchParams);
    return typeof query === 'string' ? send(res, 400, { error: query }) : send(res, 200, listDocuments(query));
  }

  if (url.pathname === '/api/documents/counts' && req.method === 'GET') {
    return send(res, 200, countDocuments((url.searchParams.get('q') ?? '').trim()));
  }

  const match = /^\/api\/documents\/([\w-]+)(\/coding)?$/.exec(url.pathname);
  if (match) {
    const [, id, coding] = match;
    if (!coding && req.method === 'GET') {
      const doc = getDocument(id!);
      return doc ? send(res, 200, doc) : send(res, 404, { error: `No document ${id}` });
    }
    if (coding && req.method === 'PUT') {
      const body = validateCoding(await readJson(req));
      if (typeof body === 'string') return send(res, 422, { error: body });
      const saved = saveCoding(id!, body, reviewerFrom(req));
      return saved ? send(res, 200, saved) : send(res, 404, { error: `No document ${id}` });
    }
  }

  send(res, 404, { error: `No route for ${req.method} ${url.pathname}` });
});

server.listen(PORT, () => {
  console.log(`mock review API on http://localhost:${PORT}/api (${TOTAL_DOCUMENTS.toLocaleString()} documents, ${LATENCY}ms latency)`);
});
