import { describe, expect, it } from 'vitest';
import { createReviewApi } from './router.js';

const api = createReviewApi();
const call = async (path: string, init?: RequestInit) => {
  const response = await api.handle(new Request(`http://localhost${path}`, init));
  return { status: response?.status, body: response ? await response.json() : null };
};

describe('review API router', () => {
  it('ignores non-API paths so callers can pass them through', async () => {
    expect(await api.handle(new Request('http://localhost/assets/app.js'))).toBeNull();
  });

  it('lists a page and validates query parameters', async () => {
    const ok = await call('/api/documents?limit=2&sort=relevance&direction=desc');
    expect(ok.status).toBe(200);
    expect(ok.body.items).toHaveLength(2);
    expect((await call('/api/documents?sort=nope')).status).toBe(400);
  });

  it('saves coding with the reviewer taken from the stub token', async () => {
    const res = await call('/api/documents/VRT-0000010/coding', {
      method: 'PUT',
      headers: { authorization: 'Bearer stub.pn.Priya%20Natarajan', 'content-type': 'application/json' },
      body: JSON.stringify({ decision: 'needs-review', privileged: false, note: '' }),
    });
    expect(res.status).toBe(200);
    expect(res.body.coding.codedBy).toBe('Priya Natarajan');
    expect((await call('/api/documents/VRT-0000010/coding', { method: 'PUT', body: '{}' })).status).toBe(422);
  });

  it('returns 404 for unknown documents and routes', async () => {
    expect((await call('/api/documents/NOPE')).status).toBe(404);
    expect((await call('/api/unknown')).status).toBe(404);
  });
});
