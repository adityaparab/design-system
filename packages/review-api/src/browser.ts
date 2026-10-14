import { createReviewApi, type ReviewApiOptions } from './router.js';

/**
 * Serves same-origin /api/* calls from the review API running in this tab.
 *
 * Used by static deploys that have no backend: each visitor gets a private,
 * in-memory sandbox. Remotes are unaffected; they keep calling fetch('/api/…').
 * Unlike a service worker, a patched fetch also works after a hard reload.
 */
export function installInBrowserReviewApi(options: ReviewApiOptions = { latencyMs: 120 }) {
  const api = createReviewApi(options);
  const nativeFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const raw = input instanceof Request ? input.url : String(input);
    const url = new URL(raw, window.location.href);
    if (url.origin === window.location.origin && url.pathname.startsWith('/api/')) {
      const response = await api.handle(new Request(url, input instanceof Request ? input : init));
      if (response) return response;
    }
    return nativeFetch(input, init);
  };
}
