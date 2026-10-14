// Standalone harness: the remote runs on its own with a fake platform, so the
// owning team can develop and test it without the shell.
import { createEventBus, type PlatformContext } from '@verity/contracts';
import '@verity/design-system/styles.css';
import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ReviewList } from './ReviewList';

const platform: PlatformContext = {
  session: { userId: 'dev', displayName: 'Dev Reviewer', tenant: 'acme', accessToken: 'stub.dev.Dev%20Reviewer', roles: ['reviewer'] },
  apiBaseUrl: '/api',
  navigate: (to) => console.info('[harness] navigate', to),
  events: createEventBus((error) => console.error('[harness] event handler failed', error)),
  telemetry: {
    error: (error, context) => console.error('[harness] telemetry', error, context),
    event: (name, data) => console.info('[harness] event', name, data),
  },
};

function Harness() {
  const [active, setActive] = useState<string | null>(null);
  return (
    <div style={{ height: '100vh', padding: 16 }}>
      <ReviewList platform={platform} activeDocumentId={active} onOpenDocument={setActive} />
    </div>
  );
}

// Standalone deploys of a remote have no backend either.
if (import.meta.env.VITE_API_MODE === 'browser') {
  const { installInBrowserReviewApi } = await import('@verity/review-api/browser');
  installInBrowserReviewApi();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Harness />
  </StrictMode>,
);
