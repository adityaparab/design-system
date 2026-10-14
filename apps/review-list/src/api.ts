import type { DocumentPage, DocumentQuery, PlatformContext, StatusCounts } from '@verity/contracts';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export function createApi(platform: PlatformContext) {
  const request = async <T>(path: string): Promise<T> => {
    const response = await fetch(`${platform.apiBaseUrl}${path}`, {
      headers: { authorization: `Bearer ${platform.session.accessToken}` },
    });
    if (!response.ok) throw new ApiError(`GET ${path} failed with ${response.status}`, response.status);
    return (await response.json()) as T;
  };

  return {
    list(query: DocumentQuery) {
      const params = new URLSearchParams({
        offset: String(query.offset),
        limit: String(query.limit),
        sort: query.sort,
        direction: query.direction,
        status: query.status,
        q: query.q,
      });
      return request<DocumentPage>(`/documents?${params}`);
    },
    counts(q: string) {
      return request<StatusCounts>(`/documents/counts?${new URLSearchParams({ q })}`);
    },
  };
}

export type ReviewApi = ReturnType<typeof createApi>;
