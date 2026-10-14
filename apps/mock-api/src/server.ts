import { createServer } from 'node:http';
import { Readable } from 'node:stream';
import { createReviewApi, TOTAL_DOCUMENTS } from '@verity/review-api';

const PORT = Number(process.env.PORT ?? 5180);
/** Simulated network latency in ms; override with LATENCY=0 for tests. */
const LATENCY = Number(process.env.LATENCY ?? 120);
const api = createReviewApi({ latencyMs: LATENCY });

// Thin Node adapter: IncomingMessage -> Fetch Request -> shared router -> ServerResponse.
const server = createServer(async (req, res) => {
  const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
  const request = new Request(new URL(req.url ?? '/', `http://${req.headers.host}`), {
    method: req.method,
    headers: req.headers as Record<string, string>,
    body: hasBody ? (Readable.toWeb(req) as ReadableStream) : undefined,
    duplex: hasBody ? 'half' : undefined,
  } as RequestInit);
  const response = (await api.handle(request)) ?? new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  res.writeHead(response.status, Object.fromEntries(response.headers));
  res.end(Buffer.from(await response.arrayBuffer()));
});

server.listen(PORT, () => {
  console.log(`mock review API on http://localhost:${PORT}/api (${TOTAL_DOCUMENTS.toLocaleString()} documents, ${LATENCY}ms latency)`);
});
