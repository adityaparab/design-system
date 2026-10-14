// Standalone harness with a fake platform; events are logged instead of routed.
import { createEventBus, type PlatformContext } from '@verity/contracts';
import '@verity/design-system/styles.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { DocViewer } from './DocViewer';

const events = createEventBus((error) => console.error('[harness] event handler failed', error));
events.on('document.coded', (payload) => console.info('[harness] document.coded', payload));
events.on('review.advance', (payload) => console.info('[harness] review.advance', payload));

const platform: PlatformContext = {
  session: { userId: 'dev', displayName: 'Dev Reviewer', tenant: 'acme', accessToken: 'stub.dev.Dev%20Reviewer', roles: ['reviewer'] },
  apiBaseUrl: '/api',
  navigate: (to) => console.info('[harness] navigate', to),
  events,
  telemetry: {
    error: (error, context) => console.error('[harness] telemetry', error, context),
    event: (name, data) => console.info('[harness] event', name, data),
  },
};

const documentId = new URLSearchParams(window.location.search).get('doc') ?? 'VRT-0000003';

// Standalone deploys of a remote have no backend either.
if (import.meta.env.VITE_API_MODE === 'browser') {
  const { installInBrowserReviewApi } = await import('@verity/review-api/browser');
  installInBrowserReviewApi();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div style={{ height: '100vh', padding: 16 }}>
      <DocViewer platform={platform} documentId={documentId} />
    </div>
  </StrictMode>,
);
