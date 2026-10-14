import type { RemoteModule } from '@verity/contracts';
import { Button, Panel, Skeleton, Stack, StateMessage } from '@verity/design-system';
import { Component, useEffect, useState, type ErrorInfo, type ReactNode } from 'react';
import { IncompatibleRemoteError, loadRemoteModule, resetRemote, type RemoteId } from './remotes';
import { telemetry } from './telemetry';

interface BoundaryProps {
  id: RemoteId;
  title: string;
  buildId: string;
  resetKey?: string;
  onRetry: () => void;
  children: ReactNode;
}

interface BoundaryState {
  error: Error | null;
}

/** Contains render-time crashes inside one micro frontend. */
class RemoteErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  override state: BoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    telemetry.error(error, { remote: this.props.id, buildId: this.props.buildId, phase: 'render', componentStack: info.componentStack?.slice(0, 500) });
  }

  override componentDidUpdate(prev: BoundaryProps) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  override render() {
    if (!this.state.error) return this.props.children;
    return (
      <StateMessage
        tone="error"
        title={`${this.props.title} crashed`}
        action={
          <Button
            onClick={() => {
              this.setState({ error: null });
              this.props.onRetry();
            }}
          >
            Retry
          </Button>
        }
      >
        <p>The rest of the workspace still works. The error has been reported with build {this.props.buildId}.</p>
      </StateMessage>
    );
  }
}

/** Raw error text is for support staff; keep it out of the main message. */
function TechnicalDetails({ message }: { message: string }) {
  return (
    <details className="shell-details">
      <summary>Technical details</summary>
      <code>{message}</code>
    </details>
  );
}

type SlotState<P> =
  | { status: 'loading' }
  | { status: 'ready'; remote: RemoteModule<P> }
  | { status: 'failed'; error: Error }
  | { status: 'incompatible'; error: Error };

export interface RemoteSlotProps<P> {
  id: RemoteId;
  /** Human name used in loading and fallback states. */
  title: string;
  props: P;
  /** Changing this resets a crashed remote (e.g. a new document id). */
  resetKey?: string;
  /** Injectable for tests. */
  load?: (id: RemoteId) => Promise<RemoteModule<P>>;
}

/**
 * Mount point for a micro frontend. Handles the three ways a remote fails:
 * it cannot be fetched, it is built against an incompatible contract, or it
 * throws while rendering. In every case the shell and other remotes keep working.
 */
export function RemoteSlot<P extends object>({ id, title, props, resetKey, load = loadRemoteModule }: RemoteSlotProps<P>) {
  const [attempt, setAttempt] = useState(0);
  const key = `${id}#${attempt}`;
  const [stored, setStored] = useState<{ key: string; state: SlotState<P> }>({ key, state: { status: 'loading' } });
  // A new remote or a retry starts as loading, derived during render rather than reset in the effect.
  const state: SlotState<P> = stored.key === key ? stored.state : { status: 'loading' };

  useEffect(() => {
    let cancelled = false;
    load(id)
      .then((remote) => {
        if (!cancelled) setStored({ key, state: { status: 'ready', remote } });
      })
      .catch((error: Error) => {
        if (cancelled) return;
        setStored({ key, state: { status: error instanceof IncompatibleRemoteError ? 'incompatible' : 'failed', error } });
      });
    return () => {
      cancelled = true;
    };
  }, [id, key, load]);

  const retry = () => {
    resetRemote(id);
    setAttempt((n) => n + 1);
  };

  let content: ReactNode;
  if (state.status === 'loading') {
    content = (
      <Panel title={title} fill>
        <Stack gap={3}>
          <Skeleton width="40%" height="1.1em" />
          <Skeleton width="92%" />
          <Skeleton width="80%" />
          <p className="vds-visually-hidden" role="status">
            Loading {title}
          </p>
        </Stack>
      </Panel>
    );
  } else if (state.status === 'incompatible') {
    content = (
      <StateMessage tone="info" title={`${title} needs an update`}>
        <p>This part of the workspace was released ahead of the rest. It will be back after the next workspace update.</p>
        <TechnicalDetails message={state.error.message} />
      </StateMessage>
    );
  } else if (state.status === 'failed') {
    content = (
      <StateMessage tone="error" title={`${title} is unavailable`} action={<Button onClick={retry}>Retry</Button>}>
        <p>We could not load this part of the workspace. Everything else still works.</p>
        <TechnicalDetails message={state.error.message} />
      </StateMessage>
    );
  } else {
    const { Component: Remote, meta } = state.remote;
    content = (
      <RemoteErrorBoundary id={id} title={title} buildId={meta.buildId} resetKey={resetKey} onRetry={retry}>
        <Remote {...props} />
      </RemoteErrorBoundary>
    );
  }

  return (
    <div className="shell-slot" data-remote={id} data-status={state.status}>
      {content}
    </div>
  );
}
