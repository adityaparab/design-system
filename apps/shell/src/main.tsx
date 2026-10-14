import '@verity/design-system/styles.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router/dom';
import { initRemotes } from './platform/remotes';
import { SessionProvider } from './platform/session';
import { telemetry } from './platform/telemetry';
import { router } from './router';
import './shell.css';

const root = createRoot(document.getElementById('root')!);

/** Static deploys have no backend: the review API runs in this tab (see @verity/review-api/browser). */
async function startApi() {
  if (import.meta.env.VITE_API_MODE !== 'browser') return;
  const { installInBrowserReviewApi } = await import('@verity/review-api/browser');
  installInBrowserReviewApi();
}

Promise.all([startApi(), initRemotes()])
  .catch((error: unknown) => telemetry.error(error, { phase: 'remote-registry' }))
  .finally(() => {
    root.render(
      <StrictMode>
        <SessionProvider>
          <RouterProvider router={router} />
        </SessionProvider>
      </StrictMode>,
    );
  });
