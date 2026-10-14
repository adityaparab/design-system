import type { DocumentDetail, PlatformContext, SaveCodingRequest } from '@verity/contracts';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export function createApi(platform: PlatformContext) {
  const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
    const response = await fetch(`${platform.apiBaseUrl}${path}`, {
      ...init,
      headers: {
        authorization: `Bearer ${platform.session.accessToken}`,
        ...(init?.body ? { 'content-type': 'application/json' } : {}),
      },
    });
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      throw new ApiError(body.error ?? `${init?.method ?? 'GET'} ${path} failed with ${response.status}`, response.status);
    }
    return (await response.json()) as T;
  };

  return {
    get: (id: string) => request<DocumentDetail>(`/documents/${encodeURIComponent(id)}`),
    saveCoding: (id: string, body: SaveCodingRequest) =>
      request<DocumentDetail>(`/documents/${encodeURIComponent(id)}/coding`, { method: 'PUT', body: JSON.stringify(body) }),
  };
}
